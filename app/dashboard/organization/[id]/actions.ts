"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to check permissions (Basic check, RLS handles most)
async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function getOrganizationFullDetails(orgId: string) {
  console.log("--> getOrganizationFullDetails", { orgId });
  const { supabase } = await getAuthenticatedClient();

  // 1. Get Organization
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError) {
    console.error("Error fetching organization:", orgError);
    return null;
  }

  // 2. Get Subscriptions (Now merged with Credentials)
  const { data: subscriptions } = await supabase
    .from("org_subscriptions")
    .select("*")
    .eq("organization_id", orgId)
    .order("next_billing_date", { ascending: true });

  // 3. Get Assets
  const { data: assets } = await supabase
    .from("org_assets")
    .select("*")
    .eq("organization_id", orgId)
    .order("expiration_date", { ascending: true });

  // 4. Get Corporate Emails (New Table)
  const { data: corporateEmails } = await supabase
    .from("org_corporate_emails")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  // 5. Get Members
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", orgId);

  console.log("--> Data fetched successfully for Org:", orgId);

  return {
    organization,
    subscriptions: subscriptions || [],
    assets: assets || [],
    corporateEmails: corporateEmails || [],
    members: members || [],
  };
}

// UPDATE ORGANIZATION
export async function updateOrganization(orgId: string, formData: FormData) {
  const dataMap = Object.fromEntries(formData);
  console.log("--> updateOrganization", { orgId, data: dataMap });

  try {
    const { supabase } = await getAuthenticatedClient();

    const name = formData.get("name") as string;
    const website = formData.get("website") as string;
    const tax_id = formData.get("tax_id") as string;
    const contact_email = formData.get("contact_email") as string;

    const { error } = await supabase
      .from("organizations")
      .update({ name, website, tax_id, contact_email })
      .eq("id", orgId);

    console.log("--> DB Result updateOrganization:", { error: error?.message });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in updateOrganization:", e);
    return { error: e.message };
  }
}

// ADD SUBSCRIPTION (Merged SaaS + Credentials)
export async function addSubscription(orgId: string, formData: FormData) {
  const dataMap = Object.fromEntries(formData);
  // Hide password in logs
  if (dataMap.login_password) dataMap.login_password = "***HIDDEN***";
  console.log("--> addSubscription", { orgId, data: dataMap });

  try {
    const { supabase } = await getAuthenticatedClient();

    // Basic Sub Info
    const service_name = formData.get("service_name") as string;
    const provider = formData.get("provider") as string;
    const costRaw = formData.get("cost");
    const cost = costRaw ? parseFloat(costRaw as string) : 0;
    const billing_cycle = formData.get("billing_cycle") as string;
    const next_billing_date = formData.get("next_billing_date") as string;

    // New Credentials Info
    const login_email = formData.get("login_email") as string;
    const login_password = formData.get("login_password") as string;
    const tier = formData.get("tier") as string;

    const { error } = await supabase.from("org_subscriptions").insert({
      organization_id: orgId,
      service_name,
      provider,
      cost,
      billing_cycle,
      next_billing_date: next_billing_date || null,
      login_email,
      login_password,
      tier,
    });

    console.log("--> DB Result addSubscription:", { error: error?.message });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in addSubscription:", e);
    return { error: e.message };
  }
}

// ADD CORPORATE EMAIL
export async function addCorporateEmail(orgId: string, formData: FormData) {
  const dataMap = Object.fromEntries(formData);
  if (dataMap.password) dataMap.password = "***HIDDEN***";
  console.log("--> addCorporateEmail", { orgId, data: dataMap });

  try {
    const { supabase } = await getAuthenticatedClient();

    const email_address = formData.get("email_address") as string;
    const password = formData.get("password") as string;
    const assigned_to = formData.get("assigned_to") as string;

    const { error } = await supabase.from("org_corporate_emails").insert({
      organization_id: orgId,
      email_address,
      password,
      assigned_to,
    });

    console.log("--> DB Result addCorporateEmail:", { error: error?.message });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in addCorporateEmail:", e);
    return { error: e.message };
  }
}

// ADD ASSET
export async function addAsset(orgId: string, formData: FormData) {
  const dataMap = Object.fromEntries(formData);
  console.log("--> addAsset", { orgId, data: dataMap });

  try {
    const { supabase } = await getAuthenticatedClient();

    const type = formData.get("type") as string;
    const name = formData.get("name") as string;
    const registrar = formData.get("registrar") as string;
    const expiration_date = formData.get("expiration_date") as string;
    const notes = formData.get("notes") as string;

    const { error } = await supabase.from("org_assets").insert({
      organization_id: orgId,
      type,
      name,
      registrar,
      expiration_date: expiration_date || null,
      notes,
    });

    console.log("--> DB Result addAsset:", { error: error?.message });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in addAsset:", e);
    return { error: e.message };
  }
}

// DELETE ITEM (Generic)
export async function deleteItem(
  table: "org_subscriptions" | "org_assets" | "org_corporate_emails",
  id: string,
  orgId: string,
) {
  console.log("--> deleteItem", { table, id, orgId });
  try {
    const { supabase } = await getAuthenticatedClient();

    const { error } = await supabase.from(table).delete().eq("id", id);

    console.log("--> DB Result deleteItem:", { error: error?.message });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in deleteItem:", e);
    return { error: e.message };
  }
}
