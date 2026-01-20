import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns"; // Assuming standard JS date handling or simple format
import { es } from "date-fns/locale"; // Optional if we want full ES localization logic, but standard JS is fine too if minimal.

// We will use standard Intl for date formatting to avoid extra heavy deps if not strictly needed,
// but user asked for "DD/MM/YYYY".

interface Domain {
  id: string;
  url: string;
  provider: string;
  expiration_date: string;
  status: string;
  clients: {
    name: string;
  } | null; // Should technically not be null based on schema but handling safe access
}

interface DomainsTableProps {
  domains: Domain[];
}

export function DomainsTable({ domains }: DomainsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (dateString: string, status: string) => {
    const expiryDate = new Date(dateString);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status !== "active") {
      return <Badge variant="destructive">Inactivo</Badge>;
    }

    if (diffDays < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (diffDays <= 30) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">
          Por Vencer ({diffDays}d)
        </Badge>
      );
    } else {
      return <Badge className="bg-green-600 hover:bg-green-700">Activo</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
            <TableRow key={domain.id}>
              <TableCell className="font-medium">
                {domain.clients?.name || "---"}
              </TableCell>
              <TableCell>
                <a
                  href={`https://${domain.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-blue-500"
                >
                  {domain.url}
                </a>
              </TableCell>
              <TableCell>{domain.provider}</TableCell>
              <TableCell>{formatDate(domain.expiration_date)}</TableCell>
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
