import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Persist an error to the error_logs table for later review.
 * Fire-and-forget — never throws.
 */
export async function logError(
  functionName: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supabase.from("error_logs").insert({
      function_name: functionName,
      error_message: error instanceof Error ? error.message : String(error),
      error_context: {
        stack: error instanceof Error ? error.stack : undefined,
        ...context,
      },
    });
  } catch (e) {
    // Last resort — don't let logging crash the function
    console.error("Failed to persist error log:", e);
  }
}
