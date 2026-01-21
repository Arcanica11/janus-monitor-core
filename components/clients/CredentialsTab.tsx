"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { AddCredentialDialog } from "./AddCredentialDialog";
import { deleteCredential } from "@/app/dashboard/clients/[id]/actions";
import {
  Database,
  Globe,
  Key,
  Lock,
  Mail,
  Server,
  Trash2,
  Eye,
  EyeOff,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

interface CredentialsTabProps {
  clientId: string;
  credentials: any[];
}

const getIconForType = (type: string) => {
  switch (type) {
    case "database":
      return <Database className="h-4 w-4" />;
    case "hosting":
      return <Server className="h-4 w-4" />;
    case "social_media":
      return <Globe className="h-4 w-4" />; // Or specific icon if available
    case "email":
      return <Mail className="h-4 w-4" />;
    case "cms":
      return <Key className="h-4 w-4" />;
    default:
      return <Lock className="h-4 w-4" />;
  }
};

export function CredentialsTab({ clientId, credentials }: CredentialsTabProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta credencial?")) return;
    const res = await deleteCredential(id, clientId);
    if (res?.error) toast.error(res.error);
    else toast.success("Credencial eliminada");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Bóveda de Credenciales</CardTitle>
          <CardDescription>
            Accesos seguros para servicios de este cliente.
          </CardDescription>
        </div>
        <AddCredentialDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Contraseña</TableHead>
              <TableHead>Notas / URL</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No hay credenciales guardadas.
                </TableCell>
              </TableRow>
            ) : (
              credentials.map((cred) => (
                <TableRow key={cred.id}>
                  <TableCell>{getIconForType(cred.type)}</TableCell>
                  <TableCell className="font-medium">
                    {cred.service_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {cred.username}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {revealedIds[cred.id] ? cred.password_hash : "••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleReveal(cred.id)}
                      >
                        {revealedIds[cred.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {cred.url && (
                      <a
                        href={cred.url}
                        target="_blank"
                        className="hover:underline text-indigo-500 mr-2"
                      >
                        {cred.url}
                      </a>
                    )}
                    {cred.notes}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(cred.id)}
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
