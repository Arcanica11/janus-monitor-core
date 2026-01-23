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
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this, otherwise Input
import {
  Plus,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { createClientAction } from "@/app/dashboard/clients/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Keep for Org Select if needed

interface CreateClientDialogProps {
  isSuperAdmin: boolean;
  organizations: any[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creando...
        </>
      ) : (
        "Crear Cliente"
      )}
    </Button>
  );
}

export function CreateClientDialog({
  isSuperAdmin,
  organizations,
}: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);

  // We wrap the server action in a client wrapper to handle toast/closing
  async function handleAction(formData: FormData) {
    const res = await createClientAction(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Cliente creado exitosamente");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Agregar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Registra una nueva empresa o cliente.
          </DialogDescription>
        </DialogHeader>
        <form action={handleAction} className="space-y-4 py-4">
          {/* Org Selector for Super Admin */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="organization_id" className="text-destructive">
                Organización (Super Admin) *
              </Label>
              <select
                name="organization_id"
                id="organization_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecciona una organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Company Name (Required) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Nombre de la Empresa *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Inmobiliaria Futuro S.A."
              required
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
                placeholder="Ej: Juan Pérez"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Teléfono
              </Label>
              <Input id="phone" name="phone" placeholder="+57 300 123 4567" />
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
              placeholder="Calle 123 # 45-67, Ciudad"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
            ℹ️ <strong>Nota:</strong> Solo el nombre de la empresa es
            obligatorio, pero te recomendamos llenar los datos de contacto para
            futuras automatizaciones de facturación y notificaciones.
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
