import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    // 1. Get active domains
    const { data: domains, error } = await supabase
      .from("domains")
      .select("id, url")
      .eq("status", "active");

    if (error) throw error;
    if (!domains || domains.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active domains found" }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const BATCH_SIZE = 10;
    const results = [];

    // 2. Process in batches
    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
      const batch = domains.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (domain) => {
        const start = performance.now();
        let status = 0;
        let errorMessage = null;

        try {
          // Validate URL schema
          let urlToFetch = domain.url;
          if (!urlToFetch.startsWith("http")) {
            urlToFetch = `https://${urlToFetch}`;
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(urlToFetch, {
            method: "HEAD",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          status = response.status;
        } catch (err) {
          status = 0; // Represents "Down" or Network Error
          errorMessage = err instanceof Error ? err.message : String(err);
        }

        const latency = Math.round(performance.now() - start);

        return {
          id: domain.id,
          status,
          latency,
          error: errorMessage,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // 3. Update Database
    // We update domains and insert logs for failures.
    // It's more efficient to do bulk operations if possible, but for simplicity/reliability we'll iterate.
    // Ideally we would use an RPC call for bulk updates, but simple loops work for reasonable numbers.

    const updates = results.map((r) => ({
      id: r.id,
      last_http_status: r.status,
      last_checked_at: new Date().toISOString(),
    }));

    // Update domains table (upsert is best if we can match ID, but update is cleaner here)
    // Supabase JS upsert works well.
    const { error: updateError } = await supabase
      .from("domains")
      .upsert(updates, { onConflict: "id", ignoreDuplicates: false });

    if (updateError) console.error("Error updating domains:", updateError);

    // 4. Log Failures (Upsert into uptime_logs)
    const failures = results
      .filter((r) => r.status !== 200)
      .map((r) => ({
        domain_id: r.id,
        status_code: r.status,
        latency_ms: r.latency,
        error_message: r.error,
        // created_at is default now()
      }));

    if (failures.length > 0) {
      const { error: logsError } = await supabase
        .from("uptime_logs")
        .insert(failures);

      if (logsError) console.error("Error inserting logs:", logsError);
    }

    return new Response(
      JSON.stringify({
        processed: domains.length,
        failures: failures.length,
        details: results,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
