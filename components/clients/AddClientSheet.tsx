"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientAction } from "@/app/dashboard/clients/actions";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddClientSheetProps {
  isSuperAdmin: boolean;
  organizations: { id: string; name: string }[];
}

export function AddClientSheet({
  isSuperAdmin,
  organizations,
}: AddClientSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const router = useRouter();

  // DEBUG: Verificar props al montar o cambiar
  useEffect(() => {
    console.log("--> [DEBUG] AddClientSheet: Renderizado/Props actualizados:", {
      isSuperAdmin,
      organizationsCount: organizations?.length || 0,
      organizationsData: organizations,
    });
  }, [isSuperAdmin, organizations]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    // Validación de UI antes de enviar
    if (isSuperAdmin && !selectedOrg) {
      console.warn(
        "--> [DEBUG] AddClientSheet: Validación fallida (Falta organización)",
      );
      toast.error("Selecciona una organización.");
      return;
    }

    setIsLoading(true);

    try {
      // CONSTRUCCIÓN MANUAL DEL FORMDATA
      // Esto es crítico porque el Select de Radix UI no es un input nativo html
      const form = e.currentTarget;
      const formData = new FormData();

      const nameInput = form.elements.namedItem("name") as HTMLInputElement;
      const emailInput = form.elements.namedItem(
        "contact_email",
      ) as HTMLInputElement;

      formData.append("name", nameInput.value);
      formData.append("contact_email", emailInput.value);

      if (isSuperAdmin) {
        formData.append("organization_id", selectedOrg);
      }

      console.log("--> [DEBUG] AddClientSheet: Enviando FormData:", {
        name: nameInput.value,
        email: emailInput.value,
        orgId: isSuperAdmin ? selectedOrg : "AUTO (User Org)",
      });

      const res = await createClientAction(formData);

      if (res?.error) {
        console.error(
          "--> [DEBUG] AddClientSheet: Error del servidor:",
          res.error,
        );
        toast.error(res.error);
      } else {
        console.log("--> [DEBUG] AddClientSheet: Éxito");
        toast.success("Cliente creado exitosamente");
        setIsOpen(false);
        setSelectedOrg("");
        router.refresh();
      }
    } catch (e) {
      console.error("--> [DEBUG] AddClientSheet: Error de conexión:", e);
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </SheetTrigger>
      {/* FIX VISUAL: p-6 agregado para restaurar el padding */}
      <SheetContent className="w-[400px] sm:w-[540px] p-6">
        <SheetHeader>
          <SheetTitle>Agregar Nuevo Cliente</SheetTitle>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {isSuperAdmin && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-md border border-slate-200">
              <Label className="font-semibold text-slate-700">
                Asignar Organización
              </Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecciona empresa..." />
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
            <Label htmlFor="name">Nombre del Cliente</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ej: Restaurante XYZ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email (Opcional)</Label>
            <Input id="contact_email" name="contact_email" type="email" />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Guardar Cliente"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
