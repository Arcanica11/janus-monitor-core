"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom"; // IMPORTANTE
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import Link from "next/link";

// COMPONENTE SubmitButton CON useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-primary hover:bg-primary/90"
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export default function LoginPage() {
  // Eliminamos isLoading manual, usamos useFormStatus en el botón
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    try {
      const result = await login(formData); // Server Action
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado");
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-[400px]">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logorueda.png"
            width={200}
            height={80}
            alt="Rueda la Rola"
            className="mb-4 object-contain"
            priority
          />
        </div>

        {error && (
          <div className="mb-4">
            <Alert
              variant="destructive"
              className="animate-in fade-in zoom-in duration-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a Janus Monitor.
            </CardDescription>
          </CardHeader>
          {/* Action apunta al wrapper handleLogin */}
          <form action={handleLogin} className="flex flex-col gap-4">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <SubmitButton />
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:underline text-center"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
