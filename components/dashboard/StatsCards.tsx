import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Clock, AlertCircle } from "lucide-react";

interface StatsProps {
  stats: {
    totalDomains: number;
    expiringDomains: number;
    openTickets: number;
  };
}

export function StatsCards({ stats }: StatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dominios</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDomains}</div>
          <p className="text-xs text-muted-foreground">Activos en plataforma</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.expiringDomains}
          </div>
          <p className="text-xs text-muted-foreground">
            En los próximos 30 días
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tickets Abiertos
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openTickets}</div>
          <p className="text-xs text-muted-foreground">Soporte pendiente</p>
        </CardContent>
      </Card>
    </div>
  );
}
