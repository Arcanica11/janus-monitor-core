import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Home,
  Globe,
  Users,
  Settings,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch Profile & Organization Data
  // We join profiles with organizations.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      organizations (
        name,
        slug,
        logo_url
      )
    `,
    )
    .eq("id", user.id)
    .single();

  const orgName = profile?.organizations?.name || "Sin Organización";
  const orgLogo = profile?.organizations?.logo_url;
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user.email?.substring(0, 2).toUpperCase();

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/40 font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            {orgLogo ? (
              <img src={orgLogo} alt={orgName} className="h-6 w-6" />
            ) : (
              <LayoutDashboard className="h-6 w-6" />
            )}
            <span>{orgName}</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-4 px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
          >
            <Home className="h-4 w-4" />
            Resumen
          </Link>
          <Link
            href="/dashboard/domains"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Globe className="h-4 w-4" />
            Dominios
          </Link>
          <Link
            href="/dashboard/clients"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Users className="h-4 w-4" />
            Clientes
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <PlusCircle className="h-4 w-4" />
            Migraciones
          </Link>
        </nav>
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {profile?.full_name || "Usuario"}
              </span>
              <span className="text-xs text-muted-foreground truncate w-32">
                {user.email}
              </span>
            </div>
          </div>
          <form action={signOut}>
            <Button
              variant="outline"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col sm:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
