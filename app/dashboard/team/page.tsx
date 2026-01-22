import { getUsers, getOrganizations } from "./actions";
import { UserTable } from "@/components/team/UserTable";
import { AddUserDialog } from "@/components/team/AddUserDialog";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = await createClient();

  // STRICT RBAC CHECK
  // We check the DB profile role directly
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acceso Restringido</h1>
        <p className="text-muted-foreground w-[400px]">
          Este módulo es exclusivo para Super Administradores de Arknica. Si
          crees que esto es un error, contacta al CEO.
        </p>
      </div>
    );
  }

  // If passed, fetch data
  const [teamMembers, organizations] = await Promise.all([
    getUsers(),
    getOrganizations(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Equipo
          </h1>
          <p className="text-muted-foreground mt-1">
            Control de acceso y roles para administradores de la plataforma.
          </p>
        </div>
        <AddUserDialog organizations={organizations || []} />
      </div>

      <UserTable users={teamMembers} organizations={organizations || []} />
    </div>
  );
}
