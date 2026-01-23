"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createTicket } from "@/app/dashboard/clients/[id]/actions";
import { useRouter } from "next/navigation";

interface AddClientTicketDialogProps {
  clientId: string;
}

export function AddClientTicketDialog({
  clientId,
}: AddClientTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const createTicketWithId = createTicket.bind(null, clientId);

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await createTicketWithId(formData);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Ticket creado correctamente");
          setOpen(false);
          router.refresh();
        }
      } catch (e) {
        toast.error("Error al crear ticket");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Ticket de Soporte</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Asunto</Label>
            <Input
              name="subject"
              placeholder="Ej: Error en sitio web"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select name="priority" defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripción del Problema</Label>
            <Textarea
              name="description"
              placeholder="Describa el problema detalladamente..."
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Crear Ticket
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
