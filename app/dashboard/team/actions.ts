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

// 1. Obtener Usuarios
export async function getUsers() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_profiles_with_email");
  if (error) {
    console.error("Error fetching team:", error);
    return [];
  }
  return data as TeamUser[];
}

// 2. Obtener Organizaciones (ESTA FALTABA)
export async function getOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");
  if (error) return [];
  return data;
}

import { createAdminClient } from "@/utils/supabase/admin";

// 3. Crear Usuario (REAL CON ADMIN API - EMERGENCY FIX)
export async function createUser(formData: FormData) {
  console.log(">>> [SERVER] Iniciando createUser");

  // 1. EXTRAER Y LOGUEAR DATOS CRUDOS
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as string;
  const orgId = formData.get("organization_id") as string;

  console.log(">>> [SERVER] Payload:", { email, fullName, role, orgId });

  // 2. VALIDACIÓN PARANOICA
  if (!orgId || orgId.trim() === "") {
    console.error(">>> [SERVER] ERROR: Org ID vacío");
    return { error: "FATAL: El servidor recibió una Organización vacía." };
  }

  try {
    const supabase = await createClient();
    // 1. Verificar si soy admin (Seguridad RBAC)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "No autenticado" };

    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUserProfile?.role !== "super_admin") {
      console.error("!!! Permission Denied");
      return { error: "No tienes permiso para crear usuarios." };
    }

    if (!email || !password || !fullName) {
      return { error: "Todos los campos son obligatorios" };
    }

    const admin = createAdminClient();

    // 3. AUTH (Crear o Recuperar)
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    let targetId = authData.user?.id;

    if (authError) {
      // Manejo de Zombie (Usuario ya existe)
      if (
        authError.message.includes("already registered") ||
        authError.status === 422
      ) {
        console.log(">>> [SERVER] Usuario existe, buscando ID...");
        const { data: existing } = await admin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();
        if (!existing) {
          // Fallback: Buscar en Auth list
          const { data: list } = await admin.auth.admin.listUsers();
          targetId = list.users.find((u: any) => u.email === email)?.id;
        } else {
          targetId = existing.id;
        }
      } else {
        return { error: "Auth Error: " + authError.message };
      }
    }

    if (!targetId) return { error: "No se pudo determinar el ID del usuario." };

    // 4. UPSERT DEL PERFIL (La parte crítica)
    console.log(
      ">>> [SERVER] Actualizando Perfil para ID:",
      targetId,
      "con Org:",
      orgId,
    );

    const { error: profileError } = await admin.from("profiles").upsert({
      id: targetId,
      email: email,
      full_name: fullName,
      role: role,
      organization_id: orgId, // <--- ESTO ES LO IMPORTANTE
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error(">>> [SERVER] Profile Error:", profileError);
      return { error: "Profile Error: " + profileError.message };
    }

    console.log(">>> [SERVER] Éxito. Revalidando...");
    revalidatePath("/dashboard/team");
    return { success: true };
  } catch (e: any) {
    console.error(">>> [SERVER] CRASH:", e);
    return { error: "Crash: " + e.message };
  }
}

// 4. Actualizar Rol (Existente)
export async function updateUserRole(
  userId: string,
  newRole: string,
  newOrgId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, organization_id: newOrgId })
    .eq("id", userId);

  if (error) return { error: "Error updating user" };
  revalidatePath("/dashboard/team");
  return { success: true };
}
