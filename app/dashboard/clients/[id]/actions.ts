"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { decrypt, encrypt } from "@/utils/encryption";

// 1. GET CLIENT (With Creator Info)
export async function getClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const admin = createAdminClient();

  // Fetch Client
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
    console.error("Error fetching client:", error);
    return { error: "Cliente no encontrado" };
  }

  // Security Check: User must belong to same Org (unless Super Admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";

  if (!isSuperAdmin && client.organization_id !== profile?.organization_id) {
    return { error: "Acceso denegado" };
  }

  // Fetch Creator Email manually (created_by is UUID)
  let creatorEmail = "Sistema / Desconocido";
  if (client.created_by) {
    const { data: creator } = await admin
      .from("profiles")
      .select("email")
      .eq("id", client.created_by)
      .single();
    if (creator) creatorEmail = creator.email;
  }

  return {
    client: {
      ...client,
      creator_email: creatorEmail,
      currentUserRole: profile?.role,
    },
  };
}

// 2. GET CLIENT DOMAINS
export async function getClientDomains(clientId: string) {
  const supabase = await createClient(); // RLS should handle permissions usually, but we validated access in getClient

  const { data, error } = await supabase
    .from("domains_master")
    .select("*")
    .eq("client_id", clientId)
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error("Error fetching client domains:", error);
    return [];
  }

  return data || [];
}

// 3. ADD CLIENT DOMAIN
export async function addClientDomain(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Helper to get Org ID from Client (to ensure data consistency)
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (!client) return { error: "Cliente inválido" };

  const domainName = formData.get("name") as string;
  const provider = formData.get("provider") as string;
  const accountHolder = formData.get("account_holder") as string;
  const registrar = formData.get("registrar") as string;
  const costRaw = formData.get("cost")?.toString();
  const cost = costRaw ? parseFloat(costRaw) : 0;
  const expirationDate = formData.get("expiration_date") as string;

  if (!domainName) return { error: "El dominio es requerido" };

  const { data, error } = await supabase
    .from("domains_master")
    .insert({
      organization_id: client.organization_id,
      client_id: clientId, // FORCED LINK
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
    return { error: error.message };
  }

  await logAuditEvent("CREATE_ASSET", `domains_master:${data.id}`, {
    domain: domainName,
    client_id: clientId,
    created_by: user.email,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 5. GET CLIENT EMAILS
export async function getClientEmails(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("org_corporate_emails") // Using the correct table
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client emails:", error);
    return [];
  }

  return data.map((email) => ({
    ...email,
    password: email.password ? "***HIDDEN***" : "",
  }));
}

// 6. GET CLIENT CREDENTIALS
export async function getClientCredentials(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_credentials")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client credentials:", error);
    return [];
  }

  return data.map((creds) => ({
    ...creds,
    password: creds.password ? "***HIDDEN***" : "",
  }));
}

// 7. GET CLIENT TICKETS
export async function getClientTickets(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client tickets:", error);
    return [];
  }

  return data || [];
}

