import { createClient } from "@/utils/supabase/server";

export async function logAuditEvent(
  action: string,
  target_resource: string,
  metadata: any = {},
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn(
        "Attempted to log audit event without authenticated user:",
        action,
      );
      return;
    }

    const { error } = await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action,
      target_resource,
      metadata,
    });

    if (error) {
      console.error("Failed to insert audit log:", error);
    } else {
      console.log(`[AUDIT] ${action} on ${target_resource} by ${user.email}`);
    }
  } catch (err) {
    console.error("Exception in logAuditEvent:", err);
  }
}
