import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(">>> [ADMIN CLIENT] Init...");
  console.log(">>> [ADMIN CLIENT] URL exists?", !!sbUrl);
  console.log(">>> [ADMIN CLIENT] KEY exists?", !!sbServiceKey);

  if (!sbUrl || !sbServiceKey) {
    console.error("!!! [ADMIN CLIENT] CRITICAL: Missing Env Variables");
    throw new Error("Faltan variables de entorno SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(sbUrl, sbServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
