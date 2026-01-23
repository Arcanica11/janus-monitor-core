"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
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
import {
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
} from "lucide-react";
import { updateClient } from "@/app/dashboard/clients/actions";
import { toast } from "sonner";

interface EditClientDialogProps {
  client: any;
  isReadOnlyName: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : (
        "Guardar Cambios"
      )}
    </Button>
  );
}

export function EditClientDialog({
  client,
  isReadOnlyName,
}: EditClientDialogProps) {
  const [open, setOpen] = useState(false);

  async function handleAction(formData: FormData) {
    const res = await updateClient(client.id, formData, client.organization_id);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Cliente actualizado exitosamente");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifique los datos de la empresa o contacto.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="space-y-4 py-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Nombre de la Empresa {isReadOnlyName ? "(Solo Lectura)" : "*"}
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={client.name}
              required
              readOnly={isReadOnlyName}
              className={isReadOnlyName ? "bg-muted" : ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nombre Contacto
              </Label>
              <Input
                id="contact_name"
                name="contact_name"
                defaultValue={client.contact_name}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Teléfono
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={client.contact_phone}
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Correo Electrónico
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={client.contact_email}
              placeholder="contacto@empresa.com"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Dirección Postal
            </Label>
            <Input
              id="address"
              name="address"
              defaultValue={client.address}
              placeholder="Calle 123 # 45-67, Ciudad"
            />
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
