"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  // Dynamic origin for robust deploys (localhost vs prod)
  const origin = (await headers()).get("origin");

  // Redirect to dashboard/profile or a specific reset password update page.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard/profile`,
  });

  if (error) {
    console.error("Reset Password Error:", error);
    return { error: error.message };
  }

  return { success: true };
}
