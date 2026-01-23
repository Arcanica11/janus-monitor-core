import { getClientFullDetails } from "./actions";
import { ClientInfoTab } from "@/components/clients/ClientInfoTab";
import { CredentialsTab } from "@/components/clients/CredentialsTab";
import { FinancialOverviewTab } from "@/components/clients/FinancialOverviewTab";
import { TicketsTab } from "@/components/clients/TicketsTab";
import { ServicesTab } from "@/components/clients/ServicesTab";
import { DomainsTable } from "@/components/dashboard/DomainsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddDomainDialog } from "@/components/dashboard/AddDomainDialog";

export const dynamic = "force-dynamic";

interface ClientPageProps {
  params: Promise<{
    id: string;
  }>;
}

import { createClient } from "@/utils/supabase/server";

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params;
  const data = await getClientFullDetails(id);

  // Check Super Admin Role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isSuperAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isSuperAdmin = profile?.role === "super_admin";
  }

  if (!data) {
    return notFound();
  }

  const { client, credentials, services, domains, tickets } = data;

  // Enrich domains with client info for the table reuse
  const enrichedDomains = domains.map((d: any) => ({
    ...d,
    clients: { name: client.name },
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {client.name}
              </h1>
              <Badge variant="secondary" className="font-mono text-base">
                {client.unique_client_id}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {client.industry || "Sin Rubro"}
              </Badge>
              {client.organizations && (
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700 bg-blue-50"
                >
                  🏢 {client.organizations.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-muted-foreground mt-1 text-sm bg-muted/40 w-fit px-2 py-0.5 rounded-full">
              <Building2 className="mr-2 h-3 w-3" />
              {client.contact_email}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddDomainDialog clients={[client]} preselectedClientId={client.id} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="info">Perfil & Datos</TabsTrigger>
          <TabsTrigger value="credentials">
            Credenciales ({credentials.length})
          </TabsTrigger>
          <TabsTrigger value="services">
            Servicios ({services.length})
          </TabsTrigger>
          <TabsTrigger value="domains">Dominios ({domains.length})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverviewTab services={services} domains={domains} />
        </TabsContent>

        <TabsContent value="info">
          <ClientInfoTab client={client} isSuperAdmin={isSuperAdmin} />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsTab clientId={client.id} credentials={credentials} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab clientId={client.id} services={services} />
        </TabsContent>

        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Detalle Técnico de Dominios</CardTitle>
              <CardDescription>
                Información DNS, proveedores y estados técnicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainsTable domains={enrichedDomains} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsTab client={client} tickets={tickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