// 5. ADD CLIENT EMAIL
export async function addClientEmail(clientId: string, formData: FormData) {
  console.log("🔴 [DEBUG START] addClientEmail Invoked");
  console.log("👉 Client ID recibido (bind):", clientId);

  const rawData = Object.fromEntries(formData.entries());
  console.log("👉 FormData Crudo:", rawData);

  if (!clientId || clientId === "undefined") {
    console.error("❌ ERROR CRÍTICO: Client ID es nulo o inválido.");
    return { error: "Error interno: ID de cliente perdido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("❌ ERROR: Usuario no autenticado.");
    return { error: "No autenticado" };
  }

  const email_address = formData.get("email_address") as string;
  const rawPassword = formData.get("password") as string;
  const assigned_to = formData.get("assigned_to") as string;

  // NEW FIELDS
  const provider = formData.get("provider") as string;
  const linked_gmail = formData.get("linked_gmail") as string;
  const costRaw = formData.get("cost")?.toString();
  const cost = costRaw ? parseFloat(costRaw) : 0;

  console.log(
    `👉 Intentando crear correo: ${email_address} para cliente ${clientId}`,
  );

  const password = rawPassword ? encrypt(rawPassword) : null;

  // We need the organization_id from the client
  const admin = createAdminClient();
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    console.error("❌ Error buscando cliente:", clientError);
    return { error: "Cliente no encontrado o error en DB." };
  }

  console.log("✅ Organización detectada:", client.organization_id);

  const { error } = await supabase.from("org_corporate_emails").insert({
    organization_id: client.organization_id,
    client_id: clientId,
    email_address,
    password: password || "***HIDDEN***",
    assigned_to,
    provider: provider || null,
    linked_gmail: linked_gmail || null,
    cost: isNaN(cost) ? 0 : cost,
  });

  if (error) {
    console.error("❌ Error insertando email:", error);
    return { error: error.message };
  }

  console.log("✅ [DEBUG SUCCESS] Correo insertado en BD.");
  await logAuditEvent("CREATE_EMAIL", `client_email`, {
    email: email_address,
    client_id: clientId,
    created_by: user.email,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true, message: "Correo creado correctamente" };
}

// 6. ADD CLIENT CREDENTIAL (Vault)
export async function addCredential(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const type = formData.get("type") as string;
  const service_name = formData.get("service_name") as string;
  const url = formData.get("url") as string;
  const username = formData.get("username") as string;
  const rawPassword = formData.get("password") as string;
  const notes = formData.get("notes") as string;

  // Encrypt
  const password = rawPassword ? encrypt(rawPassword) : "";

  // Get Org ID
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (!client) return { error: "Cliente no encontrado" };

  const { error } = await supabase.from("client_credentials").insert({
    organization_id: client.organization_id,
    client_id: clientId,
    type,
    service_name,
    url: url || null,
    username,
    password,
    notes: notes || null,
  });

  if (error) {
    console.error("Error adding credential:", error);
    return { error: error.message };
  }

  await logAuditEvent("CREATE_CREDENTIAL", `client_credentials`, {
    service: service_name,
    client_id: clientId,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 7. ADD CLIENT SERVICE (Billing)
export async function addService(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const name = formData.get("name") as string;
  const costRaw = formData.get("cost");
  const cost = costRaw ? parseFloat(costRaw.toString()) : 0;
  const billingCycle = formData.get("billing_cycle") as string;
  const provider = formData.get("provider") as string;
  const accountHolder = formData.get("account_holder") as string;
  const serviceType = formData.get("service_type") as string;
  const startDateRaw = formData.get("start_date") as string;

  // Get Org ID
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (!client) return { error: "Cliente no encontrado" };

  const startDate = startDateRaw
    ? new Date(startDateRaw).toISOString()
    : new Date().toISOString();

  const { error } = await supabase.from("services").insert({
    organization_id: client.organization_id,
    client_id: clientId,
    name,
    cost: isNaN(cost) ? 0 : cost,
    billing_cycle: billingCycle || "monthly",
    provider: provider || null,
    account_holder: accountHolder || null,
    service_type: serviceType || null,
    status: "active",
    start_date: startDate,
  });

  if (error) {
    console.error("Error adding service:", error);
    return { error: error.message };
  }

  await logAuditEvent("CREATE_INCOME_SERVICE", `client_service`, {
    name,
    client_id: clientId,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 8. CREATE TICKET
export async function createTicket(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;
  const priority = formData.get("priority") as string;

  // Get Org ID
  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (!client) return { error: "Cliente no encontrado" };

  const { error } = await supabase.from("tickets").insert({
    organization_id: client.organization_id,
    client_id: clientId,
    subject,
    description: description || "",
    priority: priority || "medium",
    status: "open",
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating ticket:", error);
    return { error: error.message };
  }

  await logAuditEvent("CREATE_TICKET", `ticket`, {
    subject,
    client_id: clientId,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 9. UPDATE CLIENT PROFILE
export async function updateClientProfile(
  clientId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const name = formData.get("name") as string;
  const tax_id = formData.get("tax_id") as string;
  const contact_email = formData.get("contact_email") as string;
  const status = formData.get("status") as string;

  const admin = createAdminClient();
  const { error } = await admin
    .from("clients")
    .update({
      name,
      tax_id,
      contact_email,
      status,
    })
    .eq("id", clientId);

  if (error) {
    console.error("Error updating client:", error);
    return { error: error.message };
  }

  await logAuditEvent("UPDATE_CLIENT", `client`, {
    client_id: clientId,
    updates: { name, status },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 10. DELETE CREDENTIAL
export async function deleteCredential(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Fetch credential first to get IDs for revalidation/logging
  const { data: credential } = await supabase
    .from("client_credentials")
    .select("client_id, service_name")
    .eq("id", id)
    .single();

  if (!credential) return { error: "Credencial no encontrada" };

  const { error } = await supabase
    .from("client_credentials")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting credential:", error);
    return { error: error.message };
  }

  await logAuditEvent("DELETE_CREDENTIAL", `client_credentials`, {
    service: credential.service_name,
    client_id: credential.client_id,
  });

  revalidatePath(`/dashboard/clients/${credential.client_id}`);
  return { success: true };
}

// 11. REVEAL CREDENTIAL (Audit)
export async function revealCredentialPassword(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: credential, error } = await supabase
    .from("client_credentials")
    .select("password, client_id, service_name")
    .eq("id", id)
    .single();

  if (error || !credential) return { error: "No encontrado" };

  let password = credential.password;
  try {
    if (password && password !== "***HIDDEN***") {
      password = decrypt(password);
    }
  } catch (e) {
    console.warn("Decrypt failed", e);
  }

  await logAuditEvent("VIEW_PASSWORD", `client_credential:${id}`, {
    service: credential.service_name,
    client_id: credential.client_id,
  });

  return { password };
}
