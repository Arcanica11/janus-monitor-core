"use client";

import { useState } from "react";
import { createClientAction } from "@/app/dashboard/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/submit-button";

interface Organization {
  id: string;
  name: string;
}

interface AddClientSheetProps {
  isSuperAdmin?: boolean;
  organizations?: Organization[];
}

export function AddClientSheet({
  isSuperAdmin = false,
  organizations = [],
}: AddClientSheetProps) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const res = await createClientAction(formData);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Cliente creado exitosamente");
      setOpen(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px] p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Agregar Cliente</SheetTitle>
          <SheetDescription>
            Registra una nueva empresa o cliente para tu agencia.
          </SheetDescription>
        </SheetHeader>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Nombre de la Empresa
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Rueda la Rola S.A.S"
              required
              className="h-10"
            />
          </div>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label
                htmlFor="organization_id"
                className="text-blue-600 font-medium"
              >
                Asignar a Organización
              </Label>
              <Select name="organization_id">
                <SelectTrigger className="h-10 border-blue-200 bg-blue-50/50">
                  <SelectValue placeholder="Seleccionar Organización..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="contact_email"
              className="text-foreground font-medium"
            >
              Email de Contacto Principal
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              placeholder="contacto@empresa.com"
              className="h-10"
            />
          </div>

          <SheetFooter className="mt-8">
            <SubmitButton
              className="w-full sm:w-auto h-10 px-8"
              loadingText="Guardando..."
            >
              Guardar Cliente
            </SubmitButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
