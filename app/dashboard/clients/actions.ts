"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

// 1. GET CLIENTS (RBAC ENFORCED)
export async function getClients() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get User Role & Org
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";
  const userOrgId = profile?.organization_id;

  const admin = createAdminClient();

  if (isSuperAdmin) {
    // Super Admin: Fetch ALL clients, linked to orgs
    const { data } = await admin
      .from("clients")
      .select("*, organizations(name, id)")
      .order("created_at", { ascending: false });
    return data || [];
  } else {
    // Regular Admin: Fetch ONLY their org's clients
    if (!userOrgId) return [];

    const { data } = await admin
      .from("clients")
      .select("*, organizations(name)")
      .eq("organization_id", userOrgId) // Strict Filter
      .order("created_at", { ascending: false });
    return data || [];
  }
}

// 2. UPDATE CLIENT (With Validation)
export async function updateClient(
  clientId: string,
  formData: FormData,
  orgId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const name = formData.get("name") as string;
  const contactName = formData.get("contact_name") as string;
  const email = formData.get("contact_email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;

  if (!name) return { error: "El nombre es obligatorio." };

  // Validate Name Duplication (Exclude self)
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("clients")
    .select("id")
    .eq("organization_id", orgId)
    .ilike("name", name)
    .neq("id", clientId)
    .single();

  if (existing) {
    return {
      error: "Ya existe un cliente con este nombre en la organización.",
    };
  }

  // Update
  const { error } = await admin
    .from("clients")
    .update({
      name,
      contact_name: contactName,
      contact_email: email,
      contact_phone: phone,
      address,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  await logAuditEvent("UPDATE_CLIENT", `clients:${clientId}`, {
    name,
    updated_by: user.email,
  });

  revalidatePath("/dashboard/clients");
  return { success: true };
}

// 3. DELETE CLIENT (Super Admin Only)
export async function deleteClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Strict Role Check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return {
      error: "Acción no autorizada. Solo Super Admins pueden eliminar.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("clients").delete().eq("id", clientId);

  if (error) return { error: error.message };

  await logAuditEvent("DELETE_CLIENT", `clients:${clientId}`, {
    deleted_by: user.email,
  });

  revalidatePath("/dashboard/clients");
  return { success: true };
}

// ... existing code ...
export async function getOrganizations() {
  console.log("--> [DEBUG] getOrganizations: Iniciando ejecución...");
  try {
    const admin = createAdminClient();
    // USAR ADMIN CLIENT: Garantiza que traiga todas las organizaciones ignorando RLS
    const { data, error } = await admin
      .from("organizations")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("--> [DEBUG] getOrganizations: ERROR DB:", error);
      return [];
    }

    console.log(
      `--> [DEBUG] getOrganizations: Éxito. Registros encontrados: ${data?.length || 0}`,
    );
    return data || [];
  } catch (error) {
    console.error("--> [DEBUG] getOrganizations: Error crítico:", error);
    return [];
  }
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Verificar Autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // 2. Obtener Rol y Organización del Usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";

  // 3. Extraer datos del FormData
  const name = formData.get("name") as string;
  const email = formData.get("contact_email") as string;
  const contactName = formData.get("contact_name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const formOrgId = formData.get("organization_id") as string;

  if (!name) return { error: "El nombre de la empresa es obligatorio." };

  // 4. Determinar ID de Organización Final
  let finalOrgId = "";

  if (isSuperAdmin) {
    if (!formOrgId) {
      console.error(
        "--> [DEBUG] createClientAction: Fallo validación SuperAdmin - Falta OrgID",
      );
      return { error: "Como Super Admin, debes seleccionar una organización." };
    }
    finalOrgId = formOrgId;
  } else {
    // Si no es admin, forzamos su organización
    finalOrgId = profile?.organization_id;
    if (!finalOrgId)
      return { error: "Tu usuario no tiene organización asignada." };
  }

  // 5. Insertar usando ADMIN CLIENT para evitar bloqueos por políticas
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({
      name,
      contact_email: email,
      contact_name: contactName,
      contact_phone: phone,
      address: address,
      organization_id: finalOrgId,
      created_by: user.id,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("--> [DEBUG] createClientAction: Error al insertar:", error);
    return { error: error.message };
  }

  await logAuditEvent("CREATE_CLIENT", `clients:${data?.id || "unknown"}`, {
    name,
    created_by_email: user.email,
    role: profile?.role,
    organization_id: finalOrgId,
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

// Quick Create for Combobox
export async function quickCreateClient(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return {
      error: "Para Quick Create debes tener una organización asignada.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({
      name,
      organization_id: profile.organization_id,
      status: "active",
    })
    .select("id, name")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard", "layout");
  return { client: data };
}
