import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getEmails } from "./actions";
import { EmailsTable } from "@/components/dashboard/emails/EmailsTable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";
import { decrypt } from "@/utils/encryption";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div>No autenticado</div>;

  // Check Super Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin";

  if (!isSuperAdmin) {
    return <div>Acceso denegado. Vista exclusiva para Super Admin.</div>;
  }

  const admin = createAdminClient();

  // 1. Get All Orgs
  const { data: organizations } = await admin
    .from("organizations")
    .select("id, name")
    .order("name");

  // 2. Get All Emails (Super Admin Mode)
  // We fetch directly to group them
  const { data: allEmails } = await admin
    .from("corporate_emails")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  // Decrypt for display
  const safeEmails =
    allEmails?.map((e) => ({
      ...e,
      password: decrypt(e.encrypted_password),
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión Global de Correos
          </h1>
          <p className="text-muted-foreground mt-1">
            Administración centralizada de cuentas de correo.
          </p>
        </div>
      </div>
      <Separator />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0 mb-4">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Todos
          </TabsTrigger>
          {organizations?.map((org) => (
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
          <EmailsTable emails={safeEmails} userRole="super_admin" />
        </TabsContent>

        {organizations?.map((org) => {
          const orgEmails = safeEmails.filter(
            (e) => e.organization_id === org.id,
          );
          return (
            <TabsContent key={org.id} value={org.id}>
              <EmailsTable emails={orgEmails} userRole="super_admin" />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
