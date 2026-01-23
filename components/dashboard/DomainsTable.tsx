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
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteDomainMaster } from "@/app/dashboard/domains/actions";
import { toast } from "sonner";

interface Domain {
  id: string;
  domain: string;
  registrar?: string;
  hosting_provider?: string;
  account_owner?: string;
  renewal_price?: number;
  expiration_date: string;
  status: string;
  client_id?: string | null;
  clients?: {
    name: string;
    unique_client_id?: string;
  } | null;
  organizations?: {
    name: string;
  } | null;
}

interface DomainsTableProps {
  domains: Domain[];
}

export function DomainsTable({ domains }: DomainsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getExpirationBadge = (dateString: string, status: string) => {
    const expiryDate = new Date(dateString);
    const now = new Date();
    const daysLeft = differenceInDays(expiryDate, now);

    if (status !== "active") {
      return <Badge variant="outline">Inactivo</Badge>;
    }

    if (daysLeft < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vencido ({Math.abs(daysLeft)}d)
        </Badge>
      );
    }

    if (daysLeft <= 7) {
      return (
        <Badge
          variant="destructive"
          className="gap-1 bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="h-3 w-3" />
          Crítico ({daysLeft}d)
        </Badge>
      );
    }

    if (daysLeft <= 30) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black gap-1">
          <Clock className="h-3 w-3" />
          Por Vencer ({daysLeft}d)
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-600 hover:bg-green-700 gap-1">
        <CheckCircle className="h-3 w-3" />
        Saludable
      </Badge>
    );
  };

  const handleDelete = async (id: string, domainName: string) => {
    if (!confirm(`¿Eliminar el dominio "${domainName}"?`)) return;

    setDeletingId(id);
    const res = await deleteDomainMaster(id);
    setDeletingId(null);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Dominio eliminado");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Dominio</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Propiedad</TableHead>
            <TableHead>Renovación</TableHead>
            <TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              {/* Dominio */}
              <TableCell className="font-medium">
                <a
                  href={`https://${domain.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-indigo-600 dark:text-indigo-400 font-semibold text-base"
                >
                  {domain.domain}
                </a>
                {domain.registrar && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Registrador: {domain.registrar}
                  </p>
                )}
              </TableCell>

              {/* Ubicación (Provider + Account) */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {domain.hosting_provider && (
                    <Badge variant="secondary" className="w-fit">
                      {domain.hosting_provider}
                    </Badge>
                  )}
                  {domain.account_owner && (
                    <Badge variant="outline" className="w-fit text-xs">
                      {domain.account_owner}
                    </Badge>
                  )}
                  {!domain.hosting_provider && !domain.account_owner && (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </TableCell>

              {/* Propiedad (Ownership) */}
              <TableCell>
                {domain.client_id && domain.clients?.name ? (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Cliente:
                    </span>
                    <span className="font-medium">{domain.clients.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Interno:
                    </span>
                    <span className="font-medium">
                      {domain.organizations?.name || "Organización"}
                    </span>
                  </div>
                )}
              </TableCell>

              {/* Renovación */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {format(new Date(domain.expiration_date), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </span>
                  {getExpirationBadge(domain.expiration_date, domain.status)}
                </div>
              </TableCell>

              {/* Costo */}
              <TableCell className="text-right font-semibold">
                {domain.renewal_price
                  ? `$${domain.renewal_price.toFixed(2)}`
                  : "-"}
              </TableCell>

              {/* Acciones */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Eliminar"
                    disabled={deletingId === domain.id}
                    onClick={() => handleDelete(domain.id, domain.domain)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {domains.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center h-24 text-muted-foreground"
              >
                No hay dominios registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
