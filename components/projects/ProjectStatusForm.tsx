"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SubmitButton } from "@/components/ui/submit-button";
import { Save } from "lucide-react";
import { updateProjectStatus } from "@/app/dashboard/projects/[id]/actions";
import { toast } from "sonner";

interface ProjectStatusFormProps {
  projectId: string;
  initialStatus: string;
  initialProgress: number;
}

export function ProjectStatusForm({
  projectId,
  initialStatus,
  initialProgress,
}: ProjectStatusFormProps) {
  const [progress, setProgress] = useState(initialProgress || 0);

  const updateAction = updateProjectStatus.bind(null, projectId);

  async function handleSubmit(formData: FormData) {
    // We wrap the server action to handle toasts on client side if needed
    // But SubmitButton usually handles pending state.
    // For simple toast feedback:
    const result = await updateAction(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Proyecto actualizado correctamente");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Fase Actual</Label>
          <Select name="status" defaultValue={initialStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planificado</SelectItem>
              <SelectItem value="in_progress">En Progreso</SelectItem>
              <SelectItem value="qa">QA / Revisión</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="progress">Porcentaje de Avance</Label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {progress}%
            </span>
          </div>

          {/* Hidden input to submit the actual value */}
          <input type="hidden" name="progress" value={progress} />

          <div className="flex items-center gap-4">
            <Slider
              value={[progress]}
              onValueChange={(vals) => setProgress(vals[0])}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </SubmitButton>
      </div>
    </form>
  );
}
