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
import { EditUserDialog } from "./EditUserDialog";
import { TeamUser } from "@/app/dashboard/team/actions";

interface UserTableProps {
  users: TeamUser[];
  organizations: { id: string; name: string }[];
}

export function UserTable({ users, organizations }: UserTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Organización</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name || "Sin Nombre"}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.role === "super_admin" ? (
                  <Badge variant="destructive">Super Admin</Badge>
                ) : (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </TableCell>
              <TableCell>
                {user.organization_name ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {user.organization_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Sin Asignar
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <EditUserDialog
                  userId={user.id}
                  currentRole={user.role}
                  currentOrgId={user.organization_id}
                  organizations={organizations}
                />
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center h-24 text-muted-foreground"
              >
                No se encontraron usuarios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
