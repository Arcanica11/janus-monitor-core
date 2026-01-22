"use client";

import { useState } from "react";
import { resetPassword } from "./actions";
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
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    // Call server action
    const result = await resetPassword(formData);

    setIsLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setIsSuccess(true);
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

        <Card>
          <CardHeader>
            <CardTitle>Recuperar Contraseña</CardTitle>
            <CardDescription>
              Te enviaremos un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>

          {isSuccess ? (
            <CardContent className="space-y-4 text-center">
              <div className="flex justify-center text-green-500 mb-2">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="font-medium text-lg">¡Correo Enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada (y spam). Sigue las instrucciones
                para crear una nueva contraseña.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Volver al Login</Link>
                </Button>
              </div>
            </CardContent>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-4">
              <CardContent className="space-y-4">
                {error && (
                  <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
                    {error}
                  </div>
                )}

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
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enviar enlace de recuperación
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar y volver
                  </Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
