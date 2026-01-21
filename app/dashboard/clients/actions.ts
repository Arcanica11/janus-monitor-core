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
      domains (count)
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

  // Fetch Organization ID explicitly to be safe
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single();

  if (!profile?.organization_id) {
    return { error: "No se pudo identificar tu organización." };
  }

  const { error } = await supabase.from("clients").insert({
    organization_id: profile.organization_id,
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
