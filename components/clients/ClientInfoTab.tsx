"use client";

import { useState } from "react";
import { updateClientProfile } from "@/app/dashboard/clients/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface ClientInfoTabProps {
  client: any; // Type this properly if possible, or leave as any for now
}

export function ClientInfoTab({ client }: ClientInfoTabProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await updateClientProfile(client.id, formData);
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Perfil actualizado correctamente");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información General</CardTitle>
        <CardDescription>
          Detalles de contacto y perfil de la empresa.
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industria / Sector</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={client.industry || ""}
                placeholder="Ej: Tecnología, Salud..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={client.phone || ""}
                placeholder="+57 300..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección Física</Label>
            <Input
              id="address"
              name="address"
              defaultValue={client.address || ""}
              placeholder="Calle 123..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client.notes || ""}
              placeholder="Información clave sobre este cliente..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-muted/50 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
