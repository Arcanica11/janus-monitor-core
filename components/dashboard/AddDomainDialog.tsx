"use client";

import { useState } from "react";
import { addDomain } from "@/app/dashboard/actions";
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

  // ... (async function handleSubmit remains same)
  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const res = await addDomain(formData);
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Dominio agregado correctamente");
      setOpen(false);
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
        {/* ... (DialogHeader remains same) */}
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
              <div className="col-span-3">
                <Select
                  name="client_id"
                  required
                  defaultValue={preselectedClientId}
                  disabled={!!preselectedClientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Hidden input to ensure value is submitted when disabled */}
                {preselectedClientId && (
                  <input
                    type="hidden"
                    name="client_id"
                    value={preselectedClientId}
                  />
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
