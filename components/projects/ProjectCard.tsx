"use client";

import { Building2, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  status: "planned" | "in_progress" | "qa" | "completed";
  priority: "low" | "medium" | "high";
  deadline: string | null;
  budget: number;
  progress: number;
  clients: {
    name: string;
    organization_id?: string;
  };
}

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned":
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-500">
            Planificado
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">En Progreso</Badge>
        );
      case "qa":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700">
            QA / Revisión
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Completado</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>;
      case "medium":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            Media
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Baja
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDeadlineText = (deadline: string | null) => {
    if (!deadline)
      return <span className="text-gray-400 text-sm">Sin fecha límite</span>;

    const today = new Date();
    const daysLeft = differenceInDays(new Date(deadline), today);

    if (daysLeft < 0) {
      return (
        <span className="text-red-600 text-sm font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Vencido hace {Math.abs(daysLeft)}{" "}
          días
        </span>
      );
    }
    if (daysLeft === 0) {
      return (
        <span className="text-orange-600 text-sm font-medium">Vence hoy</span>
      );
    }
    return (
      <span className="text-gray-600 text-sm">Vence en {daysLeft} días</span>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle
            className="text-base font-semibold line-clamp-1"
            title={project.name}
          >
            {project.name}
          </CardTitle>
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <Building2 className="w-3 h-3" />
            {project.clients?.name || "Sin Cliente"}
          </div>
        </div>
        {getPriorityBadge(project.priority)}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          {getStatusBadge(project.status)}
          {project.status === "completed" && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Calendar className="w-3 h-3 text-gray-400" />
          {getDeadlineText(project.deadline)}
        </div>
      </CardContent>
    </Card>
  );
}
