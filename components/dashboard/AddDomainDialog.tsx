"use client";

import { useState } from "react";
import { addDomain } from "@/app/dashboard/domains/actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
}

interface AddDomainDialogProps {
  clients: Client[];
  preselectedClientId?: string;
}

export function AddDomainDialog({
  clients,
  preselectedClientId,
}: AddDomainDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState(preselectedClientId || "");

  console.log(
    ">>> [DEBUG DOMAINS] AddDomainDialog: Rendered with clients:",
    clients.length,
  );

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    if (!clientId) {
      console.warn(
        ">>> [DEBUG DOMAINS] AddDomainDialog: Validation failed - No Client ID",
      );
      toast.error("Debes seleccionar un cliente");
      setIsLoading(false);
      return;
    }

    formData.append("client_id", clientId);

    const domain = formData.get("url");
    const price = formData.get("renewal_price");

    console.log(">>> [DEBUG DOMAINS] AddDomainDialog: Submitting...", {
      domain,
      price,
      clientId,
      fullFormData: Object.fromEntries(formData),
    });

    try {
      const res = await addDomain(formData);
      console.log(">>> [DEBUG DOMAINS] AddDomainDialog: Server response:", res);

      setIsLoading(false);

      if (res?.error) {
        console.error(">>> [DEBUG DOMAINS] AddDomainDialog: Error:", res.error);
        toast.error(res.error);
      } else {
        console.log(">>> [DEBUG DOMAINS] AddDomainDialog: Success");
        toast.success("Dominio agregado correctamente");
        setOpen(false);
        if (!preselectedClientId) {
          setClientId("");
        }
      }
    } catch (e) {
      console.error(">>> [DEBUG DOMAINS] AddDomainDialog: Exception:", e);
      setIsLoading(false);
      toast.error("Error desconocido");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Dominio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Dominio</DialogTitle>
          <DialogDescription>
            Registra un dominio para comenzar a monitorearlo.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                name="url"
                placeholder="ejemplo.com"
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Cliente
              </Label>
              <div className="col-span-3 space-y-1">
                <Select
                  value={clientId}
                  onValueChange={setClientId}
                  disabled={!!preselectedClientId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!preselectedClientId && (
                  <p className="text-[10px] text-muted-foreground">
                    ¿No encuentras el cliente? Créalo primero en la sección
                    Clientes.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Proveedor
              </Label>
              <div className="col-span-3">
                <Select name="provider" defaultValue="Vercel" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vercel">Vercel</SelectItem>
                    <SelectItem value="InMotion">InMotion</SelectItem>
                    <SelectItem value="GoDaddy">GoDaddy</SelectItem>
                    <SelectItem value="Namecheap">Namecheap</SelectItem>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider_account" className="text-right">
                Cuenta / Perfil
              </Label>
              <Input
                id="provider_account"
                name="provider_account"
                placeholder="Ej: usuario@vercel.com / Equipo A"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiration_date" className="text-right">
                Vence
              </Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="date"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="renewal_price" className="text-right">
                Renovación
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  $
                </span>
                <Input
                  id="renewal_price"
                  name="renewal_price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
