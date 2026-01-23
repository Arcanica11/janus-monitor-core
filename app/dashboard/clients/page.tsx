import { getClients, getOrganizations } from "./actions";
import { ClientsTable } from "@/components/dashboard/ClientsTable";
import { CreateClientDialog } from "@/components/dashboard/CreateClientDialog";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  // 1. Obtener Usuario
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSuperAdmin = false;
  let userRole = "user";
  let organizations: any[] = [];

  if (user) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        userRole = profile.role;
        isSuperAdmin = profile.role === "super_admin";
      }
    } catch (err) {
      console.error("Error verifying role:", err);
    }
  }

  // 2. Fetch Data
  if (isSuperAdmin) {
    organizations = await getOrganizations();
  }

  const clients = await getClients();

  // 3. Render
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las empresas y agencias.
          </p>
        </div>
        <CreateClientDialog
          isSuperAdmin={isSuperAdmin}
          organizations={organizations || []}
        />
      </div>
      <Separator />

      {/* VIEW LOGIC */}
      {isSuperAdmin ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0 mb-4">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
            >
              Todo
            </TabsTrigger>
            {organizations.map((org) => (
              <TabsTrigger
                key={org.id}
                value={org.id}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
              >
                <Building2 className="w-3 h-3" />
                {org.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <ClientsTable clients={clients || []} userRole={userRole} />
          </TabsContent>

          {organizations.map((org) => {
            const orgClients =
              clients?.filter((c) => c.organization_id === org.id) || [];
            return (
              <TabsContent key={org.id} value={org.id}>
                <ClientsTable clients={orgClients} userRole={userRole} />
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        // Regular Admin View (Single List)
        <ClientsTable clients={clients || []} userRole={userRole} />
      )}
    </div>
  );
}
