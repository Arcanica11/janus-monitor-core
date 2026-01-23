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
import { addCredential } from "@/app/dashboard/clients/[id]/actions";
import { useRouter } from "next/navigation";

interface AddClientCredentialDialogProps {
  clientId: string;
}

export function AddClientCredentialDialog({
  clientId,
}: AddClientCredentialDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const addCredentialWithId = addCredential.bind(null, clientId);

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await addCredentialWithId(formData);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Credencial agregada");
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
          <Plus className="w-4 h-4 mr-2" /> Agregar Credencial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Credencial de Cliente</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Tipo de Credencial</Label>
            <Select name="type" defaultValue="other">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cms">CMS / Dashboard</SelectItem>
                <SelectItem value="hosting">Hosting / Cpanel</SelectItem>
                <SelectItem value="database">Base de Datos</SelectItem>
                <SelectItem value="social">Red Social</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio / Nombre</Label>
              <Input
                name="service_name"
                placeholder="Ej: WordPress Admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL de Acceso</Label>
              <Input name="url" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input name="username" placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                name="password"
                type="text"
                placeholder="Se encriptará..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas Adicionales</Label>
            <Textarea
              name="notes"
              placeholder="Detalles extra, puertos, claves API..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Guardar Credencial
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
