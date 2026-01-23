"use client";

import { useState } from "react";
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
import { Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { DeleteButton } from "@/components/dashboard/DeleteButton";
import { deleteEmail } from "@/app/dashboard/emails/actions";

interface EmailsTableProps {
  emails: any[];
  userRole: string;
}

export function EmailsTable({ emails, userRole }: EmailsTableProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    const newSet = new Set(revealedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedIds(newSet);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
        No hay correos registrados.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead>Contraseña</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Redirección (Gmail)</TableHead>
            <TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => {
            const isRevealed = revealedIds.has(email.id);
            return (
              <TableRow key={email.id}>
                <TableCell className="font-medium">
                  {email.email_address}
                  {email.clients && (
                    <div className="text-xs text-muted-foreground">
                      Cliente: {email.clients.name}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {isRevealed ? email.password : "••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleReveal(email.id)}
                    >
                      {isRevealed ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                    {isRevealed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(email.password)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {email.provider ? (
                    <Badge variant="outline">{email.provider}</Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {email.linked_gmail || "-"}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {email.cost ? currencyFormatter.format(email.cost) : "-"}
                </TableCell>

                <TableCell className="text-right">
                  {userRole === "super_admin" && (
                    <DeleteButton
                      id={email.id}
                      onDelete={async (id) => await deleteEmail(id)}
                      title="¿Eliminar Correo?"
                      description="Esta acción es irreversible."
                      successMessage="Correo eliminado"
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
