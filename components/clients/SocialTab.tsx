"use client";

import { useState } from "react";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Mail,
  Smartphone,
  Globe,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddSocialDialog } from "./AddSocialDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialCredential {
  id: string;
  platform: string;
  username: string;
  password?: string;
  recovery_email?: string;
  url?: string;
  notes?: string;
}

interface SocialTabProps {
  credentials: SocialCredential[];
  clientId: string;
}

function SocialCard({ cred }: { cred: SocialCredential }) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case "facebook":
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case "linkedin":
        return <Linkedin className="w-5 h-5 text-blue-700" />;
      case "twitter":
        return <Twitter className="w-5 h-5 text-sky-500" />;
      case "gmail":
        return <Mail className="w-5 h-5 text-red-500" />;
      case "tiktok":
        return <span className="text-xl leading-none">🎵</span>;
      default:
        return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <div className="flex items-center gap-2">
          {getIcon(cred.platform)}
          <CardTitle className="text-base font-medium capitalize">
            {cred.platform === "other" ? "Otro" : cred.platform}
          </CardTitle>
        </div>
        {cred.url && (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href={
                cred.url.startsWith("http") ? cred.url : `https://${cred.url}`
              }
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid gap-1">
          <p className="text-xs font-medium text-muted-foreground">Usuario</p>
          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
            <span className="text-sm font-mono truncate">{cred.username}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2"
              onClick={() => copyToClipboard(cred.username, "Usuario")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="grid gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            Contraseña
          </p>
          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
            <span className="text-sm font-mono truncate">
              {showPassword ? cred.password : "••••••••••••"}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  copyToClipboard(cred.password || "", "Contraseña")
                }
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {cred.recovery_email && (
          <div className="flex gap-2 items-center text-xs text-muted-foreground pt-2 border-t mt-2">
            <Smartphone className="w-3 h-3" />
            <span>Recuperación: {cred.recovery_email}</span>
          </div>
        )}

        {cred.notes && (
          <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
            {cred.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SocialTab({ credentials, clientId }: SocialTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Bóveda de Redes Sociales</h3>
          <p className="text-sm text-muted-foreground">
            Gestión segura de accesos a plataformas sociales.
          </p>
        </div>
        <AddSocialDialog clientId={clientId} />
      </div>

      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <Globe className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground max-w-sm">
            No hay credenciales guardadas. Agrega los accesos de Instagram,
            Facebook o TikTok de este cliente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cred) => (
            <SocialCard key={cred.id} cred={cred} />
          ))}
        </div>
      )}
    </div>
  );
}
