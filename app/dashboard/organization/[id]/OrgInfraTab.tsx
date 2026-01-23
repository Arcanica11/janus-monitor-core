"use client";

import { useState, useTransition } from "react";
import {
  addSubscription,
  addAsset,
  addCorporateEmail,
  deleteItem,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Eye, EyeOff, Copy, Key } from "lucide-react";

interface OrgInfraTabProps {
  orgId: string;
  subscriptions: any[];
  assets: any[];
  corporateEmails: any[];
}

export function OrgInfraTab({
  orgId,
  subscriptions,
  assets,
  corporateEmails,
}: OrgInfraTabProps) {
  return (
    <div className="space-y-6">
      {/* SECTION A: SERVICES & SUBSCRIPTIONS (Merged) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Servicios Cloud & SaaS</CardTitle>
            <CardDescription>
              Gestión unificada de suscripciones y credenciales de acceso.
            </CardDescription>
          </div>
          <AddServiceDialog orgId={orgId} />
        </CardHeader>
        <CardContent>
          <ServicesTable items={subscriptions} orgId={orgId} />
        </CardContent>
      </Card>

      {/* SECTION B: ASSETS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dominios y Activos</CardTitle>
            <CardDescription>
              Dominios, sitios web y aplicaciones.
            </CardDescription>
          </div>
          <AddAssetDialog orgId={orgId} />
        </CardHeader>
        <CardContent>
          <AssetsTable items={assets} orgId={orgId} />
        </CardContent>
      </Card>

      {/* SECTION C: CORPORATE EMAILS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Correos Corporativos</CardTitle>
            <CardDescription>
              Cuentas de correo creadas para la organización.
            </CardDescription>
          </div>
          <AddEmailDialog orgId={orgId} />
        </CardHeader>
        <CardContent>
          <EmailsTable items={corporateEmails} orgId={orgId} />
        </CardContent>
      </Card>
    </div>
  );
}

// ------ TABLES ------

function ServicesTable({ items, orgId }: { items: any[]; orgId: string }) {
  if (items.length === 0)
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay servicios registrados.
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proveedor / Servicio</TableHead>
          <TableHead>Plan & Costo</TableHead>
          <TableHead>Acceso Maestro</TableHead>
          <TableHead>Ciclo / Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <span>{item.service_name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.provider}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {item.tier && (
                  <Badge variant="outline" className="w-fit">
                    {item.tier}
                  </Badge>
                )}
                <span className="font-mono text-xs">${item.cost}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">
                  {item.login_email || "-"}
                </span>
                <PasswordReveal password={item.login_password} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col text-xs">
                <span className="capitalize">{item.billing_cycle}</span>
                {item.next_billing_date && (
                  <span className="text-muted-foreground">
                    Exp: {new Date(item.next_billing_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <DeleteItemButton
                id={item.id}
                table="org_subscriptions"
                orgId={orgId}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AssetsTable({ items, orgId }: { items: any[]; orgId: string }) {
  if (items.length === 0)
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay activos registrados.
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Nombre / URL</TableHead>
          <TableHead>Registrador</TableHead>
          <TableHead>Expiración</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((asset) => {
          const daysUntilExp = asset.expiration_date
            ? Math.ceil(
                (new Date(asset.expiration_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              )
            : 999;
          const isExpiring = daysUntilExp < 30;

          return (
            <TableRow key={asset.id}>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {asset.type}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.registrar || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {asset.expiration_date
                    ? new Date(asset.expiration_date).toLocaleDateString()
                    : "N/A"}
                  {isExpiring && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1 h-5"
                    >
                      Vence pronto
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DeleteItemButton
                  id={asset.id}
                  table="org_assets"
                  orgId={orgId}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function EmailsTable({ items, orgId }: { items: any[]; orgId: string }) {
  if (items.length === 0)
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay correos corporativos.
      </div>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email Address</TableHead>
          <TableHead>Asignado A</TableHead>
          <TableHead>Contraseña</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium flex items-center gap-2">
              {item.email_address}
              <CopyButton text={item.email_address} />
            </TableCell>
            <TableCell>{item.assigned_to || "-"}</TableCell>
            <TableCell>
              <PasswordReveal password={item.password} />
            </TableCell>
            <TableCell className="text-right">
              <DeleteItemButton
                id={item.id}
                table="org_corporate_emails"
                orgId={orgId}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ------ HELPER COMPONENTS ------

function PasswordReveal({ password }: { password?: string }) {
  const [visible, setVisible] = useState(false);

  if (!password)
    return <span className="text-muted-foreground text-xs italic">-</span>;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-20 truncate">
        {visible ? password : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </Button>
      <CopyButton text={password} />
    </div>
  );
}

function CopyButton({ text }: { text?: string }) {
  async function handleCopy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Copiado");
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      <Copy className="w-3 h-3" />
    </Button>
  );
}

function DeleteItemButton({
  id,
  table,
  orgId,
}: {
  id: string;
  table: "org_subscriptions" | "org_assets" | "org_corporate_emails";
  orgId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("¿Eliminar este ítem?")) return;
    startTransition(async () => {
      try {
        const res = await deleteItem(table, id, orgId);
        if (res?.error) toast.error("Error: " + res.error);
        else toast.success("Eliminado correctamente");
      } catch (e) {
        toast.error("Error al eliminar");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-500 hover:bg-red-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}

// ------ DIALOGS ------

function AddServiceDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await addSubscription(orgId, formData);
        if (res?.error) {
          toast.error("Error: " + res.error);
        } else {
          toast.success("Servicio agregado");
          setOpen(false);
        }
      } catch (e) {
        toast.error("Error al guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Servicio / Suscripción</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Input name="service_name" placeholder="Ej: Vercel" required />
            </div>
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Input name="provider" placeholder="Ej: Vercel Inc." />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Costo ($)</Label>
              <Input name="cost" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Plan (Tier)</Label>
              <Input name="tier" placeholder="Pro, Business..." />
            </div>
            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select name="billing_cycle" defaultValue="monthly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Siguiente Cobro</Label>
            <Input name="next_billing_date" type="date" />
          </div>

          <div className="border-t pt-4 mt-2">
            <Label className="mb-2 block text-xs uppercase text-muted-foreground font-bold">
              Credenciales Maestras (Opcional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email de Acceso</Label>
                <Input name="login_email" placeholder="admin@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  name="login_password"
                  type="password"
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Guardando..." : "Guardar Servicio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAssetDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await addAsset(orgId, formData);
        if (res?.error) toast.error(res.error);
        else {
          toast.success("Activo agregado");
          setOpen(false);
        }
      } catch (e) {
        toast.error("Error al guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Agregar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Activo Digital</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select name="type" defaultValue="domain">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domain">Dominio</SelectItem>
                  <SelectItem value="website">Sitio Web</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nombre / URL</Label>
              <Input name="name" placeholder="ej: arknica.com" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registrador</Label>
              <Input name="registrar" placeholder="GoDaddy, etc." />
            </div>
            <div className="space-y-2">
              <Label>Expiración</Label>
              <Input name="expiration_date" type="date" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddEmailDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await addCorporateEmail(orgId, formData);
        if (res?.error) toast.error(res.error);
        else {
          toast.success("Email creado");
          setOpen(false);
        }
      } catch (e) {
        toast.error("Error al guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Correo Corporativo</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Dirección de Email</Label>
            <Input
              name="email_address"
              type="email"
              placeholder="nombre@empresa.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Asignado A</Label>
            <Input name="assigned_to" placeholder="Nombre del empleado" />
          </div>
          <div className="space-y-2">
            <Label>Contraseña Inicial</Label>
            <Input
              name="password"
              type="text"
              placeholder="Generar una segura..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isPending ? "Creando..." : "Crear Email"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
