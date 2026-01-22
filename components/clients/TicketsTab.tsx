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
import { Button } from "@/components/ui/button";
import { AddTicketDialog } from "./AddTicketDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Hammer,
  Zap,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTicketStatus } from "@/app/dashboard/clients/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Ticket {
  id: string;
  title: string;
  type: "maintenance" | "support" | "feature";
  status: string;
  is_billable: boolean;
  cost: number;
  created_at: string;
}

interface Client {
  id: string;
  maintenance_allowance: number;
  last_maintenance_date: string | null;
}

interface TicketsTabProps {
  client: Client;
  tickets: Ticket[];
}

export function TicketsTab({ client, tickets }: TicketsTabProps) {
  const router = useRouter();
  // Calculate Maintenance Usage for current year
  const currentYear = new Date().getFullYear();
  const maintenanceTicketsUsed = tickets.filter(
    (t) =>
      t.type === "maintenance" &&
      new Date(t.created_at).getFullYear() === currentYear,
  ).length;

  const allowance = client.maintenance_allowance || 2;
  const isOverLimit = maintenanceTicketsUsed > allowance;
  const usagePercentage = Math.min(
    (maintenanceTicketsUsed / allowance) * 100,
    100,
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "maintenance":
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
            Mantenimiento
          </Badge>
        );
      case "support":
        return (
          <Badge
            variant="secondary"
            className="bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Soporte
          </Badge>
        );
      case "feature":
        return (
          <Badge
            variant="outline"
            className="border-purple-500 text-purple-600"
          >
            Feature
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "closed":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Cerrado{" "}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer">
            <Zap className="mr-1 h-3 w-3" /> En Progreso{" "}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer">
            Cancelado <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Badge>
        );
      default: // open
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer">
            <Clock className="mr-1 h-3 w-3" /> Abierto{" "}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Badge>
        );
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    toast.promise(updateTicketStatus(ticketId, newStatus, client.id), {
      loading: "Actualizando estado...",
      success: "Estado actualizado",
      error: "Error al actualizar",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* State / KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cupo de Mantenimiento (Año {currentYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">
                {maintenanceTicketsUsed} / {allowance}
              </span>
              <Hammer className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress
              value={usagePercentage}
              className={`h-2 ${isOverLimit ? "bg-red-100 [&>div]:bg-red-500" : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {isOverLimit ? (
                <span className="text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Cupo excedido (Cobrar
                  extras)
                </span>
              ) : (
                `${allowance - maintenanceTicketsUsed} tickets disponibles.`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Último Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {client.last_maintenance_date
                  ? format(
                      new Date(client.last_maintenance_date),
                      "dd MMM yyyy",
                      { locale: es },
                    )
                  : "Nunca"}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Fecha de cierre del último ticket 'Mantenimiento'.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historial de Tickets</CardTitle>
            <CardDescription>
              Registro de trabajos realizados, soporte y mantenimientos.
            </CardDescription>
          </div>
          <AddTicketDialog clientId={client.id} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Fecha</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Costo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No hay tickets registrados.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd MMM", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ticket.title}
                      {ticket.is_billable && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-[10px] border-yellow-500 text-yellow-600"
                        >
                          Cobrar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(ticket.type)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          {getStatusBadge(ticket.status)}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(ticket.id, "open")
                            }
                          >
                            Abierto
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(ticket.id, "in_progress")
                            }
                          >
                            En Progreso
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(ticket.id, "closed")
                            }
                          >
                            Cerrado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(ticket.id, "cancelled")
                            }
                          >
                            Cancelado
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {ticket.is_billable ? (
                        formatCurrency(ticket.cost)
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Gratis
                        </span>
                      )}
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
