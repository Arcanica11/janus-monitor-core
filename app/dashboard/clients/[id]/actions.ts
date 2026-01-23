"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin"; // IMPORTANTE: Admin Client
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/utils/encryption";

// Helper para obtener la organización del cliente de forma segura
async function getClientOrganizationId(clientId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (error || !data) {
    console.error("Error fetching client organization:", error);
    return null;
  }
  return data.organization_id;
}

// 1. OBTENER DETALLES COMPLETOS (Full Fetch)
export async function getClientFullDetails(clientId: string) {
  const supabase = await createClient();

  // A. Info Básica
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*, organizations(name)")
    .eq("id", clientId)
    .single();

  if (clientError || !client) return null;

  // B. Consultas Paralelas para velocidad
  const [creds, servs, doms, ticks, social] = await Promise.all([
    supabase
      .from("credentials")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("domains")
      .select("*")
      .eq("linked_client_id", clientId)
      .order("expiration_date", { ascending: true }),
    supabase
      .from("tickets")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("social_vault")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    client,
    credentials: creds.data || [],
    services: servs.data || [],
    domains: doms.data || [],
    tickets: ticks.data || [],
    social_credentials:
      social.data?.map((s) => ({
        ...s,
        password: s.password ? "********" : null,
      })) || [],
  };
}

// 2. ACTUALIZAR PERFIL
export async function updateClientProfile(
  clientId: string,
  formData: FormData,
) {
  const supabase = await createClient(); // Update puede usar cliente normal si hay políticas, o admin si falla
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const industry = formData.get("industry") as string;
  const notes = formData.get("notes") as string;
  const name = formData.get("name") as string; // New field

  // Check role for sensitive updates
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Assume basic user is 'admin' or 'user', only 'super_admin' can change name.
  // We can do a quick check or just try update and let RLS fail/succeed if we set strict col policies,
  // but standard RLS is usually row-based.
  // Column-level RLS is not standard in Supabase UI but doable in SQL.
  // Instead, we check here:

  let updates: any = { address, phone, industry, notes };

  if (name) {
    // Check if user is super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();
    if (profile?.role === "super_admin") {
      updates.name = name;
    } else {
      // Ignore name update silently or throw?
      // Since UI is disabled, if they bypass, we just ignore.
    }
  }

  const { error } = await supabase
    .from("clients")
    .update({ address, phone, industry, notes })
    .eq("id", clientId);

  if (error) return { error: "Error actualizando" };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 3. AGREGAR CREDENCIAL (REFACTORIZADO)
export async function addCredential(clientId: string, formData: FormData) {
  // 1. Obtener Org ID del Cliente (Admin)
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId)
    return { error: "No se pudo identificar la organización del cliente." };

  // 2. Insertar con Admin Client
  const admin = createAdminClient();
  const { error } = await admin.from("credentials").insert({
    client_id: clientId,
    organization_id: orgId,
    type: formData.get("type") as string,
    service_name: formData.get("service_name") as string,
    username: formData.get("username") as string,
    password_hash: formData.get("password") as string,
    url: formData.get("url") as string,
    notes: formData.get("notes") as string,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 4. ELIMINAR CREDENCIAL
export async function deleteCredential(credentialId: string, clientId: string) {
  const supabase = await createClient();
  await supabase.from("credentials").delete().eq("id", credentialId);
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 5. AGREGAR SERVICIO (REFACTORIZADO)
export async function addService(clientId: string, formData: FormData) {
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId)
    return { error: "No se pudo identificar la organización del cliente." };

  const admin = createAdminClient();
  const { error } = await admin.from("services").insert({
    client_id: clientId,
    organization_id: orgId,
    name: formData.get("name") as string,
    cost: parseFloat(formData.get("cost") as string),
    billing_cycle: formData.get("billing_cycle") as string,
    next_billing_date: (formData.get("next_billing_date") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 6. ELIMINAR SERVICIO
export async function deleteService(serviceId: string, clientId: string) {
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", serviceId);
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 7. CREAR TICKET (REFACTORIZADO)
export async function createTicket(clientId: string, formData: FormData) {
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId)
    return { error: "No se pudo identificar la organización del cliente." };

  const admin = createAdminClient();
  const { error } = await admin.from("tickets").insert({
    client_id: clientId,
    organization_id: orgId,
    title: formData.get("title") as string,
    type: formData.get("type") as string,
    description: formData.get("description") as string,
    is_billable: formData.get("is_billable") === "on",
    cost: formData.get("cost") ? parseFloat(formData.get("cost") as string) : 0,
    status: "open",
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 8. CREAR RED SOCIAL (REFACTORIZADO)
export async function createSocialCredential(
  clientId: string,
  formData: FormData,
) {
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId)
    return { error: "No se pudo identificar la organización del cliente." };

  const admin = createAdminClient();
  const { error } = await admin.from("social_vault").insert({
    client_id: clientId,
    organization_id: orgId,
    platform: formData.get("platform") as string,
    username: formData.get("username") as string,
    password: encrypt(formData.get("password") as string),
    recovery_email: formData.get("recovery_email") as string,
    url: formData.get("url") as string,
    notes: formData.get("notes") as string,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 9. ACTUALIZAR ESTADO DE TICKET
export async function updateTicketStatus(
  ticketId: string,
  status: string,
  id: string,
) {
  const supabase = await createClient();

  // Actualizamos
  const { data, error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId)
    .select("client_id") // Traemos el ID del cliente para revalidar la página correcta
    .single();

  if (error) {
    console.error("Error updating ticket:", error);
    return { error: error.message };
  }

  // Revalidación inteligente
  if (data?.client_id) {
    revalidatePath(`/dashboard/clients/${data.client_id}`);
  } else {
    // Fallback por si acaso
    revalidatePath("/dashboard/clients/[id]");
  }

  return { success: true };
}

// 10. REVELAR CONTRASEÑA (SOCIAL)
export async function revealSocialPassword(credentialId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_vault")
    .select("password")
    .eq("id", credentialId)
    .single();

  if (error || !data) {
    return {
      error: "No se pudo recuperar la credencial o no tienes permisos.",
    };
  }

  return { password: decrypt(data.password) };
}
