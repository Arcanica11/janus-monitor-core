import { getProjects, getClientsForSelect } from "./actions";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FolderKanban } from "lucide-react";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await getProjects();
  const clients = await getClientsForSelect();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Proyectos Activos
          </h1>
          <p className="text-muted-foreground">
            Gestiona las migraciones y proyectos de tus clientes.
          </p>
        </div>
        <AddProjectDialog clients={clients} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 bg-background/50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            No hay proyectos activos
          </h2>
          <p className="mt-2 text-center text-sm font-normal leading-6 text-muted-foreground max-w-sm">
            No tienes ninguna migración o proyecto en curso. Inicia uno nuevo
            para comenzar a rastrear el progreso.
          </p>
          <div className="mt-6">
            <AddProjectDialog clients={clients} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project: any) => (
            <Link
              href={`/dashboard/projects/${project.id}`}
              key={project.id}
              className="block group"
            >
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
