"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmailsTable } from "@/components/dashboard/emails/EmailsTable";
import { AddClientEmailDialog } from "@/components/dashboard/AddClientEmailDialog";

interface ClientEmailsTabProps {
  clientId: string;
  orgId: string;
  emails: any[];
  userRole: string;
}

export function ClientEmailsTab({
  clientId,
  orgId,
  emails,
  userRole,
}: ClientEmailsTabProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Correos Corporativos</CardTitle>
          <CardDescription>
            Gestión de cuentas de correo de este cliente.
          </CardDescription>
        </div>
        <AddClientEmailDialog clientId={clientId} />
      </CardHeader>
      <CardContent>
        <EmailsTable emails={emails} userRole={userRole} />
      </CardContent>
    </Card>
  );
}
