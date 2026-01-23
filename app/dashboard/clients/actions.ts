"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });
  return data;
}

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

  // 3. Extraer datos del FormData y Log
  const name = formData.get("name") as string;
  const email = formData.get("contact_email") as string;
  const formOrgId = formData.get("organization_id") as string;

  console.log("--> [DEBUG] createClientAction: Datos recibidos:", {
    name,
    email,
    formOrgId,
    rolDetectado: profile?.role,
    isSuperAdmin,
  });

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
  const { error } = await admin.from("clients").insert({
    name,
    contact_email: email,
    organization_id: finalOrgId,
    status: "active",
  });

  if (error) {
    console.error("--> [DEBUG] createClientAction: Error al insertar:", error);
    return { error: error.message };
  }

  console.log("--> [DEBUG] createClientAction: Cliente creado con éxito");
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
