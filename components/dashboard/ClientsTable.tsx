"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { EditClientDialog } from "./EditClientDialog";
import { DeleteButton } from "./DeleteButton";
import { deleteClient } from "@/app/dashboard/clients/actions";

interface ClientsTableProps {
  clients: any[];
  userRole: string; // "super_admin" | "admin" | "user"
}

export function ClientsTable({ clients, userRole }: ClientsTableProps) {
  const router = useRouter();

  if (clients.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border rounded-md bg-muted/20">
        No hay clientes registrados en esta organización.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              // Prevent navigation if clicking on buttons
              onClick={(e) => {
                if (
                  (e.target as HTMLElement).closest("button") ||
                  (e.target as HTMLElement).closest("dialog")
                )
                  return;
                router.push(`/dashboard/clients/${client.id}`);
              }}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-base">{client.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.contact_email}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{client.contact_name || "-"}</span>
                  <span className="text-xs text-muted-foreground">
                    {client.contact_phone || "-"}
                  </span>
                </div>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {client.address || "-"}
              </TableCell>

              <TableCell>
                <Badge
                  variant={client.status === "active" ? "default" : "secondary"}
                >
                  {client.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* EDIT ACTION */}
                  <EditClientDialog
                    client={client}
                    isReadOnlyName={userRole !== "super_admin"}
                  />

                  {/* DELETE ACTION (Super Admin only) */}
                  {userRole === "super_admin" && (
                    <DeleteButton
                      id={client.id}
                      onDelete={async (id) => await deleteClient(id)}
                      title="¿Eliminar Cliente?"
                      description="Se eliminarán todos los servicios y datos asociados."
                      successMessage="Cliente eliminado."
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
