"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// 6. Interfaces
export interface TeamUser {
  id: string;
  email?: string;
  full_name: string;
  role: string;
  is_blocked: boolean;
  organization_name?: string;
  organization_id: string | null;
  created_at?: string;
  last_sign_in_at?: string;
  user_metadata?: any;
  app_metadata?: any;
}

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
      const userOrg = orgs?.find((o) => o.id === profile?.organization_id);
      return {
        ...u,
        full_name: profile?.full_name || u.user_metadata?.full_name || "N/A",
        role: profile?.role || u.app_metadata?.role || "user",
        is_blocked: profile?.is_blocked || false,
        organization_name: userOrg?.name,
        organization_id: profile?.organization_id || null, // Ensure distinct null
      };
    });

    return {
      organizations: orgs || [],
      users: users || [],
    };
  } catch (error) {
    console.error("Get Admin Data Error:", error);
    return null;
  }
}

// 5. Create User
export async function createUser(formData: FormData) {
  try {
    const supabase = createAdminClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;
    const role = formData.get("role") as string;

    // 1. Auth without email confirm
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;

    // 2. Force Profile Sync
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        is_blocked: false,
      });
    }
    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    console.error("Create User Error:", error);
    return {
      error: error instanceof Error ? error.message : "Error creating user",
    };
  }
}

// 6. Update User Role & Org
export async function updateUserRole(
  userId: string,
  role: string,
  orgId: string,
) {
  try {
    await checkSuperAdmin();
    const admin = createAdminClient();

    // 1. Update Profile (Role & Org)
    const { error: profileError } = await admin
      .from("profiles")
      .update({ role, organization_id: orgId })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. Update Auth Metadata (Role)
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
    });

    if (authError) console.warn("Auth metadata update warning:", authError);

    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (error) {
    console.error("Update Role Error:", error);
    return {
      error: error instanceof Error ? error.message : "Error updating role",
    };
  }
}
