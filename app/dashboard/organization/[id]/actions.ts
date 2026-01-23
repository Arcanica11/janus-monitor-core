"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { encrypt, decrypt } from "@/utils/encryption";

// SECURITY: Get Organization's Internal Assets (domains_master)
// CRITICAL: Double filter to prevent cross-org data leakage
async function getOrganizationAssets(orgId: string) {
  const supabase = await createClient();

  console.log("--> getOrganizationAssets: Fetching for org", orgId);

  const { data, error } = await supabase
    .from("domains_master")
    .select("*")
    .eq("organization_id", orgId) // CRITICAL FILTER 1: Only this organization
    .is("client_id", null) // CRITICAL FILTER 2: Only internal assets (not client domains)
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error("--> getOrganizationAssets: Error", error);
    return [];
  }

  console.log(
    `--> getOrganizationAssets: Found ${data?.length || 0} internal assets`,
  );
  return data || [];
}

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

  // 3. Get Assets (MIGRATED: Now using domains_master instead of org_assets)
  // This fetches internal domains (client_id = null) for backward compatibility
  const { data: assets } = await supabase
    .from("domains_master")
    .select("*")
    .eq("organization_id", orgId)
    .is("client_id", null)
    .order("expiration_date", { ascending: true });

  // 4. Get Corporate Emails (MIGRATED: Now using org_corporate_emails)
  // Fetch only internal emails (client_id is null)
  const { data: corporateEmails } = await supabase
    .from("org_corporate_emails")
    .select("*")
    .eq("organization_id", orgId)
    .is("client_id", null)
    .order("created_at", { ascending: false });

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", orgId);

  const { data: services } = await supabase
    .from("services")
    .select(`*, clients ( name )`)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name", { ascending: true });

  // 8. Get Internal Digital Assets (domains_master with strict filters)
  const internalAssets = await getOrganizationAssets(orgId);

  // SECURITY: Mask passwords before sending to client
  // They must be fetched explicitly via revealCredential to be audited
  const safeSubscriptions = subscriptions?.map((sub) => ({
    ...sub,
    login_password: sub.login_password ? "***HIDDEN***" : "", // Indicator that it exists
  }));

  // FOR CORPORATE EMAILS: Decrypt on the fly for authorized users (V1 strategy)
  const safeEmails = corporateEmails?.map((email) => ({
    ...email,
    password: decrypt(email.encrypted_password),
  }));

  console.log("--> Data fetched successfully for Org:", orgId);

  return {
    organization,
    subscriptions: safeSubscriptions || [],
    assets: assets || [],
    internalAssets: internalAssets || [],
    corporateEmails: safeEmails || [],
    members: members || [],
    services: services || [],
    clients: clients || [],
  };
}

// SECURITY: Reveal Credential (Audited)
export async function revealCredential(
  table: "org_subscriptions" | "org_corporate_emails",
  id: string,
  orgId: string,
) {
  console.log("--> revealCredential", { table, id });
  try {
    const { supabase } = await getAuthenticatedClient();

    // Fetch the specific row
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId) // Extra safety check
      .single();

    if (error || !data) {
      return { error: "Credential not found or access denied" };
    }

    // Determine what to return based on table
    let password =
      table === "org_subscriptions" ? data.login_password : data.password;
    const identifier =
      table === "org_subscriptions" ? data.service_name : data.email_address;

    // DECRYPT IF NEEDED
    if (password && password !== "***HIDDEN***") {
      try {
        // Attempt to decrypt if it looks like an encrypted string (or just try)
        // Our decrypt function handles plain text fallback if format doesn't match
        password = decrypt(password);
      } catch (e) {
        console.warn("Decryption failed in reveal, returning raw:", e);
      }
    }

    // AUDIT LOG
    await logAuditEvent("VIEW_PASSWORD", `${table}:${id}`, {
      org_id: orgId,
      identifier,
    });

    return { params: password };
  } catch (e: any) {
    console.error("--> Exception in revealCredential:", e);
    return { error: e.message };
  }
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

    await logAuditEvent("UPDATE_ORG", `organization:${orgId}`, { name });

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in updateOrganization:", e);
    return { error: e.message };
  }
}

