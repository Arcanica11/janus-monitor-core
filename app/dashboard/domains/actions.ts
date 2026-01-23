"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getAllDomains() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .single();

  console.log(">>> [DEBUG DOMAINS] getAllDomains: Profile:", profile);

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
    console.log(
      ">>> [DEBUG DOMAINS] getAllDomains: Filtering by org",
      profile.organization_id,
    );
    query = query.eq("organization_id", profile.organization_id);
  } else {
    console.log(
      ">>> [DEBUG DOMAINS] getAllDomains: Super Admin or No Org - Fetching All",
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      ">>> [DEBUG DOMAINS] getAllDomains: Error fetching all domains:",
      error,
    );
    return [];
  }

  console.log(
    `>>> [DEBUG DOMAINS] getAllDomains: Found ${data?.length || 0} domains`,
  );
  return data;
}

export async function addDomain(formData: FormData) {
  const supabase = await createClient();
  // We use admin client to lookup orgs and insert to bypass RLS issues
  // when the user is a super admin but context might be loose
  const admin = createAdminClient();

  const url = formData.get("url") as string;
  const client_id = formData.get("client_id") as string;
  const provider = formData.get("provider") as string;
  const provider_account = formData.get("provider_account") as string;
  const expiration_date = formData.get("expiration_date") as string;
  const renewal_price = formData.get("renewal_price")
    ? parseFloat(formData.get("renewal_price") as string)
    : 0;

  console.log(">>> [DEBUG DOMAINS] addDomain: Started...", {
    url,
    client_id,
    provider,
    provider_account,
  });

  if (!client_id) {
    return { error: "Debes seleccionar un cliente." };
  }

  // 1. LOOKUP ORGANIZATION VIA CLIENT ID (The Safe Way)
  console.log(
    ">>> [DEBUG DOMAINS] addDomain: Looking up organization for client:",
    client_id,
  );

  const { data: clientData, error: clientError } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", client_id)
    .single();

  if (clientError || !clientData) {
    console.error(
      ">>> [DEBUG DOMAINS] addDomain: Error finding client org:",
      clientError,
    );
    return { error: "No se pudo validar la organización del cliente." };
  }

  const targetOrgId = clientData.organization_id;
  console.log(
    ">>> [DEBUG DOMAINS] addDomain: Found Target Org ID:",
    targetOrgId,
  );

  // 2. INSERT DOMAIN
  const { error: insertError } = await admin.from("domains").insert({
    url,
    linked_client_id: client_id,
    provider,
    provider_account,
    expiration_date: new Date(expiration_date).toISOString(),
    organization_id: targetOrgId,
    renewal_price: renewal_price,
    status: "active",
  });

  if (insertError) {
    console.error(">>> [DEBUG DOMAINS] addDomain: Insert Error:", insertError);
    return { error: "Error al crear dominio: " + insertError.message };
  }

  console.log(">>> [DEBUG DOMAINS] addDomain: Success!");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/domains");
  return { success: true };
}
