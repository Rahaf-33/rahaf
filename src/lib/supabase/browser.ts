"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isPublicConfigured } from "../config";

let client: SupabaseClient | null = null;

/** عميل عام (anon) يُستخدم في المتصفح للتحديث اللحظي ورفع الملفات بروابط موقّعة */
export function browserClient(): SupabaseClient | null {
  if (!isPublicConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return client;
}
