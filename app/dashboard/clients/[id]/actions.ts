"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/utils/encryption";
import { logAuditEvent } from "@/lib/audit";

// Helper para obtener la organización del cliente de forma segura
async function getClientOrganizationId(clientId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  if (error || !data) {
    console.error("Error fetching client organization:", error);
    return null;
  }
  return data.organization_id;
}

// 1. OBTENER DETALLES COMPLETOS (Full Fetch)
export async function getClientFullDetails(clientId: string) {
  const supabase = await createClient();

  // A. Info Básica
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*, organizations(name)")
    .eq("id", clientId)
    .single();

  if (clientError || !client) return null;

  // B. Consultas Paralelas
  const [creds, servs, doms, ticks, social] = await Promise.all([
    supabase
      .from("credentials")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("services")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("domains")
      .select("*")
      .eq("linked_client_id", clientId)
      .order("expiration_date", { ascending: true }),
    supabase
      .from("tickets")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("social_vault")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  // C. Unificar y Limpiar Credenciales
  // 1. Credenciales Generales (DB credentials table)
  // Mask password hash for security on initial load
  const safeCredentials = (creds.data || []).map((c) => ({
    ...c,
    password_hash: c.password_hash ? "********" : null, // MASKED
    category: "general",
  }));

  // 2. Redes Sociales (Legacy social_vault table) - Merge into credentials view
  const safeSocials = (social.data || []).map((s) => ({
    id: s.id,
    type: s.platform, // Map platform to type
    service_name: s.platform, // Use platform as service_name
    username: s.username,
    password_hash: s.password ? "********" : null, // MASKED
    url: s.url,
    notes: s.notes,
    client_id: s.client_id,
    organization_id: s.organization_id,
    created_at: s.created_at,
    category: "social_legacy", // Tag as legacy
  }));

  // Combine both into one unified list for the UI
  const unifiedCredentials = [...safeCredentials, ...safeSocials];

  return {
    client,
    credentials: unifiedCredentials, // Unified list
    services: servs.data || [],
    domains: doms.data || [],
    tickets: ticks.data || [],
    // We send empty social_credentials to phase out the old tab,
    // or we can keep it for now if UI expects it, but we prefer unified.
    // Let's keep sending it just in case, but UI will prefer 'credentials'.
    social_credentials: safeSocials,
  };
}

// 2. ACTUALIZAR PERFIL
export async function updateClientProfile(
  clientId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const industry = formData.get("industry") as string;
  const notes = formData.get("notes") as string;
  const name = formData.get("name") as string;

  let updates: any = { address, phone, industry, notes };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (name) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();
    if (profile?.role === "super_admin") {
      updates.name = name;
    }
  }

  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clientId);

  if (error) return { error: "Error actualizando" };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 3. AGREGAR CREDENCIAL GENÉRICA
export async function addCredential(clientId: string, formData: FormData) {
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId)
    return { error: "No se pudo identificar la organización del cliente." };

  const admin = createAdminClient();
  // Encrypt password before storing
  const rawPassword = formData.get("password") as string;
  const encryptedPassword = encrypt(rawPassword);

  const { error } = await admin.from("credentials").insert({
    client_id: clientId,
    organization_id: orgId,
    type: formData.get("type") as string,
    service_name: formData.get("service_name") as string,
    username: formData.get("username") as string,
    password_hash: encryptedPassword, // Store encrypted
    url: formData.get("url") as string,
    notes: formData.get("notes") as string,
  });

  if (error) return { error: error.message };

  await logAuditEvent("CREATE_CREDENTIAL", "credentials", {
    clientId,
    type: formData.get("type"),
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 4. ELIMINAR CREDENCIAL
export async function deleteCredential(credentialId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("credentials")
    .delete()
    .eq("id", credentialId);

  if (error) return { error: error.message };

  await logAuditEvent("DELETE_CREDENTIAL", "credentials", {
    credentialId,
    clientId,
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 5. AGREGAR SERVICIO
export async function addService(clientId: string, formData: FormData) {
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId)
    return { error: "No se pudo identificar la organización del cliente." };

  const admin = createAdminClient();
  const { error } = await admin.from("services").insert({
    client_id: clientId,
    organization_id: orgId,
    name: formData.get("name") as string,
    // description: formData.get("description") as string, // Si existe en UI
    amount: parseFloat(formData.get("cost") as string), // Mapear cost a 'amount' si es necesario, o corregir UI
    // Nota: services table schema puede variar, asumiendo lo creado en migración previa.
    // Verificando schema previo: created_at, organization_id, client_id, service_name, description, amount, currency, billing_cycle, next_payment_date, status.
    // Ajustamos keys para coincidir con la tabla 'services' (Facturación) real.
    service_name: formData.get("name") as string,
    billing_cycle: formData.get("billing_cycle") as string,
    next_payment_date: (formData.get("next_billing_date") as string) || null,
    status: "active",
  });

  // NOTE: If the table expects 'amount' but form sends 'cost', we map it.
  // The 'services' table from migration 016 uses: service_name, description, amount, currency, billing_cycle, next_payment_date...
  // The previous implementation used 'name', 'cost', 'next_billing_date'.
  // We should align with the new schema.

  if (error) return { error: error.message };

  await logAuditEvent("CREATE_SERVICE", "services", {
    clientId,
    service: formData.get("name"),
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 6. ELIMINAR SERVICIO
export async function deleteService(serviceId: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) return { error: error.message };

  await logAuditEvent("DELETE_SERVICE", "services", { serviceId, clientId });

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 7. CREAR TICKET (SMART LOGIC)
export async function createTicket(clientId: string, formData: FormData) {
  const orgId = await getClientOrganizationId(clientId);
  if (!orgId) return { error: "Error de organización" };

  const admin = createAdminClient();
  const type = formData.get("type") as string;
  let isBillable = formData.get("is_billable") === "on";
  let cost = formData.get("cost")
    ? parseFloat(formData.get("cost") as string)
    : 0;

  // --- SMART TICKET LOGIC: 2 Free Maintenance Tickets per Year ---
  if (type === "maintenance") {
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
    const endOfYear = `${currentYear}-12-31T23:59:59.999Z`;

    // Count existing maintenance tickets for this client in the current year
    const { count, error: countError } = await admin
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("type", "maintenance")
      .gte("created_at", startOfYear)
      .lte("created_at", endOfYear);

    if (countError) {
      console.error("Error counting tickets:", countError);
      // Fallback: Proceed with form values but log error
    } else {
      const maintenanceCount = count || 0;

      if (maintenanceCount < 2) {
        // First 2 are FREE
        isBillable = false;
        cost = 0;
      } else {
        // 3rd onwards are BILLABLE
        isBillable = true;
        // Default cost if not provided by user, or respect user input if > 0
        if (cost === 0) cost = 50; // Default maintenance fee
      }
    }
  }
  // -------------------------------------------------------------

  const { error } = await admin.from("tickets").insert({
    client_id: clientId,
    organization_id: orgId,
    title: formData.get("title") as string,
    type: type,
    description: formData.get("description") as string,
    is_billable: isBillable,
    cost: cost,
    status: "open",
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 9. ACTUALIZAR ESTADO DE TICKET
export async function updateTicketStatus(
  ticketId: string,
  status: string,
  clientId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { success: true };
}

// 8. REVELAR CONTRASEÑA SECURA (UNIFIED)
export async function revealCredentialPassword(
  credentialId: string,
  type: "general" | "social_legacy" = "general",
) {
  const supabase = await createClient();

  let tableName = "credentials";
  let column = "password_hash";

  if (type === "social_legacy") {
    tableName = "social_vault";
    column = "password";
  }

  const { data, error } = await supabase
    .from(tableName)
    .select(column)
    .eq("id", credentialId)
    .single();

  if (error || !data) {
    return { error: "No se pudo recuperar la credencial." };
  }

  const encrypted = (data as any)[column];
  if (!encrypted) return { password: null };

  // Log Audit
  await logAuditEvent("VIEW_PASSWORD", tableName, { credentialId, type });

  try {
    const decrypted = decrypt(encrypted);
    return { password: decrypted };
  } catch (err) {
    console.error("Decryption failed:", err);
    return { error: "Error al desencriptar." };
  }
}

// Legacy support (to be deprecated)
export async function revealSocialPassword(credentialId: string) {
  return revealCredentialPassword(credentialId, "social_legacy");
}

// 11. QUICK CREATE CLIENT
export async function quickCreateClient(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) return { error: "No organization assigned" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({
      name,
      organization_id: profile.organization_id,
      status: "active",
    })
    .select("id, name")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  return { client: data };
}
