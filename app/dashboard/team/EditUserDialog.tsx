"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateUser, deleteUser } from "./actions";
import { toast } from "sonner";
import { Loader2, Edit } from "lucide-react";
import { DeleteButton } from "./DeleteButton";

interface EditUserDialogProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_blocked: boolean;
  };
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || "");
  const [role, setRole] = useState<string>(user.role || "admin");
  const [isBlocked, setIsBlocked] = useState(user.is_blocked || false);

  async function handleSave() {
    setIsLoading(true);
    try {
      const res = await updateUser({
        userId: user.id,
        fullName,
        role,
        isBlocked,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Usuario actualizado correctamente");
        setOpen(false);
      }
    } catch (err) {
      toast.error("Error al actualizar usuario");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Control total de perfil y acceso.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Email (Read Only) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right font-semibold">
              Email
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="col-span-3 bg-muted/50 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-semibold">
              Nombre
            </Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right font-semibold">
              Rol
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">⚡ Super Admin</SelectItem>
                <SelectItem value="admin">🛡️ Admin</SelectItem>
                <SelectItem value="support">🎧 Support</SelectItem>
                <SelectItem value="social_agent">💬 Social Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Block Switch */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="blocked"
              className="text-right font-semibold text-red-600"
            >
              Bloqueo
            </Label>
            <div className="col-span-3 flex items-center justify-between border p-3 rounded-md bg-red-50/50">
              <div className="flex items-center space-x-2">
                <Switch
                  id="blocked"
                  checked={isBlocked}
                  onCheckedChange={setIsBlocked}
                />
                <Label
                  htmlFor="blocked"
                  className="text-sm font-medium cursor-pointer"
                >
                  {isBlocked ? "Usuario Bloqueado" : "Usuario Activo"}
                </Label>
              </div>
              {isBlocked && (
                <span className="text-xs text-red-500 font-bold">
                  ACCESO DENEGADO
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {/* Delete Button (Left Aligned in Footer) */}
          <div className="flex items-center">
            <DeleteButton
              id={user.id}
              type="user"
              onDelete={async (id) => {
                const res = await deleteUser(id);
                if (res?.success) setOpen(false);
                return res;
              }}
            />
            <span className="text-xs text-muted-foreground ml-2">
              Eliminar usuario
            </span>
          </div>

          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
