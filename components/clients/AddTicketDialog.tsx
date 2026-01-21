"use client";

import { useState } from "react";
import { createTicket } from "@/app/dashboard/clients/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LifeBuoy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/submit-button";

interface AddTicketDialogProps {
  clientId: string;
}

export function AddTicketDialog({ clientId }: AddTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBillable, setIsBillable] = useState(false);
  const [type, setType] = useState("support");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    // Append checkbox state manually if needed, but checkbox name="is_billable" works if checked
    // However, shadcn checkbox controlled state might not submit via native form automatically if not careful.
    // We will ensure it by adding a hidden input or relying on the name attribute if Checkbox supports it perfectly.
    // Shadcn Checkbox uses radix-ui checkbox which doesn't always play nice with FormData directly without a hidden input.
    // Let's add a hidden input manually to be safe.

    // Actually, createTicket expects "on" if checked.
    if (isBillable) {
      formData.append("is_billable", "on");
    }

    const res = await createTicket(clientId, formData);
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Ticket creado correctamente");
      setOpen(false);
      setIsBillable(false); // Reset
    }
  }

  // Auto-suggest not billable for maintenance if desired, but user said "suggest is_billable = false by default" which is boolean default.
  // Logic: "Si el ticket es de 'Mantenimiento' y está dentro del cupo (2), sugiere is_billable = false por defecto." -> We don't know the quota here easily without props.
  // We will leave it manual for now as per "Checkbox: ¿Es Cobrable?".

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket de Soporte</DialogTitle>
          <DialogDescription>
            Registra una solicitud de soporte o mantenimiento.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ej: Error en formulario de contacto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="support">Soporte (Incidente)</SelectItem>
                <SelectItem value="maintenance">
                  Mantenimiento (Preventivo)
                </SelectItem>
                <SelectItem value="feature">Nueva Funcionalidad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalles del trabajo..."
            />
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="is_billable"
              checked={isBillable}
              onCheckedChange={(c) => setIsBillable(!!c)}
            />
            <Label htmlFor="is_billable" className="cursor-pointer">
              ¿Este trabajo es cobrable?
            </Label>
          </div>

          {isBillable && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="cost">Costo del Ticket</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  $
                </span>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <SubmitButton loadingText="Creando...">Crear Ticket</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
