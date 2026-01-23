"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { EditClientDialog } from "./EditClientDialog";

interface ClientInfoCardProps {
  client: any;
}

export function ClientInfoCard({ client }: ClientInfoCardProps) {
  const isReadOnlyName = client.currentUserRole !== "super_admin";

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Información de la Empresa
        </CardTitle>
        <EditClientDialog client={client} isReadOnlyName={isReadOnlyName} />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Main Info */}
        <div className="space-y-1">
          <div className="text-xl font-semibold">{client.name}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-3 h-3" />
            ID:{" "}
            <span className="font-mono text-xs">
              {client.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        <div className="grid gap-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Contacto Principal
              </span>
              <span className="text-sm font-medium">
                {client.contact_name || "No registrado"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Correo</span>
              <span className="text-sm font-medium break-all">
                {client.contact_email || "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Phone className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Teléfono</span>
              <span className="text-sm font-medium">
                {client.contact_phone || "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Dirección</span>
              <span className="text-sm font-medium">
                {client.address || "-"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t mt-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Estado</span>
              <Badge
                variant={client.status === "active" ? "default" : "secondary"}
              >
                {client.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Creado por</span>
              <span>{client.creator_email}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>Fecha Creación</span>
              <span>{new Date(client.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
