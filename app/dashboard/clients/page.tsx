import { getClients } from "./actions";
import { ClientGrid } from "@/components/clients/ClientGrid";
import { AddClientSheet } from "@/components/clients/AddClientSheet";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra las empresas y agencias que tienen servicios contratados.
          </p>
        </div>
        <AddClientSheet />
      </div>
      <Separator />

      <ClientGrid clients={clients || []} />
    </div>
  );
}
