"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .single();

  let query = supabase
    .from("projects")
    .select(
      `
      *,
      clients:client_id (
        id,
        name,
        organization_id,
        organizations (
          name
        )
      )
    `,
    )
    .order("deadline", { ascending: true }); // Most urgent first

  // Filter by organization if not super admin (though RLS should handle this, it's good to be explicit for optimization)
  if (profile?.role !== "super_admin" && profile?.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  return data;
}

export async function getClientsForSelect() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .single();

  let query = supabase.from("clients").select("id, name").order("name");

  // If not super admin, restrict to own clients
  if (profile?.role !== "super_admin" && profile?.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data, error } = await query;
  return data || [];
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const client_id = formData.get("client_id") as string;
  const name = formData.get("name") as string;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;
  const deadline = formData.get("deadline") as string;
  const budget = formData.get("budget") as string;

  // We need to fetch the organization_id from the client to ensure consistency
  // The project belongs to the same organization as the client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("organization_id")
    .eq("id", client_id)
    .single();

  if (clientError || !client) {
    return { error: "Cliente inválido o no encontrado." };
  }

  const { error } = await supabase.from("projects").insert({
    organization_id: client.organization_id,
    client_id,
    name,
    status,
    priority,
    deadline: deadline || null,
    budget: budget ? parseFloat(budget) : 0,
    progress: 0, // Default to 0
  });

  if (error) {
    console.error("Error creating project:", error);
    return { error: "Error al crear el proyecto." };
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}

export async function updateProjectStatus(
  id: string,
  status: string,
  progress: number,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ status, progress, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating project:", error);
    return { error: "Error al actualizar el proyecto." };
  }

  revalidatePath("/dashboard/projects");
  return { success: true };
}
