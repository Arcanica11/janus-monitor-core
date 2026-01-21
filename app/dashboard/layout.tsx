import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

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
      {/* Sidebar */}
      <SidebarNav
        role={profile?.role}
        organization={profile?.organizations as any}
        user={{
          email: user.email,
          initials: userInitials,
          fullName: profile?.full_name,
        }}
        signOutAction={signOut}
      />

      {/* Main Content */}
      <main className="flex flex-1 flex-col sm:ml-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
