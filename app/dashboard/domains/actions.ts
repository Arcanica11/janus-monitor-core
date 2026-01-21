"use server";

import { createClient } from "@/utils/supabase/server";

export async function getAllDomains() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .single();

  let query = supabase
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
    .order("expiration_date", { ascending: true }); // Expiring soon first

  // Filter by organization if not super admin
  if (profile?.role !== "super_admin" && profile?.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all domains:", error);
    return [];
  }

  return data;
}
