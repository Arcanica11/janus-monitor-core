import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, AlertCircle, DollarSign } from "lucide-react";

interface StatsProps {
  stats: {
    totalClients: number;
    activeProjects: number;
    openTickets: number;
    revenue: number;
  };
}

export function StatsCards({ stats }: StatsProps) {
  // Safe formatting that always returns valid string, even for 0
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Cartera Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cartera Total</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients ?? 0}</div>
          <p className="text-xs text-muted-foreground">Clientes registrados</p>
        </CardContent>
      </Card>

      {/* 2. Proyectos Activos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Proyectos Activos
          </CardTitle>
          <FolderKanban className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeProjects ?? 0}</div>
          <p className="text-xs text-muted-foreground">Migraciones en curso</p>
        </CardContent>
      </Card>

      {/* 3. Tickets Pendientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tickets Pendientes
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openTickets ?? 0}</div>
          <p className="text-xs text-muted-foreground">Requieren atención</p>
        </CardContent>
      </Card>

      {/* 4. ARR Estimado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ARR Estimado</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatMoney(stats.revenue)}</div>
          <p className="text-xs text-muted-foreground">
            Ingresos recurrentes anuales
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
