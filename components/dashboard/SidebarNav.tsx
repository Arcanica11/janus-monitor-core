"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Globe,
  Users,
  FolderKanban,
  LayoutDashboard,
  Shield,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Organization {
  name: string;
  slug: string;
  logo_url: string | null;
}

interface SidebarNavProps {
  role: string | undefined;
  organization: Organization | null;
  user: {
    email: string | undefined;
    initials: string | undefined;
    fullName: string | null;
  };
  signOutAction: () => Promise<void>;
}

export function SidebarNav({
  role,
  organization,
  user,
  signOutAction,
}: SidebarNavProps) {
  const pathname = usePathname();
  const orgName = organization?.name || "Sin Organización";
  const orgLogo = organization?.logo_url;

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Resumen",
      icon: Home,
    },
    {
      href: "/dashboard/domains",
      label: "Dominios",
      icon: Globe,
    },
    {
      href: "/dashboard/clients",
      label: "Clientes",
      icon: Users,
    },
    {
      href: "/dashboard/projects",
      label: "Proyectos",
      icon: FolderKanban,
    },
  ];

  if (role === "super_admin") {
    navItems.push({
      href: "/dashboard/team",
      label: "Equipo",
      icon: Shield,
    });
  }

  return (
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
      <nav className="flex flex-col gap-2 px-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:text-primary",
              isActive(item.href)
                ? "bg-muted text-primary font-medium"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {user.fullName || "Usuario"}
            </span>
            <span className="text-xs text-muted-foreground truncate w-32">
              {user.email}
            </span>
          </div>
        </div>
        <form action={signOutAction}>
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
  );
}
