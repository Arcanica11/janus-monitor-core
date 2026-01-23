import { getAllDomains } from "./actions";
import { DomainsTable } from "@/components/dashboard/DomainsTable";
import { AddDomainDialog } from "@/components/dashboard/AddDomainDialog";
import { getClientsForSelect } from "@/app/dashboard/actions";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  console.log(">>> [DEBUG DOMAINS] DomainsPage: Loading...");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  console.log(`>>> [DEBUG DOMAINS] DomainsPage: User Role: ${profile?.role}`);

  const [domains, clients] = await Promise.all([
    getAllDomains(),
    getClientsForSelect(),
  ]);

  console.log(
    `>>> [DEBUG DOMAINS] DomainsPage: Loaded ${domains?.length || 0} domains`,
  );
  console.log(
    `>>> [DEBUG DOMAINS] DomainsPage: Loaded ${clients?.length || 0} clients for dialog`,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dominios Master
          </h1>
          <p className="text-muted-foreground">
            Gestión centralizada de todos los dominios (propios y de clientes).
          </p>
        </div>
        <AddDomainDialog clients={clients} />
      </div>

      <DomainsTable domains={domains as any} />
    </div>
  );
}