// ADD INCOME SERVICE (Billing to Clients)
export async function addIncomeService(orgId: string, formData: FormData) {
  const dataMap = Object.fromEntries(formData);
  console.log("--> addIncomeService", { orgId, data: dataMap });

  try {
    const { supabase } = await getAuthenticatedClient();

    // Extract and validate form data
    const serviceName = formData.get("service_name") as string;
    const clientIdRaw = formData.get("client_id") as string;
    const amountRaw = formData.get("amount");
    const billingCycle = formData.get("billing_cycle") as string;
    const provider = formData.get("provider") as string;
    const accountHolder = formData.get("account_holder") as string;
    const serviceType = formData.get("service_type") as string;
    const startDateRaw = formData.get("start_date") as string;

    if (!serviceName) {
      return { error: "El nombre del servicio es requerido" };
    }

    const cost = amountRaw ? parseFloat(amountRaw.toString()) : 0;
    const clientId =
      clientIdRaw && clientIdRaw !== "null" && clientIdRaw !== ""
        ? clientIdRaw
        : null;
    const startDate = startDateRaw
      ? new Date(startDateRaw).toISOString()
      : new Date().toISOString();

    // Insert with CORRECT column names: 'name' and 'cost' (not 'service_name' and 'amount')
    const { data, error } = await supabase
      .from("services")
      .insert({
        organization_id: orgId,
        client_id: clientId,
        name: serviceName, // DB column is 'name'
        cost: isNaN(cost) ? 0 : cost, // DB column is 'cost'
        billing_cycle: billingCycle || "monthly",
        provider: provider || null,
        account_holder: accountHolder || null,
        service_type: serviceType || null,
        status: "active",
        start_date: startDate,
      })
      .select()
      .single();

    if (error) {
      console.error("--> DB Error addIncomeService:", error);
      return { error: `Error de base de datos: ${error.message}` };
    }

    console.log("--> DB Result addIncomeService SUCCESS:", data);

    await logAuditEvent("CREATE_INCOME_SERVICE", `services:${data.id}`, {
      name: serviceName,
      cost,
      provider,
      account_holder: accountHolder,
      org_id: orgId,
    });

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (error: any) {
    console.error("--> Server Action Error addIncomeService:", error);
    return { error: error.message || "Error al crear el servicio de ingreso." };
  }
}

// ADD SUBSCRIPTION
export async function addSubscription(orgId: string, formData: FormData) {
  const dataMap = Object.fromEntries(formData);
  if (dataMap.login_password) dataMap.login_password = "***HIDDEN***";
  console.log("--> addSubscription", { orgId, data: dataMap });

  try {
    const { supabase } = await getAuthenticatedClient();

    const service_name = formData.get("service_name") as string;
    const provider = formData.get("provider") as string;
    const costRaw = formData.get("cost");
    const cost = costRaw ? parseFloat(costRaw as string) : 0;
    const billing_cycle = formData.get("billing_cycle") as string;
    const next_billing_date = formData.get("next_billing_date") as string;
    const login_email = formData.get("login_email") as string;
    const rawPassword = formData.get("login_password") as string; // Get raw
    const tier = formData.get("tier") as string;

    // ENCRYPT PASSWORD
    const login_password = rawPassword ? encrypt(rawPassword) : null;

    const { data, error } = await supabase
      .from("org_subscriptions")
      .insert({
        organization_id: orgId,
        service_name,
        provider,
        cost,
        billing_cycle,
        next_billing_date: next_billing_date || null,
        login_email,
        login_password,
        tier,
      })
      .select()
      .single();

    console.log("--> DB Result addSubscription:", { error: error?.message });

    if (error) return { error: error.message };

    await logAuditEvent("CREATE_SUBSCRIPTION", `org_subscriptions:${data.id}`, {
      service_name,
      org_id: orgId,
    });

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
    const rawPassword = formData.get("password") as string;
    const assigned_to = formData.get("assigned_to") as string;

    // NEW FIELDS
    const provider = formData.get("provider") as string;
    const linked_gmail = formData.get("linked_gmail") as string;
    const costRaw = formData.get("cost")?.toString();
    const cost = costRaw ? parseFloat(costRaw) : 0;

    // ENCRYPT PASSWORD
    const password = rawPassword ? encrypt(rawPassword) : null;

    const { data, error } = await supabase
      .from("org_corporate_emails")
      .insert({
        organization_id: orgId,
        email_address,
        password,
        assigned_to,
        provider: provider || null,
        linked_gmail: linked_gmail || null,
        cost: isNaN(cost) ? 0 : cost,
      })
      .select()
      .single();

    console.log("--> DB Result addCorporateEmail:", { error: error?.message });

    if (error) return { error: error.message };

    await logAuditEvent("CREATE_EMAIL", `org_corporate_emails:${data.id}`, {
      email_address,
      org_id: orgId,
    });

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in addCorporateEmail:", e);
    return { error: e.message };
  }
}

// ADD ASSET (MIGRATED: Now saves to domains_master)
// ADD ASSET (MIGRATED: Now saves to domains_master)
export async function addAsset(orgId: string, formData: FormData) {
  try {
    const supabase = await createClient();

    // Extract form data with NEW fields
    const domainName = formData.get("name") as string; // Domain/URL
    const provider = formData.get("provider") as string; // e.g., Vercel
    const accountHolder = formData.get("account_holder") as string; // e.g., ivang111
    const registrar = formData.get("registrar") as string; // e.g., Namecheap
    const costRaw = formData.get("cost")?.toString();
    const cost = costRaw ? parseFloat(costRaw) : 0;
    const expirationDate = formData.get("expiration_date") as string;

    // NEW: Client ID support
    const clientIdRaw = formData.get("client_id") as string;
    const clientId =
      clientIdRaw && clientIdRaw !== "null" && clientIdRaw !== ""
        ? clientIdRaw
        : null;

    console.log("--> addAsset (domains_master):", {
      orgId,
      domainName,
      provider,
      accountHolder,
      cost,
      clientId,
    });

    if (!domainName) {
      return { error: "El dominio es requerido" };
    }

    // Insert into MASTER TABLE (domains_master)
    const { data, error } = await supabase
      .from("domains_master")
      .insert({
        organization_id: orgId,
        client_id: clientId, // Support for Client Domains
        domain_name: domainName,
        registrar: registrar || null,
        hosting_provider: provider || null,
        account_holder: accountHolder || null,
        renewal_price: isNaN(cost) ? 0 : cost,
        expiration_date: expirationDate || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("--> DB Error addAsset:", error);
      return { error: error.message };
    }

    console.log("--> addAsset SUCCESS:", data);

    await logAuditEvent("CREATE_ASSET", `domains_master:${data.id}`, {
      domain: domainName,
      org_id: orgId,
      client_id: clientId,
    });

    revalidatePath(`/dashboard/organization/${orgId}`);
    if (clientId) {
      revalidatePath(`/dashboard/clients/${clientId}`);
    }
    revalidatePath(`/dashboard/domains`); // Also refresh global domains view
    return { success: true };
  } catch (error: any) {
    console.error("--> Exception in addAsset:", error);
    return { error: error.message || "Error al guardar el dominio/activo." };
  }
}

// DELETE ITEM (Generic)
export async function deleteItem(
  table:
    | "org_subscriptions"
    | "domains_master"
    | "org_corporate_emails"
    | "services",
  id: string,
  orgId: string,
) {
  console.log("--> deleteItem", { table, id, orgId });
  try {
    const { supabase } = await getAuthenticatedClient();

    // No need to fetch before delete if we just credit the ID, but knowing what we deleted is nice.
    // Let's just log the attempt.

    const { error } = await supabase.from(table).delete().eq("id", id);

    console.log("--> DB Result deleteItem:", { error: error?.message });

    if (error) return { error: error.message };

    await logAuditEvent("DELETE_ITEM", `${table}:${id}`, { org_id: orgId });

    revalidatePath(`/dashboard/organization/${orgId}`);
    return { success: true };
  } catch (e: any) {
    console.error("--> Exception in deleteItem:", e);
    return { error: e.message };
  }
}
