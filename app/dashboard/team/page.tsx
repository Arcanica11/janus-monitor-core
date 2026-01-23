import { getAdminData, deleteOrganization, deleteUser } from "./actions";
import { redirect } from "next/navigation";
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
import { ShieldAlert, Lock, UserCheck, Shield } from "lucide-react";
import { DeleteButton } from "./DeleteButton";
import { EditUserDialog } from "./EditUserDialog";
import { AddUserDialog } from "@/components/team/AddUserDialog";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const data = await getAdminData();

  if (!data) {
    redirect("/dashboard");
  }

  const { organizations, users } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Equipo y Organizaciones
          </h1>
          <p className="text-muted-foreground">
            Control de usuarios y clientes del sistema.
          </p>
        </div>
        <Badge variant="destructive" className="px-4 py-1 text-sm">
          <ShieldAlert className="w-4 h-4 mr-2" />
          ZONA SUPER ADMIN
        </Badge>
      </div>

      {/* ORGANIZATIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Organizaciones ({organizations.length})</CardTitle>
          <CardDescription>
            Borrar una organización elimina TODOS sus clientes, dominios y datos
            asociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org: any) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.slug}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {org.id}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteButton
                      id={org.id}
                      type="organization"
                      onDelete={deleteOrganization}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* USERS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios Registrados ({users.length})</CardTitle>
            <CardDescription>
              Gestión completa de usuarios. Bloquea el acceso o elimina
              permanentemente.
            </CardDescription>
          </div>
          <AddUserDialog organizations={organizations} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow
                  key={user.id}
                  className={user.is_blocked ? "bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.is_blocked && (
                        <Lock className="w-3 h-3 text-red-500" />
                      )}
                      {user.full_name || "Sin nombre"}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "super_admin" ? "default" : "secondary"
                      }
                    >
                      {user.role === "super_admin" && (
                        <Shield className="w-3 h-3 mr-1" />
                      )}
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_blocked ? (
                      <Badge variant="destructive" className="text-xs">
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50 text-xs"
                      >
                        <UserCheck className="w-3 h-3 mr-1" /> Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <EditUserDialog user={user} />
                      <DeleteButton
                        id={user.id}
                        type="user"
                        onDelete={deleteUser}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
