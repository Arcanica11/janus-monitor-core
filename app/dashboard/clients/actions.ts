"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();

  // RLS will automatically filter by organization_id if set up correctly.
  // We join with the domains table and count them.
  // Note: We use 'count' with separate query modifier or select count within.
  // Supabase/Postgrest syntax for count on joined relation:
  // select('*, domains(count)')
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      domains (count),
      organizations (name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  // Map the result to flatten the count
  return data.map((client: any) => ({
    ...client,
    domain_count: client.domains[0]?.count || 0,
  }));
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("contact_email") as string;

  if (!name || name.trim() === "") {
    return { error: "El nombre de la empresa es obligatorio." };
  }

  // Generate Unique Client ID (Standard Random Logic)
  // Format: CLI-XXXX (4 random uppercase alphanumeric chars)
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const unique_client_id = `CLI-${randomSuffix}`;

  // Fetch Organization ID and Role explicitly
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .single();

  if (!profile?.organization_id) {
    return { error: "No se pudo identificar tu organización." };
  }

  // Determine target Organization ID
  let targetOrgId = profile.organization_id;

  // Super Admin Logic: Allow override
  if (profile.role === "super_admin") {
    const overrideOrgId = formData.get("organization_id") as string;
    if (overrideOrgId && overrideOrgId !== "undefined") {
      targetOrgId = overrideOrgId;
    }
  }

  const { error } = await supabase.from("clients").insert({
    organization_id: targetOrgId,
    name,
    contact_email: email,
    unique_client_id,
  });

  if (error) {
    console.error("Error creating client:", error);
    if (error.code === "23505") {
      // Unique violation
      return {
        error:
          "El ID de cliente generado ya existe. Por favor intenta de nuevo.",
      };
    }
    return {
      error: "Error al crear el cliente.",
    };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function getOrganizations() {
  const supabase = await createClient();

  // Security check: Only super_admin should access this list?
  // Ideally we check role, but RLS might handle it if we set it up correctly.
  // However, explicit check is better for UI logic.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (profile?.role !== "super_admin") {
    return [];
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  if (error) return [];

  return data;
}

// CREACIÓN RÁPIDA (QUICK CREATE)
// CREACIÓN RÁPIDA (QUICK CREATE)
export async function quickCreateClient(name: string) {
  const supabase = await createClient();

  // 1. Obtener Org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  if (!profile?.organization_id) {
    // Fallback para Super Admin si no tiene org en perfil (raro, pero posible)
    // Podríamos buscar la org "default" o lanzar error.
    return {
      error: "No tienes una organización asignada para crear clientes.",
    };
  }

  // 2. Insertar
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      organization_id: profile.organization_id,
      status: "active",
    })
    .select("id, name")
    .single();

  if (error) return { error: error.message };

  // 3. Revalidación POTENTE
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/clients");

  return { success: true, client: data };
}
