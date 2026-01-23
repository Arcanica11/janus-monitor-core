"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { encrypt, decrypt } from "@/utils/encryption";

// 1. ADD EMAIL (With Encryption)
export async function addEmail(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Helper to get Org ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id && profile?.role !== "super_admin") {
    // If super admin doesn't have org, they must provide it (future logic), but usually they do or context logic handles it.
    // For now, assuming context passed org or we fetch from context if possible,
    // but FormData usually has no Org ID if not passed.
    // Let's assume we pass org_id or use user's.
  }

  // Determine Org ID / Client ID
  // Strategy: If adding for a client, client_id is present. Org ID is inferred from client or user.
  // If adding internal, client_id is null.

  const formOrgId = formData.get("organization_id") as string;
  const formClientId = formData.get("client_id") as string;

  const orgId = formOrgId || profile?.organization_id;
  const clientId =
    formClientId && formClientId !== "null" ? formClientId : null;

  if (!orgId) return { error: "Organización no definida" };

  // Data
  const emailAddress = formData.get("email_address") as string;
  const rawPassword = formData.get("password") as string;
  const provider = formData.get("provider") as string;
  const linkedGmail = formData.get("linked_gmail") as string;
  const costRaw = formData.get("cost")?.toString();
  const cost = costRaw ? parseFloat(costRaw) : 0;

  if (!emailAddress || !rawPassword) {
    return { error: "Email y contraseña requeridos" };
  }

  // ENCRYPT
  const encryptedPassword = encrypt(rawPassword);

  const { data, error } = await supabase
    .from("corporate_emails")
    .insert({
      organization_id: orgId,
      client_id: clientId,
      email_address: emailAddress,
      encrypted_password: encryptedPassword,
      provider: provider || null,
      linked_gmail: linkedGmail || null,
      cost: isNaN(cost) ? 0 : cost,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating email:", error);
    return { error: error.message };
  }

  await logAuditEvent("CREATE_EMAIL", `corporate_emails:${data.id}`, {
    email: emailAddress,
    org_id: orgId,
    client_id: clientId,
    created_by: user.email,
  });

  // Revalidate
  revalidatePath("/dashboard/emails");
  revalidatePath(`/dashboard/organization/${orgId}`);
  if (clientId) revalidatePath(`/dashboard/clients/${clientId}`);

  return { success: true };
}

// 2. GET EMAILS (Decrypts for authorized users)
export async function getEmails(orgId: string, clientId?: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Build Query
  let query = supabase
    .from("corporate_emails")
    .select("*, clients(name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  } else if (clientId === null) {
    // Explicitly null means query internal only (if that's the logic requested)
    // But usually undefined means "all in org", and null means "internal".
    // Let's support strict null check if passed as null.
    query = query.is("client_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching emails:", error);
    return [];
  }

  // DECRYPT PASSWORDS ON THE FLY
  // Note: RLS ensures only org members see this.
  const decryptedData = data.map((item) => ({
    ...item,
    // Provide a 'decrypted_password' field (or overwrite if compatible type)
    // We'll keep 'encrypted_password' as is, and add 'password' field for UI
    password: decrypt(item.encrypted_password),
  }));

  return decryptedData;
}

// 3. DELETE EMAIL (Super Admin)
export async function deleteEmail(emailId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { error: "Solo super admin puede eliminar correos" };
  }

  const { error } = await supabase
    .from("corporate_emails")
    .delete()
    .eq("id", emailId);

  if (error) return { error: error.message };

  await logAuditEvent("DELETE_EMAIL", `corporate_emails:${emailId}`, {
    deleted_by: user.email,
  });

  revalidatePath("/dashboard/emails");
  // We can't easily revalidate all orgs/clients without lookup, typically standard cache clearing is ok
  return { success: true };
}
