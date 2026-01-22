"use client";

import { useState } from "react";
import { createClientAction } from "@/app/dashboard/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Definición de Props
interface AddClientSheetProps {
  isSuperAdmin: boolean;
  organizations: { id: string; name: string }[];
  currentOrgId?: string; // Kept for safety if passed
}

export function AddClientSheet({
  isSuperAdmin,
  organizations,
}: AddClientSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Manejador Síncrono (Bloqueo instantáneo)
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 1. Detener el navegador

    if (isLoading) return; // 2. Si ya está cargando, ignorar clics extra
    setIsLoading(true); // 3. Activar spinner

    try {
      const formData = new FormData(e.currentTarget);
      const res = await createClientAction(formData);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Cliente creado exitosamente");
        setIsOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false); // 4. Liberar botón
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px] p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Agregar Cliente</SheetTitle>
        </SheetHeader>

        {/* Usamos onSubmit en lugar de action */}
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Nombre de la Empresa
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Rueda la Rola"
              required
              className="h-10"
            />
          </div>

          {/* SELECTOR DE ORGANIZACIÓN (SOLO SUPER ADMIN) */}
          {isSuperAdmin && organizations.length > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="organization_id"
                className="text-blue-600 font-medium"
              >
                Asignar a Organización
              </Label>
              <Select name="organization_id" defaultValue={organizations[0].id}>
                <SelectTrigger className="h-10 border-blue-200 bg-blue-50/50">
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
              <p className="text-xs text-muted-foreground">
                Como Super Admin, eliges quién es el dueño del cliente.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="contact_email"
              className="text-foreground font-medium"
            >
              Email de Contacto (Opcional)
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              placeholder="contacto@cliente.com"
              className="h-10"
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto h-10 px-8"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
