import { getClients, getOrganizations } from "./actions";
import { ClientTable } from "@/components/clients/ClientTable";
import { AddClientSheet } from "@/components/clients/AddClientSheet";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin"; // <--- IMPORTANTE

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  console.log(">>> [PAGE] ClientsPage: Iniciando carga blindada...");

  // 1. Obtener Usuario (Autenticación Estándar)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSuperAdmin = false;
  let organizations: any[] = [];

  if (user) {
    try {
      // 2. OBTENER PERFIL USANDO ADMIN CLIENT (BYPASS DE SEGURIDAD)
      // Usamos createAdminClient para asegurar que leemos el rol sí o sí.
      const admin = createAdminClient();
      const { data: profile, error } = await admin
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(">>> [PAGE] Error leyendo perfil con Admin:", error);
      } else {
        console.log(">>> [PAGE] Perfil leído (Admin Mode):", profile);
        isSuperAdmin = profile?.role === "super_admin";
      }
    } catch (err) {
      console.error(">>> [PAGE] Error crítico verificando rol:", err);
    }
  }

  // 3. Cargar Organizaciones si es Admin
  if (isSuperAdmin) {
    console.log(
      ">>> [PAGE] Usuario es Super Admin. Cargando organizaciones...",
    );
    organizations = await getOrganizations();
    console.log(`>>> [PAGE] Organizaciones cargadas: ${organizations.length}`);
  } else {
    console.log(
      ">>> [PAGE] Usuario NO detectado como Super Admin. Selector oculto.",
    );
  }

  // 4. Cargar Clientes
  const clients = await getClients();

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

        {/* Pasamos los datos al componente */}
        <AddClientSheet
          isSuperAdmin={isSuperAdmin}
          organizations={organizations || []}
        />
      </div>
      <Separator />
      <ClientTable clients={clients || []} />
    </div>
  );
}
