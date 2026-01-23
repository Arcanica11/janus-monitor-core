"use client";

import { useState } from "react";
import { addDomainMaster } from "@/app/dashboard/domains/actions";
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
}

export function AddDomainDialog({ clients }: AddDomainDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    // Append client_id (can be empty for internal domains)
    formData.append("client_id", clientId);

    const domain = formData.get("domain");

    console.log(">>> [DEBUG DOMAINS] AddDomainDialog: Submitting...", {
      domain,
      clientId: clientId || "INTERNO",
      fullFormData: Object.fromEntries(formData),
    });

    try {
      const res = await addDomainMaster(formData);
      console.log(">>> [DEBUG DOMAINS] AddDomainDialog: Server response:", res);

      setIsLoading(false);

      if (res?.error) {
        console.error(">>> [DEBUG DOMAINS] AddDomainDialog: Error:", res.error);
        toast.error(res.error);
      } else {
        console.log(">>> [DEBUG DOMAINS] AddDomainDialog: Success");
        toast.success("Dominio agregado correctamente");
        setOpen(false);
        setClientId("");
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Dominio</DialogTitle>
          <DialogDescription>
            Registra un dominio para monitorear su vencimiento y ubicación.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Dominio */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="domain" className="text-right">
                Dominio *
              </Label>
              <Input
                id="domain"
                name="domain"
                placeholder="ejemplo.com"
                className="col-span-3"
                required
              />
            </div>

            {/* Cliente (Opcional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Cliente
              </Label>
              <div className="col-span-3 space-y-1">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Interno (Sin cliente)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Interno (Arknica)</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Deja vacío para dominios propios de la organización
                </p>
              </div>
            </div>

            {/* Registrador */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="registrar" className="text-right">
                Registrador *
              </Label>
              <div className="col-span-3">
                <Select name="registrar" defaultValue="Namecheap" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Namecheap">Namecheap</SelectItem>
                    <SelectItem value="GoDaddy">GoDaddy</SelectItem>
                    <SelectItem value="Google Domains">
                      Google Domains
                    </SelectItem>
                    <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proveedor Hosting */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hosting_provider" className="text-right">
                Proveedor *
              </Label>
              <div className="col-span-3">
                <Select name="hosting_provider" defaultValue="Vercel" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vercel">Vercel</SelectItem>
                    <SelectItem value="InMotion">InMotion</SelectItem>
                    <SelectItem value="AWS">AWS</SelectItem>
                    <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="Netlify">Netlify</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dueño de Cuenta */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account_owner" className="text-right">
                Cuenta *
              </Label>
              <Input
                id="account_owner"
                name="account_owner"
                placeholder="Ej: arknica11, ivang111"
                className="col-span-3"
                required
              />
            </div>

            {/* Fecha Expiración */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiration_date" className="text-right">
                Vence *
              </Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="date"
                className="col-span-3"
                required
              />
            </div>

            {/* Precio Renovación */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="renewal_price" className="text-right">
                Renovación *
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
