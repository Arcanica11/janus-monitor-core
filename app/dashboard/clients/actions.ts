"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });
  return data;
}

export async function getOrganizations() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("organizations")
      .select("id, name")
      .order("name");
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();
  const isSuperAdmin = profile?.role === "super_admin";

  const name = formData.get("name") as string;
  const email = formData.get("contact_email") as string;
  let orgId = formData.get("organization_id") as string;

  if (isSuperAdmin && !orgId) {
    return { error: "Como Super Admin, selecciona una organización." };
  }
  if (!isSuperAdmin) {
    orgId = profile?.organization_id;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("clients").insert({
    name,
    contact_email: email,
    organization_id: orgId,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { success: true };
}
