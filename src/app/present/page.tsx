import type { Metadata } from "next";
import { Presenter } from "@/components/Presenter";
import { isTrackId } from "@/lib/tracks";

export const metadata: Metadata = { title: "وضع العرض" };

export default async function PresentPage({ searchParams }: { searchParams: Promise<{ track?: string; id?: string }> }) {
  const { track, id } = await searchParams;
  return <Presenter initialTrack={isTrackId(track) ? track : "all"} initialId={id && /^[0-9a-f-]{36}$/i.test(id) ? id : undefined} />;
}
