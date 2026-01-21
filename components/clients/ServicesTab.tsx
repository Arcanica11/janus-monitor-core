"use client";

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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddServiceDialog } from "./AddServiceDialog";
import { deleteService } from "@/app/dashboard/clients/[id]/actions";
import { Calendar, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";

interface ServicesTabProps {
  clientId: string;
  services: any[];
}

export function ServicesTab({ clientId, services }: ServicesTabProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;
    const res = await deleteService(id, clientId);
    if (res?.error) toast.error(res.error);
    else toast.success("Servicio eliminado");
  };

  const getBillingBadge = (dateString: string) => {
    if (!dateString) return <Badge variant="outline">N/A</Badge>;

    const date = new Date(dateString);
    const now = new Date();
    const days = differenceInDays(date, now);

    if (days < 0)
      return <Badge variant="destructive">Vencido ({Math.abs(days)}d)</Badge>;
    if (days < 7)
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">
          Pronto ({days}d)
        </Badge>
      );
    if (days < 30)
      return (
        <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">
          Próximo ({days}d)
        </Badge>
      );

    return <Badge className="bg-green-600 hover:bg-green-700">En fecha</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Servicios Recurrentes</CardTitle>
          <CardDescription>
            Mantenimientos, licencias y costos fijos.
          </CardDescription>
        </div>
        <AddServiceDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Próximo Cobro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-muted-foreground"
                >
                  No hay servicios registrados.
                </TableCell>
              </TableRow>
            ) : (
              services.map((svc) => (
                <TableRow key={svc.id}>
                  <TableCell className="font-medium">{svc.name}</TableCell>
                  <TableCell className="capitalize">
                    {svc.billing_cycle === "one_time"
                      ? "Pago Único"
                      : svc.billing_cycle === "yearly"
                        ? "Anual"
                        : "Mensual"}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(svc.cost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {svc.next_billing_date &&
                        format(new Date(svc.next_billing_date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      {getBillingBadge(svc.next_billing_date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(svc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
