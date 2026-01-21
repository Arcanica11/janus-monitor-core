"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSocialCredential } from "@/app/dashboard/clients/[id]/actions";
import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/submit-button";

interface AddSocialDialogProps {
  clientId: string;
}

export function AddSocialDialog({ clientId }: AddSocialDialogProps) {
  const [open, setOpen] = useState(false);

  const createAction = createSocialCredential.bind(null, clientId);

  async function clientAction(formData: FormData) {
    const result = await createAction(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Credencial guardada");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Red
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Credencial Social</DialogTitle>
          <DialogDescription>
            Guarda accesos de redes sociales u otras plataformas cloud.
          </DialogDescription>
        </DialogHeader>
        <form action={clientAction} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select name="platform" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">X (Twitter)</SelectItem>
                  <SelectItem value="gmail">Google / Gmail</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario / Email</Label>
              <Input
                id="username"
                name="username"
                required
                placeholder="@usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="text"
                placeholder="Visible al escribir"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="recovery_email">
                Email/Teléfono Recuperación
              </Label>
              <Input
                id="recovery_email"
                name="recovery_email"
                placeholder="ej. admin@agencia.com"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="url">URL de Login (Opcional)</Label>
              <Input id="url" name="url" placeholder="https://..." />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Detalles adicionales, 2FA, etc."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
