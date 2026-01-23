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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addClientEmail } from "@/app/dashboard/clients/[id]/actions";
import { useRouter } from "next/navigation";

interface AddClientEmailDialogProps {
  clientId: string;
}

export function AddClientEmailDialog({ clientId }: AddClientEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // BINDING PRE-FLIGHT
  const addEmailWithId = addClientEmail.bind(null, clientId);

  async function onSubmit(formData: FormData) {
    console.log("🔵 [FRONTEND] Enviando formulario para cliente:", clientId);
    startTransition(async () => {
      try {
        // We interact with the bound server action
        const res = await addEmailWithId(formData);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Correo de cliente agregado");
          setOpen(false);
          router.refresh();
        }
      } catch (e) {
        toast.error("Error al guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Agregar Correo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Correo para Cliente</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Dirección de Email</Label>
              <Input
                name="email_address"
                type="email"
                placeholder="ej: contacto@cliente.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                name="password"
                type="text"
                placeholder="Generar segura..."
              />
            </div>
            <div className="space-y-2">
              <Label>Asignado A (Opcional)</Label>
              <Input name="assigned_to" placeholder="Nombre del empleado" />
            </div>
          </div>

          {/* Provider & Linked Gmail */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select name="provider" defaultValue="Zoho">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zoho">Zoho Mail</SelectItem>
                  <SelectItem value="InMotion">InMotion Hosting</SelectItem>
                  <SelectItem value="Titanes">Titanes</SelectItem>
                  <SelectItem value="Google">Google Workspace</SelectItem>
                  <SelectItem value="Microsoft">Microsoft 365</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gmail Personal (Redirección)</Label>
              <Input
                name="linked_gmail"
                type="email"
                placeholder="usuario@gmail.com"
              />
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label>Costo Mensual ($)</Label>
            <Input name="cost" type="number" step="0.01" placeholder="0.00" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Guardar Correo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
