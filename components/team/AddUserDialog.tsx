"use client";

import { useState } from "react";
// 1. VOLVEMOS A DIALOG (Modal Centrado)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser } from "@/app/dashboard/team/actions";
import { toast } from "sonner";
import { Plus, Loader2, RefreshCw, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddUserDialogProps {
  organizations: { id: string; name: string }[];
}

export function AddUserDialog({ organizations }: AddUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar los valores
  const [password, setPassword] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedRole, setSelectedRole] = useState("social_agent");

  const router = useRouter();

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let newPass = "";
    for (let i = 0; i < 12; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPass);
    toast.info("Contraseña generada");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast.success("Copiado al portapapeles");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    // CHECK VISUAL
    console.log("ESTADO REACT - Org:", selectedOrg, "Role:", selectedRole);

    if (!selectedOrg) {
      toast.error(
        "⛔ ALTO: No has seleccionado organización en el desplegable.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      const form = e.currentTarget;

      // Extracción manual segura
      formData.append(
        "full_name",
        (form.elements.namedItem("full_name") as HTMLInputElement).value,
      );
      formData.append(
        "email",
        (form.elements.namedItem("email") as HTMLInputElement).value,
      );
      formData.append("password", password);
      formData.append("role", selectedRole); // Estado React
      formData.append("organization_id", selectedOrg); // Estado React

      const res = await createUser(formData);

      if (res?.error) {
        toast.error("❌ " + res.error);
      } else {
        toast.success("✅ Guardado. Recargando...");
        setIsOpen(false);
        // RECARGA FORZADA (Solución temporal para caché rebelde)
        window.location.reload();
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Miembro
        </Button>
      </DialogTrigger>
      {/* 2. DISEÑO CENTRADO Y CON PADDING CORRECTO */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Miembro del Equipo</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Corporativo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="juan@empresa.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Contraseña Inicial</Label>
            <div className="flex gap-2">
              <Input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                title="Generar"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                title="Copiar"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Rol</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="support">Soporte Técnico</SelectItem>
                <SelectItem value="social_agent">Agente Social</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Organización</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
