"use client";

import { useState } from "react";
import { createClientAction } from "@/app/dashboard/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/submit-button";

export function AddClientSheet() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await createClientAction(formData);
    setIsLoading(false);

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
      {/* Added sm:max-w-[500px] specifically for better width control, usually SheetContent has default padding but we can enforce more if needed */}
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
