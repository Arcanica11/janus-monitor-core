"use client";

import { useMemo, useState, useTransition } from "react";
import { addIncomeService, deleteItem } from "./actions";
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
  TrendingUp,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface OrgIncomeTabProps {
  orgId: string;
  services: any[];
  clients: any[];
}

export function OrgIncomeTab({ orgId, services, clients }: OrgIncomeTabProps) {
  // FINANCIAL CALCS (MRR)
  const stats = useMemo(() => {
    let mrr = 0;
    let activeServices = 0;

    services.forEach((svc) => {
      const amount = parseFloat(svc.amount) || 0;
      if (svc.status === "active") {
        activeServices++;
        if (svc.billing_cycle === "monthly") {
          mrr += amount;
        } else if (svc.billing_cycle === "yearly") {
          mrr += amount / 12;
        }
      }
    });

    return { mrr, activeServices };
  }, [services]);

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="space-y-6">
      {/* SECTION: INCOME KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingreso Recurrente (MRR)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {currencyFormatter.format(stats.mrr)}
            </div>
            <p className="text-xs text-muted-foreground">Proyectado mensual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Servicios Activos
            </CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {stats.activeServices}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturados a clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION: SERVICES LIST */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Facturación a Clientes</CardTitle>
            <CardDescription>
              Servicios vendidos y gestionados para terceros (Hosting, Dominios,
              Soporte).
            </CardDescription>
          </div>
          <AddIncomeServiceDialog orgId={orgId} clients={clients} />
        </CardHeader>
        <CardContent>
          <ServicesTable items={services} orgId={orgId} />
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
        No hay servicios activos.
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
          <TableHead>Servicio</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Ciclo</TableHead>
          <TableHead>Ingreso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                {item.service_name}
              </div>
            </TableCell>
            <TableCell>
              {item.clients?.name || (
                <span className="text-muted-foreground italic">
                  Sin Cliente
                </span>
              )}
            </TableCell>
            <TableCell className="capitalize">{item.billing_cycle}</TableCell>
            <TableCell className="font-mono font-medium text-green-700">
              {currencyFormatter.format(item.amount)}
            </TableCell>
            <TableCell>
              <Badge
                variant={item.status === "active" ? "default" : "secondary"}
              >
                {item.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DeleteItemButton id={item.id} table="services" orgId={orgId} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ------ DIALOGS ------

function AddIncomeServiceDialog({
  orgId,
  clients,
}: {
  orgId: string;
  clients: any[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = await addIncomeService(orgId, formData);
        if (res?.error) {
          toast.error("Error: " + res.error);
        } else {
          toast.success("Servicio creado");
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
          <Plus className="mr-2 h-4 w-4" /> Nuevo Ingreso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Servicio (Ingreso)</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Nombre del Servicio</Label>
            <Input
              name="service_name"
              placeholder="Ej: Hosting Anual, Mantenimiento..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select name="client_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.length > 0 ? (
                  clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    No hay clientes registrados sin organización.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ciclo de Facturación</Label>
              <Select name="billing_cycle" defaultValue="monthly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="one_time">Pago Único</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Guardando..." : "Registrar Ingreso"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteItemButton({
  id,
  table,
  orgId,
}: {
  id: string;
  table: "services";
  orgId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm("¿Eliminar este servicio? Se dejará de contabilizar el ingreso.")
    )
      return;
    startTransition(async () => {
      try {
        const res = await deleteItem(table, id, orgId);
        if (res?.error) toast.error("Error: " + res.error);
        else toast.success("Servicio eliminado");
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
