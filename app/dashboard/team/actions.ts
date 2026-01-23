"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// Check if current user is super admin
async function checkSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Check profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    throw new Error("Forbidden: Requires Super Admin privileges");
  }

  return user;
}

// 1. Delete Organization (Full Cascade)
export async function deleteOrganization(organizationId: string) {
  try {
    await checkSuperAdmin();

    const admin = createAdminClient();

    // Deleting organization will cascade to clients, domains, etc. due to DB constraints
    const { error } = await admin
      .from("organizations")
      .delete()
      .eq("id", organizationId);

    if (error) throw error;

    revalidatePath("/dashboard/team"); // UPDATED PATH
    return { success: true };
  } catch (error) {
    console.error("Delete Org Error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Error deleting organization",
    };
  }
}

// 2. Delete User
export async function deleteUser(userId: string) {
  try {
    const adminUser = await checkSuperAdmin();

    if (adminUser.id === userId) {
      throw new Error("Self-destruction is not allowed.");
    }

    const admin = createAdminClient();

    // Delete from auth.users (requires admin client)
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) throw error;

    revalidatePath("/dashboard/team"); // UPDATED PATH
    return { success: true };
  } catch (error) {
    console.error("Delete User Error:", error);
    return {
      error: error instanceof Error ? error.message : "Error deleting user",
    };
  }
}

// 3. Update User (Super Admin only)
interface UpdateUserParams {
  userId: string;
  fullName: string;
  role: string;
  isBlocked: boolean;
}

export async function updateUser({
  userId,
  fullName,
  role,
  isBlocked,
}: UpdateUserParams) {
  try {
    await checkSuperAdmin();
    const admin = createAdminClient();

    // 1. Update Profile (Full Name, Blocked Status, Role)
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        is_blocked: isBlocked,
        role: role, // Update DB role
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. Update Auth Metadata (Role)
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
      user_metadata: { full_name: fullName },
    });

    if (authError) console.warn("Auth metadata update warning:", authError);

    revalidatePath("/dashboard/team"); // UPDATED PATH
    return { success: true };
  } catch (error) {
    console.error("Update User Error:", error);
    return {
      error: error instanceof Error ? error.message : "Error updating user",
    };
  }
}

// 4. Get Admin Data
export async function getAdminData() {
  try {
    await checkSuperAdmin();
    const admin = createAdminClient();

    // Get Organizations
    const { data: orgs } = await admin
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    // Get Users from Auth
    const {
      data: { users: authUsers },
      error: usersError,
    } = await admin.auth.admin.listUsers();

    if (usersError) throw usersError;

    // Get Profiles (for roles, full_name, is_blocked)
    const { data: profiles } = await admin.from("profiles").select("*");

    // Merge Data
    const users = authUsers.map((u) => {
      const profile = profiles?.find((p) => p.id === u.id);
      return {
        ...u,
        full_name: profile?.full_name || u.user_metadata?.full_name || "N/A",
        role: profile?.role || u.app_metadata?.role || "user",
        is_blocked: profile?.is_blocked || false,
      };
    });

    return {
      organizations: orgs || [],
      users: users || [],
    };
  } catch (error) {
    console.error("Get Admin Data Error:", error);
    return null; // Or redirect
  }
}
