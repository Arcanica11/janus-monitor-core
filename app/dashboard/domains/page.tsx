import { getAllDomains } from "./actions";
import { DomainsList } from "@/components/dashboard/DomainsList";
import { AddDomainDialog } from "@/components/dashboard/AddDomainDialog";
import { getClientsForSelect } from "@/app/dashboard/actions";
// Reusing getClientsForSelect from main dashboard actions since it does exactly what we need

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const [domains, clients] = await Promise.all([
    getAllDomains(),
    getClientsForSelect(),
  ]);

  // Transform backend data to match Domain interface if strictly needed,
  // but Supabase returns should match compatible shapes mostly.
  // We need to ensure the shape matches DomainsList expectations.

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dominios
          </h1>
          <p className="text-muted-foreground">
            Gestión global de dominios y vencimientos.
          </p>
        </div>
        <AddDomainDialog clients={clients} />
      </div>

      <DomainsList initialDomains={domains as any} />
    </div>
  );
}
