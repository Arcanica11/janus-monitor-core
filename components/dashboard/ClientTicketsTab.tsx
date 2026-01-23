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
import { AddClientTicketDialog } from "./AddClientTicketDialog";

interface ClientTicketsTabProps {
  clientId: string;
  tickets: any[];
  userRole: string;
}

export function ClientTicketsTab({
  clientId,
  tickets,
  userRole,
}: ClientTicketsTabProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tickets de Soporte</CardTitle>
          <CardDescription>
            Historial de solicitudes y problemas reportados.
          </CardDescription>
        </div>
        <AddClientTicketDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            No hay tickets registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asunto</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    {ticket.subject}
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {ticket.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.priority === "critical" ||
                        ticket.priority === "high"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
