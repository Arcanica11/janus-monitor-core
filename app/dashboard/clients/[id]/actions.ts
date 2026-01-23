"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function getClientDetails(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use Admin to bypass potential basic RLS issues and get created_by info if needed (though public profile should be fine)
  // For 'created_by', we might want to join with profiles.
  const admin = createAdminClient();

  // 1. Get Client Data
  const { data: client, error } = await admin
    .from("clients")
    .select(
      `
      *,
      organizations(name, id)
    `,
    )
    .eq("id", clientId)
    .single();

  if (error || !client) {
    console.error("Error fetching client details:", error);
    return null;
  }

  // 2. Security Check: Ensure User belongs to the same org (unless Super Admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";

  if (!isSuperAdmin && client.organization_id !== profile?.organization_id) {
    console.error("Unauthorized access to client detail");
    return null;
  }

  // 3. Get Creator Email (Manual join because created_by is raw uuid)
  let creatorEmail = "Desconocido";
  if (client.created_by) {
    const { data: creator } = await admin
      .from("profiles")
      .select("email")
      .eq("id", client.created_by)
      .single();
    if (creator) creatorEmail = creator.email;
  }

  return {
    ...client,
    creator_email: creatorEmail,
    currentUserRole: profile?.role,
  };
}

export async function getClientDomains(clientId: string) {
  const supabase = await createClient();

  // No strict auth check needed here if page.tsx handles it, but good practice.
  // We assume the page already validated access via getClientDetails return.

  const { data, error } = await supabase
    .from("domains_master")
    .select("*")
    .eq("client_id", clientId)
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error("Error fetching client domains:", error);
    return [];
  }

  return data;
}
