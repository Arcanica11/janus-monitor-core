"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Building2, Mail, Globe } from "lucide-react";

interface Client {
  id: string;
  name: string;
  unique_client_id: string;
  contact_email: string | null;
  domain_count?: number;
  organizations?: {
    name: string;
  };
}

interface ClientGridProps {
  clients: Client[];
}

export function ClientGrid({ clients }: ClientGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.unique_client_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes por nombre o ID..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed text-muted-foreground bg-muted/20">
          <Building2 className="h-12 w-12 mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No se encontraron clientes</h3>
          <p className="text-sm">
            Intenta con otros términos de búsqueda o agrega uno nuevo.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="hover:shadow-md transition-shadow flex flex-col justify-between group cursor-pointer relative"
            >
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="absolute inset-0 z-10 w-full h-full"
              >
                <span className="sr-only">Ver detalles de {client.name}</span>
              </Link>
              <div>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold truncate pr-2 leading-tight group-hover:text-primary transition-colors">
                        {client.name}
                      </CardTitle>
                      {client.organizations && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                        >
                          {client.organizations.name}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] uppercase tracking-wider"
                    >
                      {client.unique_client_id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground/80">
                        Contacto
                      </span>
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        <span
                          className="truncate max-w-[150px]"
                          title={client.contact_email || ""}
                        >
                          {client.contact_email || "Sin email"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-0">
                <div className="w-full pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {client.domain_count || 0} Dominios Activos
                    </span>
                  </div>
                  <span className="text-indigo-500 font-medium group-hover:underline z-20 pointer-events-none relative">
                    Ver detalles
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
