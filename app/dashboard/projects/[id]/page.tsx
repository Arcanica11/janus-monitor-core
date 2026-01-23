import { notFound, redirect } from "next/navigation";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  MessageSquare,
  MoreVertical,
  Pencil,
  Save,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  getProjectDetails,
  updateProjectStatus,
  addProjectLog,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProjectStatusForm } from "@/components/projects/ProjectStatusForm";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectDetails(id);

  if (!project) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return <Badge variant="outline">Planificado</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">En Progreso</Badge>;
      case "qa":
        return <Badge className="bg-purple-600">QA / Revisión</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updateStatusAction = updateProjectStatus.bind(null, project.id);
  // const addLogAction = addProjectLog.bind(null, project.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/projects" className="hover:underline">
              Proyectos
            </Link>
            <span>/</span>
            <span>{project.clients.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(project.status)}
            <Badge variant="secondary" className="capitalize">
              Prioridad:{" "}
              {project.priority === "high"
                ? "Alta"
                : project.priority === "medium"
                  ? "Media"
                  : "Baja"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Placeholder for Edit Project Dialog if needed later */}
          <Button variant="outline" disabled>
            <Pencil className="w-4 h-4 mr-2" />
            Editar Proyecto
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column: Status & Info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Estado y Progreso</CardTitle>
              <CardDescription>
                Actualiza el avance del proyecto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectStatusForm
                projectId={project.id}
                initialStatus={project.status}
                initialProgress={project.progress}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Información Clave
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Deadline
                  </span>
                  <span className="font-medium">
                    {project.deadline
                      ? format(new Date(project.deadline), "dd MMM yyyy", {
                          locale: es,
                        })
                      : "No definido"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Cliente
                  </span>
                  <span className="font-medium">{project.clients.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Presupuesto</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(project.budget || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center p-6 space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Accesos Rápidos
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link
                  href={`/dashboard/clients/${project.client_id}?tab=credentials`}
                >
                  Ver Credenciales
                </Link>
              </Button>
            </Card>
          </div>
        </div>

        {/* Right Column: Bitácora (Logs) */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Bitácora
              </CardTitle>
              <CardDescription>
                Notas y actualizaciones técnicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              {/* Input Area */}
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await addProjectLog(project.id, formData);
                }}
                className="flex gap-2"
              >
                <Input
                  name="content"
                  placeholder="Escribe una actualización..."
                  className="flex-1"
                  autoComplete="off"
                />
                <SubmitButton size="icon">
                  <Send className="w-4 h-4" />
                </SubmitButton>
              </form>

              <Separator />

              {/* Logs Feed */}
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {project.project_logs?.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-8">
                    No hay registros aún.
                  </p>
                ) : (
                  project.project_logs.map((log: any) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <Avatar className="w-8 h-8 border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {log.author_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {log.author_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "d MMM, HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {log.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
