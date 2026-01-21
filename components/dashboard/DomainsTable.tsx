import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Domain {
  id: string;
  url: string;
  provider: string;
  expiration_date: string;
  status: string;
  clients: {
    name: string;
    unique_client_id?: string;
  } | null;
}

interface DomainsTableProps {
  domains: Domain[];
}

export function DomainsTable({ domains }: DomainsTableProps) {
  const getStatusBadge = (dateString: string, status: string) => {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Dominio / URL</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Alertas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell className="font-medium">
                {domain.clients?.name ? (
                  <div className="flex flex-col">
                    <span>{domain.clients.name}</span>
                    {/* <span className="text-xs text-muted-foreground">{domain.clients.unique_client_id}</span> */}
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Sin Asignar
                  </span>
                )}
              </TableCell>
              <TableCell>
                <a
                  href={`https://${domain.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-indigo-500 font-medium"
                >
                  {domain.url}
                </a>
              </TableCell>
              <TableCell>{domain.provider}</TableCell>
              <TableCell className="capitalize">
                {format(new Date(domain.expiration_date), "dd MMM yyyy", {
                  locale: es,
                })}
              </TableCell>
              <TableCell>
                {getStatusBadge(domain.expiration_date, domain.status)}
              </TableCell>
            </TableRow>
          ))}
          {domains.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
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
