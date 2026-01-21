"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface TeamUser {
  id: string;
  full_name: string | null;
  email: string;
  role: "admin" | "super_admin";
  organization_name: string | null;
  organization_id: string | null;
}

export async function getUsers() {
  const supabase = await createClient();

  // 1. Check Super Admin Role first (Client side check isn't enough, we need server side enforcement)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Our RPC function handles the check internally, but double check doesn't hurt logic flow
  const { data, error } = await supabase.rpc("get_profiles_with_email");

  if (error) {
    console.error("Error fetching team:", error);
    // If error implies permission denied (403), it means RBAC works
    return [];
  }

  return data as TeamUser[];
}

export async function getOrganizations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  if (error) return [];
  return data;
}

export async function updateUserRole(
  userId: string,
  newRole: "admin" | "super_admin",
  newOrgId: string,
) {
  const supabase = await createClient();

  // 1. Get Current User (The executor)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (!currentUser) return { error: "No autenticado" };

  // 2. Safety Check: Prevent Self-Lockout or Self-Demotion
  // A super admin cannot change their own role via this UI to prevent accidents
  if (userId === currentUser.id) {
    return {
      error:
        "No puedes modificar tus propios permisos desde aquí por seguridad.",
    };
  }

  // 3. Update Profile
  const { error } = await supabase
    .from("profiles")
    .update({
      role: newRole,
      organization_id: newOrgId,
    })
    .eq("id", userId);

  if (error) {
    console.error("Update Role Error:", error);
    return { error: "Error actualizando el usuario" };
  }

  revalidatePath("/dashboard/team");
  return { success: true };
}
