"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  const supabase = await createClient();

  // 1. Total Domains
  const { count: totalDomains, error: errDomains } = await supabase
    .from("domains")
    .select("*", { count: "exact", head: true });

  // 2. Expiring Domains (< 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { count: expiringDomains, error: errExpiring } = await supabase
    .from("domains")
    .select("*", { count: "exact", head: true })
    .lt("expiration_date", thirtyDaysFromNow.toISOString())
    .eq("status", "active");

  // 3. Open Tickets
  const { count: openTickets, error: errTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .neq("status", "resolved")
    .neq("status", "closed");

  if (errDomains || errExpiring || errTickets) {
    console.error("Error fetching stats:", errDomains, errExpiring, errTickets);
    return {
      totalDomains: 0,
      expiringDomains: 0,
      openTickets: 0,
    };
  }

  return {
    totalDomains: totalDomains || 0,
    expiringDomains: expiringDomains || 0,
    openTickets: openTickets || 0,
  };
}

export async function getDomains() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("domains")
    .select(
      `
      *,
      clients (
        name,
        unique_client_id
      )
    `,
    )
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error("Error fetching domains:", error);
    return [];
  }

  return data;
}

export async function getClients() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  return data;
}

export async function getClientsForSelect() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching clients for select:", error);
    return [];
  }

  return data;
}

export async function addDomain(formData: FormData) {
  const supabase = await createClient();

  const url = formData.get("url") as string;
  const client_id = formData.get("client_id") as string;
  const provider = formData.get("provider") as string;
  const expiration_date = formData.get("expiration_date") as string;
  const renewal_price = formData.get("renewal_price")
    ? parseFloat(formData.get("renewal_price") as string)
    : 0;

  if (!client_id) {
    return { error: "Debes seleccionar un cliente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  if (!profile?.organization_id) {
    return { error: "No se pudo identificar la organización del usuario." };
  }

  const { error } = await supabase.from("domains").insert({
    url,
    linked_client_id: client_id,
    provider,
    expiration_date: new Date(expiration_date).toISOString(),
    organization_id: profile.organization_id,
    renewal_price: renewal_price,
  });

  if (error) {
    console.error("Add Domain Error:", error);
    return { error: "Error al crear dominio. Verifica los datos." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
