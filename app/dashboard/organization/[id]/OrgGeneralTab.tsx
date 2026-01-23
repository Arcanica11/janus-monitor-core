"use client";

import { useTransition } from "react";
import { updateOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OrgGeneralTab({ organization }: { organization: any }) {
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await updateOrganization(organization.id, formData);

        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success("Organización actualizada");
        }
      } catch (error) {
        toast.error("Error al actualizar");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información General</CardTitle>
        <CardDescription>
          Datos fiscales y de contacto de la entidad.
        </CardDescription>
      </CardHeader>
      <form action={onSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Legal</Label>
              <Input id="name" name="name" defaultValue={organization.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">NIT / Tax ID</Label>
              <Input
                id="tax_id"
                name="tax_id"
                defaultValue={organization.tax_id || ""}
                placeholder="Ej: 900.123.456"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                name="website"
                defaultValue={organization.website || ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de Facturación</Label>
              <Input
                id="contact_email"
                name="contact_email"
                defaultValue={organization.contact_email || ""}
                placeholder="billing@company.com"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t px-6 py-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
