import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Globe, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function OrganizationsIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get User Profile for Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  const userOrgId = profile?.organization_id;

  // LOGIC: Redirection for non-super-admin
  if (role !== "super_admin") {
    if (userOrgId) {
      redirect(`/dashboard/organization/${userOrgId}`);
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <Building2 className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Sin Organización Asignada</h1>
          <p className="text-muted-foreground max-w-md">
            Tu cuenta no está vinculada a ninguna organización. Contacta a
            soporte para solicitar acceso.
          </p>
        </div>
      );
    }
  }

  // LOGIC: Super Admin View - Fetch ALL Orgs
  const { data: organizations } = await supabase
    .from("organizations")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Mando</h1>
          <p className="text-muted-foreground">
            Gestión centralizada de todas las organizaciones del ecosistema.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <ShieldAlert className="w-3 h-3 mr-2 text-primary" />
          Vista de Super Admin
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Avatar className="h-12 w-12 rounded-lg border">
                <AvatarImage src={org.logo_url || ""} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {org.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-lg">{org.name}</CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  {org.slug}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex gap-2 mt-2">
                {org.is_internal && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    Interno
                  </Badge>
                )}
                {org.website && (
                  <Badge variant="outline" className="text-xs font-normal">
                    <Globe className="w-3 h-3 mr-1" /> Web
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Link
                href={`/dashboard/organization/${org.id}`}
                className="w-full"
              >
                <Button className="w-full" variant="outline">
                  Gestionar
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
        {(!organizations || organizations.length === 0) && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No se encontraron organizaciones.
          </div>
        )}
      </div>
    </div>
  );
}
