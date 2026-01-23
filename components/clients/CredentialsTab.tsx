"use client";

import { useState } from "react";
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
import { AddCredentialDialog } from "./AddCredentialDialog";
import {
  deleteCredential,
  revealCredentialPassword,
} from "@/app/dashboard/clients/[id]/actions";
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
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CredentialsTabProps {
  clientId: string;
  credentials: any[];
}

const getIconForType = (type: string) => {
  switch (type?.toLowerCase()) {
    case "database":
      return <Database className="h-4 w-4" />;
    case "hosting":
      return <Server className="h-4 w-4" />;
    case "social_media":
    case "social":
    case "instagram":
    case "facebook":
    case "twitter":
    case "linkedin":
      return <Globe className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    case "cms":
      return <Key className="h-4 w-4" />;
    default:
      return <Lock className="h-4 w-4" />;
  }
};

function SecureRevealButton({ credential }: { credential: any }) {
  const [revealed, setRevealed] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setDecrypted(null);
      return;
    }

    setLoading(true);
    try {
      // Determine if it's a legacy social credential
      const type =
        credential.category === "social_legacy" ? "social_legacy" : "general";

      const res = await revealCredentialPassword(credential.id, type);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      setDecrypted(res.password || "");
      setRevealed(true);
      toast.success("Contraseña visible en logs de auditoría");
    } catch (error) {
      toast.error("Error al revelar");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (decrypted) {
      navigator.clipboard.writeText(decrypted);
      toast.success("Copiado al portapapeles");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <code className="bg-muted px-2 py-1 rounded text-xs font-mono min-w-[100px] text-center">
        {revealed ? decrypted : "••••••••"}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleReveal}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : revealed ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
      {revealed && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={copyToClipboard}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function CredentialsTab({ clientId, credentials }: CredentialsTabProps) {
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
          <CardTitle>Bóveda Unificada de Credenciales</CardTitle>
          <CardDescription>
            Gestión centralizada de accesos web y redes sociales.
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
              <TableHead>Tipo</TableHead>
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
                  colSpan={7}
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
                  <TableCell>
                    {cred.category === "social_legacy" ? (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700"
                      >
                        Legacy Social
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {cred.type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {cred.username}
                  </TableCell>
                  <TableCell>
                    <SecureRevealButton credential={cred} />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {cred.url && (
                      <a
                        href={cred.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-indigo-500 mr-2 flex items-center gap-1"
                      >
                        {cred.url}
                      </a>
                    )}
                    {cred.notes && (
                      <span className="block truncate">{cred.notes}</span>
                    )}
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
