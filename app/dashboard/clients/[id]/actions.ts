"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// FETCH FULL DETAILS
export async function getClientFullDetails(clientId: string) {
  const supabase = await createClient();

  // 1. Fetch Client Basic Info
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    return null;
  }

  // 2. Fetch Credentials
  const { data: credentials } = await supabase
    .from("credentials")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // 3. Fetch Services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  // 4. Fetch Domains
  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .eq("linked_client_id", clientId)
    .order("expiration_date", { ascending: true });

  // 5. Fetch Tickets (NEW)
  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return {
    client,
    credentials: credentials || [],
    services: services || [],
    domains: domains || [],
    tickets: tickets || [],
  };
}

// UPDATE PROFILE
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

  if (error) {
    return { error: "Error actualizando perfil" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// ADD CREDENTIAL
export async function addCredential(clientId: string, formData: FormData) {
  const supabase = await createClient();

  // Get Organization ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();
  if (!profile?.organization_id) return { error: "No org found" };

  const type = formData.get("type") as string;
  const service_name = formData.get("service_name") as string;
  const username = formData.get("username") as string;
  const password_hash = formData.get("password") as string; // Storing as 'hash' field but raw for now as requested
  const url = formData.get("url") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("credentials").insert({
    client_id: clientId,
    organization_id: profile.organization_id,
    type,
    service_name,
    username,
    password_hash,
    url,
    notes,
  });

  if (error) {
    console.error(error);
    return { error: "Error guardando credencial" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// DELETE CREDENTIAL
export async function deleteCredential(credentialId: string, clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("credentials")
    .delete()
    .eq("id", credentialId);

  if (error) return { error: "Error eliminando" };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// ADD SERVICE
export async function addService(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();
  if (!profile?.organization_id) return { error: "No org found" };

  const name = formData.get("name") as string;
  const cost = parseFloat(formData.get("cost") as string);
  const billing_cycle = formData.get("billing_cycle") as string;
  const next_billing_date = formData.get("next_billing_date") as string;

  const { error } = await supabase.from("services").insert({
    client_id: clientId,
    organization_id: profile.organization_id,
    name,
    cost,
    billing_cycle,
    next_billing_date: next_billing_date || null,
  });

  if (error) return { error: "Error creando servicio" };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// DELETE SERVICE
export async function deleteService(serviceId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);
  if (error) return { error: "Error eliminando" };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// CREATE TICKET (NEW)
export async function createTicket(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();
  if (!profile?.organization_id) return { error: "No org found" };

  const title = formData.get("title") as string;
  const type = formData.get("type") as string;
  const description = formData.get("description") as string;
  const is_billable = formData.get("is_billable") === "on";
  const cost = formData.get("cost")
    ? parseFloat(formData.get("cost") as string)
    : 0;

  const { error } = await supabase.from("tickets").insert({
    client_id: clientId,
    organization_id: profile.organization_id,
    title,
    type,
    description,
    is_billable,
    cost,
    status: "open",
  });

  if (error) {
    console.error("Error creating ticket:", error);
    return { error: "Error creando ticket" };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}
