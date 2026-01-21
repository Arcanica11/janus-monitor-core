"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("🔥 Intento de login iniciado con:", email);
  console.log(
    "📡 Conectando a Supabase URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Error de Supabase:", error.message);
      return { error: error.message };
    }
  } catch (err: any) {
    console.error("❌ Error de Red / Inesperado:", err);
    return { error: "Error de conexión con el servidor. Revisa los logs." };
  }

  console.log("✅ Login exitoso, redirigiendo a /dashboard...");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
