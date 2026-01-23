import { getOrganizationFullDetails } from "./actions";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgGeneralTab } from "./OrgGeneralTab";
import { OrgInfraTab } from "./OrgInfraTab";
import { OrgIncomeTab } from "./OrgIncomeTab";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Users, CloudCog, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getOrganizationFullDetails(id);

  if (!data || !data.organization) {
    return notFound();
  }

  const {
    organization,
    subscriptions,
    assets,
    corporateEmails,
    members,
    services,
    clients,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {organization.name}
            </h1>
            {organization.is_internal && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                Interno
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground mt-2 text-sm">
            <span className="flex items-center">
              <Building2 className="w-4 h-4 mr-1" /> {organization.slug}
            </span>
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center hover:text-primary"
              >
                <Globe className="w-4 h-4 mr-1" /> {organization.website}
              </a>
            )}
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" /> {members.length} Miembros
            </span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="infra" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="infra" className="gap-2">
            <CloudCog className="w-3 h-3" /> Gastos
          </TabsTrigger>
          <TabsTrigger value="income" className="gap-2">
            <DollarSign className="w-3 h-3" /> Ingresos
          </TabsTrigger>
          <TabsTrigger value="team">Equipo ({members.length})</TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general">
          <OrgGeneralTab organization={organization} />
        </TabsContent>

        {/* SERVICES & ACCESS TAB (Renamed from Infra) */}
        <TabsContent value="infra">
          <OrgInfraTab
            orgId={organization.id}
            subscriptions={subscriptions}
            assets={assets}
            corporateEmails={corporateEmails}
          />
        </TabsContent>

        {/* INCOME TAB */}
        <TabsContent value="income">
          <OrgIncomeTab
            orgId={organization.id}
            services={services}
            clients={clients}
          />
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Miembros del Equipo</CardTitle>
              <CardDescription>
                Usuarios con acceso a esta organización.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                La gestión de usuarios se centraliza en el panel de Equipo. Este
                panel es de solo lectura por ahora.
              </p>
              {/* Simple List */}
              <ul className="mt-4 space-y-2">
                {members.map((m: any) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <span>{m.full_name || "Sin Nombre"}</span>
                    <Badge variant="outline">{m.role}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
