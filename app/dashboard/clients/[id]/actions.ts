"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    social_credentials: social.data || [],
  };
}

// 2. ACTUALIZAR PERFIL
export async function updateClientProfile(
  clientId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const industry = formData.get("industry") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase
    .from("clients")
    .update({ address, phone, industry, notes })
    .eq("id", clientId);

  if (error) return { error: "Error actualizando" };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 3. AGREGAR CREDENCIAL
export async function addCredential(clientId: string, formData: FormData) {
  const supabase = await createClient();

  // Get Org ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();
  if (!profile) return { error: "No profile" };

  const { error } = await supabase.from("credentials").insert({
    client_id: clientId,
    organization_id: profile.organization_id,
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

// 5. AGREGAR SERVICIO
export async function addService(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  const { error } = await supabase.from("services").insert({
    client_id: clientId,
    organization_id: profile?.organization_id,
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

// 7. CREAR TICKET
export async function createTicket(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  const { error } = await supabase.from("tickets").insert({
    client_id: clientId,
    organization_id: profile?.organization_id,
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

// 8. CREAR RED SOCIAL (SOCIAL VAULT)
export async function createSocialCredential(
  clientId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  const { error } = await supabase.from("social_vault").insert({
    client_id: clientId,
    organization_id: profile?.organization_id,
    platform: formData.get("platform") as string,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
    recovery_email: formData.get("recovery_email") as string,
    url: formData.get("url") as string,
    notes: formData.get("notes") as string,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 9. ACTUALIZAR ESTADO DE TICKET (LA FUNCIÓN QUE FALTABA)
export async function updateTicketStatus(ticketId: string, status: string) {
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
