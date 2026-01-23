import { notFound } from "next/navigation";
import {
  getClient,
  getClientDomains,
  getClientEmails,
  getClientCredentials,
  getClientTickets,
} from "./actions";
import { ClientInfoCard } from "@/components/dashboard/ClientInfoCard";
import { ClientDomainsTab } from "@/components/dashboard/ClientDomainsTab";
import { ClientEmailsTab } from "@/components/dashboard/ClientEmailsTab";
import { ClientCredentialsTab } from "@/components/dashboard/ClientCredentialsTab";
import { ClientTicketsTab } from "@/components/dashboard/ClientTicketsTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel Fetching
  const [clientRes, domains, emails, credentials, tickets] = await Promise.all([
    getClient(id),
    getClientDomains(id),
    getClientEmails(id),
    getClientCredentials(id),
    getClientTickets(id),
  ]);

  if (clientRes.error || !clientRes.client) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-bold text-destructive">Error</h2>
        <p className="text-muted-foreground">
          {clientRes.error || "Cliente no encontrado"}
        </p>
        <Link href="/dashboard/clients">
          <Button variant="outline">Volver al Directorio</Button>
        </Link>
      </div>
    );
  }

  const { client } = clientRes;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon" title="Volver">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <Badge
            variant={client.status === "active" ? "default" : "secondary"}
            className="text-sm"
          >
            {client.status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      {/* LAYOUT GRID */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COL: INFO (1/3) */}
        <div className="md:col-span-1">
          <ClientInfoCard client={client} />
        </div>

        {/* RIGHT COL: TABS (2/3) */}
        <div className="md:col-span-2">
          <Tabs defaultValue="infra" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="infra">Dominios</TabsTrigger>
              <TabsTrigger value="emails">Correos</TabsTrigger>
              <TabsTrigger value="credentials">Credenciales</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="infra">
              <ClientDomainsTab
                clientId={client.id}
                orgId={client.organization_id}
                domains={domains}
                userRole={client.currentUserRole}
              />
            </TabsContent>

            <TabsContent value="emails">
              <ClientEmailsTab
                clientId={client.id}
                orgId={client.organization_id}
                emails={emails}
                userRole={client.currentUserRole}
              />
            </TabsContent>

            <TabsContent value="credentials">
              <ClientCredentialsTab
                clientId={client.id}
                credentials={credentials}
                userRole={client.currentUserRole}
              />
            </TabsContent>

            <TabsContent value="tickets">
              <ClientTicketsTab
                clientId={client.id}
                tickets={tickets}
                userRole={client.currentUserRole}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
