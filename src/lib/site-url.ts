"use client";
import { useEffect, useState } from "react";

/** الرابط العام للمنصة: من NEXT_PUBLIC_SITE_URL إن وُجد، وإلا من عنوان الصفحة الحالية */
export function useSiteUrl() {
  const [url, setUrl] = useState<string>(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "");
  useEffect(() => {
    if (!url) setUrl(window.location.origin);
  }, [url]);
  return url;
}

export function isLocalUrl(url: string) {
  try {
    const h = new URL(url).hostname;
    return (
      h === "localhost" ||
      h.endsWith(".local") ||
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      h === "0.0.0.0"
    );
  } catch {
    return false;
  }
}
