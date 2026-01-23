"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// SECURITY: Double-Lock - Explicit Organization Filtering
// NEVER rely solely on RLS for multi-tenant isolation
export async function getAllDomains() {
  const supabase = await createClient();

  // 1. Verify Authenticated User
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error(">>> [SECURITY] getAllDomains: No authenticated user");
    throw new Error("No autorizado");
  }

  console.log(">>> [SECURITY] getAllDomains: User authenticated:", user.id);

  // 2. Get User's Organization ID (Current Context)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    console.error(
      ">>> [SECURITY] getAllDomains: User has no organization",
      profileError,
    );
    throw new Error("Usuario no tiene organización asignada");
  }

  console.log(
    `>>> [SECURITY] getAllDomains: User org=${profile.organization_id}, role=${profile.role}`,
  );

  // 3. DOUBLE-LOCK Query: Only domains from THIS organization
  // CRITICAL: Explicit .eq() filter - DO NOT remove this
  const { data, error } = await supabase
    .from("domains_master")
    .select(
      `
      *,
      clients (
        name,
        unique_client_id
      ),
      organizations (
        name
      )
    `,
    )
    .eq("organization_id", profile.organization_id) // 🔒 LOCK: Only this org
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error(">>> [SECURITY] getAllDomains: Query error:", error);
    throw new Error(error.message);
  }

  console.log(
    `>>> [SECURITY] getAllDomains: Returned ${data?.length || 0} domains for org ${profile.organization_id}`,
  );

  return data || [];
}

export async function addDomainMaster(formData: FormData) {
  const admin = createAdminClient();
  const supabase = await createClient();

  // Extract form data
  const domain = formData.get("domain") as string;
  const clientIdRaw = formData.get("client_id") as string;
  const registrar = formData.get("registrar") as string;
  const hosting_provider = formData.get("hosting_provider") as string;
  const account_owner = formData.get("account_owner") as string;
  const renewal_price = formData.get("renewal_price")
    ? parseFloat(formData.get("renewal_price") as string)
    : 0;
  const expiration_date = formData.get("expiration_date") as string;

  console.log(">>> [DEBUG DOMAINS] addDomainMaster: Started...", {
    domain,
    clientIdRaw,
    registrar,
    hosting_provider,
    account_owner,
  });

  if (!domain) {
    return { error: "El dominio es requerido." };
  }

  // Handle client_id (null = Interno/Org-owned)
  const client_id =
    clientIdRaw && clientIdRaw !== "null" && clientIdRaw !== ""
      ? clientIdRaw
      : null;

  // Get organization_id
  let organization_id: string;

  if (client_id) {
    // Lookup organization via client
    const { data: clientData, error: clientError } = await admin
      .from("clients")
      .select("organization_id")
      .eq("id", client_id)
      .single();

    if (clientError || !clientData) {
      console.error(
        ">>> [DEBUG DOMAINS] addDomainMaster: Error finding client org:",
        clientError,
      );
      return { error: "No se pudo validar la organización del cliente." };
    }

    organization_id = clientData.organization_id;
  } else {
    // Internal domain - use current user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .single();

    if (!profile?.organization_id) {
      return { error: "No se pudo determinar la organización." };
    }

    organization_id = profile.organization_id;
  }

  console.log(
    ">>> [DEBUG DOMAINS] addDomainMaster: Target Org ID:",
    organization_id,
  );

  // Insert domain
  const { error: insertError } = await admin.from("domains_master").insert({
    domain,
    client_id,
    organization_id,
    registrar,
    hosting_provider,
    account_owner,
    renewal_price,
    expiration_date: new Date(expiration_date).toISOString(),
    status: "active",
  });

  if (insertError) {
    console.error(
      ">>> [DEBUG DOMAINS] addDomainMaster: Insert Error:",
      insertError,
    );
    return { error: "Error al crear dominio: " + insertError.message };
  }

  console.log(">>> [DEBUG DOMAINS] addDomainMaster: Success!");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/domains");
  return { success: true };
}

export async function updateDomainMaster(id: string, formData: FormData) {
  const admin = createAdminClient();

  const domain = formData.get("domain") as string;
  const registrar = formData.get("registrar") as string;
  const hosting_provider = formData.get("hosting_provider") as string;
  const account_owner = formData.get("account_owner") as string;
  const renewal_price = formData.get("renewal_price")
    ? parseFloat(formData.get("renewal_price") as string)
    : 0;
  const expiration_date = formData.get("expiration_date") as string;

  const { error } = await admin
    .from("domains_master")
    .update({
      domain,
      registrar,
      hosting_provider,
      account_owner,
      renewal_price,
      expiration_date: new Date(expiration_date).toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(">>> [DEBUG DOMAINS] updateDomainMaster: Error:", error);
    return { error: "Error al actualizar dominio: " + error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/domains");
  return { success: true };
}

export async function deleteDomainMaster(id: string) {
  const admin = createAdminClient();

  const { error } = await admin.from("domains_master").delete().eq("id", id);

  if (error) {
    console.error(">>> [DEBUG DOMAINS] deleteDomainMaster: Error:", error);
    return { error: "Error al eliminar dominio: " + error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/domains");
  return { success: true };
}
