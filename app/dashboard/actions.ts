"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getDashboardStats() {
  const supabase = await createClient();

  // 1. Total Clients
  const { count: totalClients, error: errClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true });

  // 2. Active Projects (not completed)
  const { count: activeProjects, error: errProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .not("status", "eq", "completed")
    .not("status", "eq", "cancelled");

  // 3. Open Tickets (open or in_progress)
  const { count: openTickets, error: errTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .neq("status", "closed")
    .neq("status", "resolved");

  // 4. Calculate ARR (Annual Recurring Revenue)
  // Fetch active domains renewal prices
  const { data: domains, error: errDomains } = await supabase
    .from("domains")
    .select("renewal_price")
    .eq("status", "active");

  // Fetch active services costs
  const { data: services, error: errServices } = await supabase
    .from("services")
    .select("cost, billing_cycle")
    .eq("status", "active");

  if (errClients || errProjects || errTickets || errDomains || errServices) {
    console.error(
      "Error fetching stats:",
      errClients,
      errProjects,
      errTickets,
      errDomains,
      errServices,
    );
    // Return zeros on error but don't crash
    return {
      totalClients: 0,
      activeProjects: 0,
      openTickets: 0,
      revenue: 0,
    };
  }

  let revenue = 0;

  // Sum Domain Renewals (Assumed Yearly)
  const domainRevenue =
    domains?.reduce((sum, item) => {
      const val = Number(item.renewal_price);
      return sum + (isNaN(val) ? 0 : val);
    }, 0) || 0;

  revenue += domainRevenue;

  // Sum Services (Monthly * 12, Yearly * 1)
  services?.forEach((s) => {
    const cost = Number(s.cost || 0);
    const safeCost = isNaN(cost) ? 0 : cost;

    if (s.billing_cycle === "monthly") {
      revenue += safeCost * 12;
    } else if (s.billing_cycle === "yearly") {
      revenue += safeCost;
    }
  });

  return {
    totalClients: totalClients ?? 0,
    activeProjects: activeProjects ?? 0,
    openTickets: openTickets ?? 0,
    revenue,
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
