"use client";

import { useState } from "react";
import { addCredential, deleteCredential } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Copy, Lock, Loader2 } from "lucide-react";

interface OrgVaultTabProps {
  orgId: string;
  vaultItems: any[];
}

export function OrgVaultTab({ orgId, vaultItems }: OrgVaultTabProps) {
  // Filter items by category
  const services = vaultItems.filter(
    (i) =>
      i.category === "service" ||
      i.category === "database" ||
      i.category === "other" ||
      i.category === "general",
  );
  const emails = vaultItems.filter((i) => i.category === "email_account");

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md text-sm flex items-start gap-2">
        <Lock className="w-4 h-4 mt-0.5" />
        <div>
          <strong>Bóveda de Credenciales Segura</strong>
          <p>
            Las credenciales almacenadas aquí son compartidas con los
            administradores de la organización. Asegúrate de rotar las claves
            periódicamente.
          </p>
        </div>
      </div>

      {/* SECTION 1: SERVICES */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Servicios Externos</CardTitle>
            <CardDescription>
              Accesos a SaaS, Clouds y herramientas.
            </CardDescription>
          </div>
          <AddCredentialDialog orgId={orgId} defaultCategory="service" />
        </CardHeader>
        <CardContent>
          <VaultTable items={services} orgId={orgId} type="service" />
        </CardContent>
      </Card>

      {/* SECTION 2: EMAILS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Correos Corporativos</CardTitle>
            <CardDescription>Cuentas de correo y sus accesos.</CardDescription>
          </div>
          <AddCredentialDialog orgId={orgId} defaultCategory="email_account" />
        </CardHeader>
        <CardContent>
          <VaultTable items={emails} orgId={orgId} type="email" />
        </CardContent>
      </Card>
    </div>
  );
}

// ------ HELPER COMPONENTS ------

function VaultTable({
  items,
  orgId,
  type,
}: {
  items: any[];
  orgId: string;
  type: "service" | "email";
}) {
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay credenciales guardadas.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {type === "service" ? "Servicio / Plataforma" : "Cuenta de Correo"}
          </TableHead>
          <TableHead>Usuario / Login</TableHead>
          {type === "service" && <TableHead>Tier</TableHead>}
          <TableHead>Contraseña</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <span>{item.service}</span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {new URL(item.url).hostname}
                  </a>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {item.login_email || item.username || "-"}
                </span>
                <CopyButton text={item.login_email || item.username} />
              </div>
            </TableCell>
            {type === "service" && (
              <TableCell>
                {item.tier && <Badge variant="outline">{item.tier}</Badge>}
              </TableCell>
            )}
            <TableCell>
              <PasswordReveal password={item.password_hash} />
            </TableCell>
            <TableCell className="text-right">
              <DeleteCredentialButton id={item.id} orgId={orgId} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PasswordReveal({ password }: { password?: string }) {
  const [visible, setVisible] = useState(false);

  if (!password)
    return (
      <span className="text-muted-foreground text-xs italic">
        No establecida
      </span>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-24 truncate">
        {visible ? password : "••••••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </Button>
      <CopyButton text={password} />
    </div>
  );
}

function CopyButton({ text }: { text?: string }) {
  async function handleCopy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      <Copy className="w-3 h-3" />
    </Button>
  );
}

function DeleteCredentialButton({ id, orgId }: { id: string; orgId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleDelete() {
    if (!confirm("¿Eliminar esta credencial?")) return;
    setLoading(true);
    try {
      const res = await deleteCredential(id, orgId);
      if (res?.error) toast.error(res.error);
      else toast.success("Credencial eliminada");
    } catch (e) {
      toast.error("Error al eliminar");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:bg-red-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
}

function AddCredentialDialog({
  orgId,
  defaultCategory,
}: {
  orgId: string;
  defaultCategory: string;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdd(formData: FormData) {
    setIsLoading(true);
    try {
      const res = await addCredential(orgId, formData);
      if (res?.error) {
        toast.error("Error: " + res.error);
      } else {
        toast.success("Credencial guardada");
        setOpen(false);
      }
    } catch (err) {
      toast.error("Error al guardar credencial");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Agregar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Credencial</DialogTitle>
        </DialogHeader>
        <form action={handleAdd} className="space-y-4 pt-4">
          <input type="hidden" name="category" value={defaultCategory} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre / Servicio</Label>
              <Input
                name="service"
                placeholder={
                  defaultCategory === "email_account"
                    ? "Cuenta Google"
                    : "Vercel, AWS..."
                }
                required
              />
            </div>
            {defaultCategory === "service" && (
              <div className="space-y-2">
                <Label>URL (Login)</Label>
                <Input name="url" placeholder="https://..." />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Usuario / Email</Label>
            <Input
              name="login_email"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input name="password" type="password" required />
            </div>
            {defaultCategory === "service" && (
              <div className="space-y-2">
                <Label>Plan (Tier)</Label>
                <Select name="tier" defaultValue="Free">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? "Guardando..." : "Guardar en Bóveda"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
