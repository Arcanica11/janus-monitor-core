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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { addAsset } from "@/app/dashboard/organization/[id]/actions";

export function AddClientDomainDialog({
  clientId,
  orgId,
}: {
  clientId: string;
  orgId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.append("client_id", clientId); // CRITICAL: Link to client

    startTransition(async () => {
      try {
        const res = await addAsset(orgId, formData);
        if (res?.error) toast.error(res.error);
        else {
          toast.success("Dominio agregado al cliente");
          setOpen(false);
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
          <Plus className="w-4 h-4 mr-2" /> Agregar Dominio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Dominio de Cliente</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          {/* Domain Name */}
          <div className="space-y-2">
            <Label>Dominio / URL *</Label>
            <Input name="name" placeholder="ej: cliente-site.com" required />
          </div>

          {/* Provider & Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select name="provider">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vercel">Vercel</SelectItem>
                  <SelectItem value="InMotion">InMotion</SelectItem>
                  <SelectItem value="AWS">AWS</SelectItem>
                  <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                  <SelectItem value="GoDaddy">GoDaddy</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta / Usuario</Label>
              <Input name="account_holder" placeholder="ej: usuario@cliente" />
            </div>
          </div>

          {/* Registrar & Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registrador</Label>
              <Select name="registrar">
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Namecheap">Namecheap</SelectItem>
                  <SelectItem value="GoDaddy">GoDaddy</SelectItem>
                  <SelectItem value="Google Domains">Google Domains</SelectItem>
                  <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Costo Renovación ($)</Label>
              <Input name="cost" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Fecha de Renovación</Label>
            <Input name="expiration_date" type="date" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isPending ? "Guardando..." : "Guardar Dominio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
