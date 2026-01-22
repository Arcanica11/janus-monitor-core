"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/app/dashboard/projects/actions";
import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/submit-button";

interface Client {
  id: string;
  name: string;
}

interface AddProjectDialogProps {
  clients: Client[];
}

export function AddProjectDialog({ clients }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);

  async function clientAction(formData: FormData) {
    const result = await createProject(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Proyecto creado correctamente");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Registra una nueva migración o proyecto para un cliente.
          </DialogDescription>
        </DialogHeader>
        <form action={clientAction} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select name="client_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                ¿No encuentras el cliente? Créalo primero en la sección
                Clientes.
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nombre del Proyecto</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej. Migración WordPress a Next.js"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado Inicial</Label>
              <Select name="status" defaultValue="planned" required>
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

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select name="priority" defaultValue="medium" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha Límite</Label>
              <Input id="deadline" name="deadline" type="date" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto ($)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <SubmitButton>Crear Proyecto</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
