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
import { Trash2, ExternalLink } from "lucide-react";
import { AddClientCredentialDialog } from "./AddClientCredentialDialog";
import { deleteCredential } from "@/app/dashboard/clients/[id]/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientCredentialsTabProps {
  clientId: string;
  credentials: any[];
  userRole: string;
}

export function ClientCredentialsTab({
  clientId,
  credentials,
  userRole,
}: ClientCredentialsTabProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que deseas eliminar esta credencial?")) return;
    const res = await deleteCredential(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Credencial eliminada");
      router.refresh();
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Credenciales y Accesos</CardTitle>
          <CardDescription>
            Bóveda de contraseñas y accesos para este cliente.
          </CardDescription>
        </div>
        <AddClientCredentialDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        {credentials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            No hay credenciales guardadas.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>URL / Usuario</TableHead>
                <TableHead>Contraseña</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((cred) => (
                <TableRow key={cred.id}>
                  <TableCell className="font-medium">
                    {cred.service_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {cred.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      {cred.url && (
                        <a
                          href={cred.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:underline"
                        >
                          Link <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      <span className="text-muted-foreground">
                        {cred.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {cred.password}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cred.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
