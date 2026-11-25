import { FileText, FileImage, Presentation, FileSpreadsheet, FileVideo, File } from "lucide-react";
import { fileKind } from "@/lib/files";

export function FileIcon({ type, className = "h-5 w-5" }: { type: string; className?: string }) {
  const k = fileKind(type);
  const Icon =
    k === "image" ? FileImage : k === "pdf" || k === "doc" ? FileText : k === "slides" ? Presentation : k === "sheet" ? FileSpreadsheet : k === "video" ? FileVideo : File;
  return <Icon className={className} aria-hidden />;
}
