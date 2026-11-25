"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImage({ value, size = 280, className = "", label = "رمز QR" }: { value: string; size?: number; className?: string; label?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: "M", color: { dark: "#2F3437", light: "#FFFFFF" } })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [value, size]);
  if (!src) return <div className={`animate-pulse rounded-2xl bg-ivory-deep ${className}`} style={{ width: size, height: size }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={size} height={size} alt={label} className={className} />;
}
