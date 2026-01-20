import { getDashboardStats, getDomains, getClients } from "./actions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DomainsTable } from "@/components/dashboard/DomainsTable";
import { AddDomainDialog } from "@/components/dashboard/AddDomainDialog";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, domains, clients] = await Promise.all([
    getDashboardStats(),
    getDomains(),
    getClients(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <AddDomainDialog clients={clients || []} />
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Dominios Gestionados
          </h2>
        </div>
        <DomainsTable domains={domains || []} />
      </div>
    </div>
  );
}
