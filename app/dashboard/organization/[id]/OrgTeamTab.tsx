import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OrgTeamTab({ members }: { members: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Miembros del Equipo</CardTitle>
        <CardDescription>
          Usuarios con acceso a esta organización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          La gestión de usuarios se centraliza en el panel de Equipo. Este panel
          es de solo lectura por ahora.
        </p>
        {/* Simple List */}
        <ul className="mt-4 space-y-2">
          {members.length > 0 ? (
            members.map((m: any) => (
              <li
                key={m.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <span>{m.full_name || "Sin Nombre"}</span>
                <Badge variant="outline">{m.role || "Miembro"}</Badge>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground text-sm italic p-2">
              No se encontraron miembros en esta organización.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
