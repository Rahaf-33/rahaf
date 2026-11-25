export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const BUCKET = "submissions";

export const isPublicConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const NOT_CONFIGURED_MESSAGE =
  "المنصة غير متصلة بقاعدة البيانات بعد. على المدربة إضافة مفاتيح Supabase في إعدادات النشر.";
