import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../config";

let cached: SupabaseClient | null = null;

export function isServerConfigured() {
  return Boolean(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** عميل بصلاحية service_role — للخادم فقط، لا يصل إلى المتصفح أبدًا */
export function adminClient(): SupabaseClient {
  if (!isServerConfigured()) throw new NotConfiguredError();
  if (!cached) {
    cached = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export class NotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured");
  }
}
