"use client";

import { useState } from "react";
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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (isSuperAdmin && !selectedOrg) {
      toast.error("Selecciona una organización.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (isSuperAdmin) formData.set("organization_id", selectedOrg);

      const res = await createClientAction(formData);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Cliente creado");
        setIsOpen(false);
        setSelectedOrg("");
        router.refresh();
      }
    } catch (e) {
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
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Agregar Nuevo Cliente</SheetTitle>
        </SheetHeader>

        {/* FIX VISUAL: Margen superior y espaciado vertical */}
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {isSuperAdmin && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-md border">
              <Label>Asignar Organización</Label>
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
