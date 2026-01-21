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
import { Badge } from "@/components/ui/badge";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Globe, DollarSign, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Service {
  id: string;
  name: string;
  cost: number;
  billing_cycle: string;
  next_billing_date: string;
}

interface Domain {
  id: string;
  url: string;
  renewal_price: number | null;
  expiration_date: string;
}

interface FinancialOverviewTabProps {
  services: Service[];
  domains: Domain[];
}

export function FinancialOverviewTab({
  services,
  domains,
}: FinancialOverviewTabProps) {
  // 1. Merge Data
  const servicesMapped = services.map((s) => ({
    id: s.id,
    type: "service",
    name: s.name,
    cost: s.cost || 0,
    cycle: s.billing_cycle,
    date: s.next_billing_date,
    original: s,
  }));

  const domainsMapped = domains.map((d) => ({
    id: d.id,
    type: "domain",
    name: d.url,
    cost: d.renewal_price || 0,
    cycle: "yearly", // Domains are usually yearly
    date: d.expiration_date,
    original: d,
  }));

  const allBillable = [...servicesMapped, ...domainsMapped].sort((a, b) => {
    // Sort by date ascending (soonest first)
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // 2. Calculate Annual Estimate
  const calculateTotalAnnual = () => {
    let total = 0;
    servicesMapped.forEach((s) => {
      if (s.cycle === "monthly") total += s.cost * 12;
      else if (s.cycle === "yearly") total += s.cost;
      // one_time excluded from annual recurring estimate usually, or treated as 0 for future
    });

    domainsMapped.forEach((d) => {
      total += d.cost;
    });

    return total;
  };

  const totalAnnual = calculateTotalAnnual();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const getStatusBadge = (dateString: string) => {
    if (!dateString) return <Badge variant="outline">N/A</Badge>;

    const date = new Date(dateString);
    const now = new Date();
    const days = differenceInDays(date, now);

    if (days < 0)
      return (
        <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
          Vencido
        </Badge>
      );
    if (days < 30)
      return (
        <Badge className="bg-yellow-500 text-black hover:bg-yellow-600 h-5 text-[10px] px-1.5">
          Próximo
        </Badge>
      );

    return null; // Don't show anything if healthy to keep UI clean, or show Green dot?
    // User requested "semáforo... for dates close to expiration".
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Anual Estimado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
              {formatCurrency(totalAnnual)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Suma de servicios recurrentes y renovaciones de dominio.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Unified Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle Financiero & Servicios</CardTitle>
          <CardDescription>
            Lista unificada de todos los items facturables para este cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Próximo Cobro/Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBillable.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No hay servicios ni dominios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                allBillable.map((item, idx) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.type === "domain" ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900"
                        >
                          <Globe className="h-3 w-3" /> Dominio
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <DollarSign className="h-3 w-3" /> Servicio
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize text-sm text-muted-foreground">
                      {item.cycle === "yearly"
                        ? "Anual"
                        : item.cycle === "monthly"
                          ? "Mensual"
                          : "Único"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(item.cost)}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <span
                        className={
                          differenceInDays(new Date(item.date), new Date()) < 30
                            ? "text-orange-600 font-medium"
                            : ""
                        }
                      >
                        {item.date &&
                          format(new Date(item.date), "dd MMM yyyy", {
                            locale: es,
                          })}
                      </span>
                      {getStatusBadge(item.date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
