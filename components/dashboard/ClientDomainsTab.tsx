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
import { DeleteButton } from "./DeleteButton";
import { AddClientDomainDialog } from "./AddClientDomainDialog";
import { deleteItem } from "@/app/dashboard/organization/[id]/actions";

interface ClientDomainsTabProps {
  clientId: string;
  orgId: string;
  domains: any[];
  userRole: string;
}

export function ClientDomainsTab({
  clientId,
  orgId,
  domains,
  userRole,
}: ClientDomainsTabProps) {
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dominios y Activos</CardTitle>
          <CardDescription>
            Infraestructura digital asociada a este cliente.
          </CardDescription>
        </div>
        <AddClientDomainDialog clientId={clientId} orgId={orgId} />
      </CardHeader>
      <CardContent>
        {domains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            No hay dominios registrados para este cliente.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dominio</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Renovación</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => {
                const daysUntilExp = domain.expiration_date
                  ? Math.ceil(
                      (new Date(domain.expiration_date).getTime() -
                        Date.now()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : 999;
                const isExpiring = daysUntilExp < 30;

                return (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{domain.domain_name}</span>
                        {domain.registrar && (
                          <span className="text-xs text-muted-foreground">
                            {domain.registrar}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {domain.hosting_provider ? (
                        <Badge variant="outline">
                          {domain.hosting_provider}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {domain.expiration_date
                          ? new Date(
                              domain.expiration_date,
                            ).toLocaleDateString()
                          : "N/A"}
                        {isExpiring && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1 h-5"
                          >
                            Urgente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {domain.renewal_price
                        ? currencyFormatter.format(domain.renewal_price)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {userRole === "super_admin" && (
                        <DeleteButton
                          id={domain.id}
                          onDelete={(id) =>
                            deleteItem("domains_master", id, orgId)
                          }
                          title="¿Eliminar Dominio?"
                          successMessage="Dominio eliminado"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
