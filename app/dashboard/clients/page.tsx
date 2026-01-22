import { getClients, getOrganizations } from "./actions";
import { ClientGrid } from "@/components/clients/ClientGrid";
import { AddClientSheet } from "@/components/clients/AddClientSheet";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .single();
  const isSuperAdmin = profile?.role === "super_admin";

  const clients = await getClients();
  const organizations = isSuperAdmin ? await getOrganizations() : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las empresas y agencias que tienen servicios contratados.
          </p>
        </div>
        <AddClientSheet
          isSuperAdmin={isSuperAdmin}
          organizations={organizations}
          currentOrgId={profile?.organization_id}
        />
      </div>
      <Separator />

      <ClientGrid clients={clients || []} />
    </div>
  );
}
