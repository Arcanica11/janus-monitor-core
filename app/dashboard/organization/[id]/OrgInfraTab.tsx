"use client";

import { useState, useTransition, useMemo } from "react";
import {
  addSubscription,
  addAsset,
  addCorporateEmail,
  deleteItem,
  revealCredential,
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
import {
  Plus,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Receipt,
  CreditCard,
  Wallet,
} from "lucide-react";

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
  // --- FINANCIAL CALCS ---
  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let activeSubs = 0;

    subscriptions.forEach((sub) => {
      activeSubs++;
      const cost = parseFloat(sub.cost) || 0;
      if (sub.billing_cycle === "monthly") {
        monthlyTotal += cost;
      } else if (sub.billing_cycle === "yearly") {
        monthlyTotal += cost / 12;
      }
    });

    return {
      activeSubs,
      monthlyTotal,
    };
  }, [subscriptions]);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="space-y-6">
      {/* SECTION: FINANCIAL KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suscripciones Activas
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubs}</div>
            <p className="text-xs text-muted-foreground">
              Servicios SaaS y Hosting
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gasto Mensual (Est.)
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(stats.monthlyTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Costos operativos recurrentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION A: SERVICES & SUBSCRIPTIONS (Merged) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gastos Operativos (Internal)</CardTitle>
            <CardDescription>
              Infraestructura pagada por la empresa (Vercel, AWS, Licencias).
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
            <CardTitle>Activos Digitales (Propiedad)</CardTitle>
            <CardDescription>
              Dominios y aplicaciones propiedad de la organización.
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
              Cuentas de email del equipo interno.
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

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Servicio / Proveedor</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Costo</TableHead>
          <TableHead>Acceso (Credenciales)</TableHead>
          <TableHead>Renovación</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md border flex items-center justify-center bg-muted/50">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span>{item.service_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.provider}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {/* Mock Status Logic since we lack status column */}
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                Activo
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-mono font-medium">
                  {currencyFormatter.format(item.cost)}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {item.billing_cycle === "monthly" ? "Mes" : "Año"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1 text-sm max-w-[200px]">
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  {item.login_email}
                </div>
                <PasswordReveal
                  id={item.id}
                  table="org_subscriptions"
                  orgId={orgId}
                  hasPassword={!!item.login_password}
                />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col text-xs">
                {item.next_billing_date ? (
                  <span className="font-medium">
                    {new Date(item.next_billing_date).toLocaleDateString()}
                  </span>
                ) : (
                  "-"
                )}
                <span className="text-muted-foreground">
                  {item.tier ? `Plan ${item.tier}` : ""}
                </span>
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

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dominio</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Cuenta</TableHead>
          <TableHead>Renovación</TableHead>
          <TableHead className="text-right">Costo</TableHead>
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
              {/* Domain */}
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{asset.domain}</span>
                  {asset.registrar && (
                    <span className="text-xs text-muted-foreground">
                      Registrador: {asset.registrar}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Provider */}
              <TableCell>
                {asset.hosting_provider ? (
                  <Badge variant="secondary">{asset.hosting_provider}</Badge>
                ) : (
                  "-"
                )}
              </TableCell>

              {/* Account Owner */}
              <TableCell className="text-sm text-muted-foreground">
                {asset.account_owner || "-"}
              </TableCell>

              {/* Expiration */}
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
                      Urgente
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Cost */}
              <TableCell className="text-right font-medium">
                {asset.renewal_price
                  ? currencyFormatter.format(asset.renewal_price)
                  : "-"}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <DeleteItemButton
                  id={asset.id}
                  table="domains_master"
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
          <TableHead>Auditoría de Clave</TableHead>
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
              <PasswordReveal
                id={item.id}
                table="org_corporate_emails"
                orgId={orgId}
                hasPassword={!!item.password}
              />
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

function PasswordReveal({
  id,
  table,
  orgId,
  hasPassword,
}: {
  id: string;
  table: "org_subscriptions" | "org_corporate_emails";
  orgId: string;
  hasPassword: boolean;
}) {
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!hasPassword)
    return <span className="text-muted-foreground text-xs italic">-</span>;

  async function handleToggle() {
    if (revealedPassword) {
      setRevealedPassword(null); // Hide
    } else {
      // Reveal
      setLoading(true);
      try {
        const res = await revealCredential(table, id, orgId);
        if (res.error || !res.params) {
          toast.error("Error/Audit: " + res.error);
        } else {
          setRevealedPassword(res.params);
          toast.success("Evento de seguridad registrado");
        }
      } catch (e) {
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-24 truncate">
        {loading
          ? "Cargando..."
          : revealedPassword
            ? revealedPassword
            : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : revealedPassword ? (
          <EyeOff className="w-3 h-3" />
        ) : (
          <Eye className="w-3 h-3" />
        )}
      </Button>
      {revealedPassword && <CopyButton text={revealedPassword} />}
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
  table:
    | "org_subscriptions"
    | "domains_master"
    | "org_corporate_emails"
    | "services";
  orgId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("¿Confirma eliminar este registro? La acción será auditada."))
      return;
    startTransition(async () => {
      try {
        const res = await deleteItem(table, id, orgId);
        if (res?.error) toast.error("Error: " + res.error);
        else toast.success("Registro eliminado");
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

// ------ DIALOGS (Keep Unchanged basically) ------

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
          <Plus className="mr-2 h-4 w-4" /> Agregar Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Gasto Operativo (SaaS/Cloud)</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio</Label>
              <Input
                name="service_name"
                placeholder="Ej: Vercel, AWS"
                required
              />
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
              Credenciales Maestras (Opcional - Encriptado)
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
            {isPending ? "Guardando..." : "Guardar Gasto"}
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
          <Plus className="w-4 h-4 mr-2" /> Agregar Activo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Activo Digital (Dominio)</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          {/* Domain Name */}
          <div className="space-y-2">
            <Label>Dominio / URL *</Label>
            <Input name="name" placeholder="ej: arknica.com" required />
          </div>

          {/* Provider & Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select name="provider" required>
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
            <div className="space-y-2">
              <Label>Cuenta / Usuario *</Label>
              <Input
                name="account_holder"
                placeholder="ej: arknica11, ivang111"
                required
              />
            </div>
          </div>

          {/* Registrar & Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registrador</Label>
              <Select name="registrar">
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Namecheap">Namecheap</SelectItem>
                  <SelectItem value="GoDaddy">GoDaddy</SelectItem>
                  <SelectItem value="Google Domains">Google Domains</SelectItem>
                  <SelectItem value="Cloudflare">Cloudflare</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Costo Renovación ($)</Label>
              <Input
                name="cost"
                type="number"
                step="0.01"
                placeholder="15.00"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Fecha de Renovación</Label>
            <Input name="expiration_date" type="date" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isPending ? "Guardando..." : "Guardar Activo"}
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
          <Plus className="mr-2 h-4 w-4" /> Agregar Email
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
