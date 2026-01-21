"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjectDetails(id: string) {
  const supabase = await createClient();

  if (!id) {
    console.error("❌ getProjectDetails: ID es indefinido o nulo");
    return null;
  }

  try {
    // 1. Ejecutamos las dos consultas en paralelo para evitar errores de Joins complejos
    const [projectRes, logsRes] = await Promise.all([
      // A. Traer Proyecto + Cliente
      supabase
        .from("projects")
        .select(
          `
          *,
          clients (
            id,
            name,
            contact_email,
            organization_id,
            phone
          )
        `,
        )
        .eq("id", id)
        .single(),

      // B. Traer Bitácora (Logs) por separado
      supabase
        .from("project_logs")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (projectRes.error) {
      console.error(
        "❌ Error fetching project:",
        projectRes.error.message,
        projectRes.error.details,
      );
      return null;
    }

    let logsWithAuthors: any[] = [];

    // C. Enriquecer logs con nombres de autores (Manual Fetching para seguridad)
    if (logsRes.data && logsRes.data.length > 0) {
      logsWithAuthors = await Promise.all(
        logsRes.data.map(async (log: any) => {
          // Sencillo fetch de perfil para evitar joins complejos con auth
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", log.created_by)
            .single();
          return {
            ...log,
            author_name: profile?.full_name || "Usuario",
          };
        }),
      );
    }

    // Combinamos los resultados
    const project = {
      ...projectRes.data,
      project_logs: logsWithAuthors,
    };

    return project;
  } catch (err) {
    console.error("❌ Unexpected error in getProjectDetails:", err);
    return null;
  }
}

export async function updateProjectStatus(id: string, formData: FormData) {
  const supabase = await createClient();
  const status = formData.get("status") as string;
  const progress = formData.get("progress")
    ? parseInt(formData.get("progress") as string)
    : 0;

  const { error } = await supabase
    .from("projects")
    .update({ status, progress, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar estado." };
  }

  revalidatePath(`/dashboard/projects/${id}`);
  return { success: true };
}

export async function addProjectLog(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const content = formData.get("content") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };
  if (!content) return { error: "El contenido no puede estar vacío" };

  const { error } = await supabase.from("project_logs").insert({
    project_id: projectId,
    content,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating log:", error);
    return { error: "Error al guardar la nota." };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}
