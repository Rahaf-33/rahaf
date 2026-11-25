import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { Gallery } from "@/components/Gallery";
import { isTrackId } from "@/lib/tracks";

export const metadata: Metadata = { title: "إبداعات معلماتنا" };

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const { track } = await searchParams;
  return (
    <Shell>
      <div className="container-page pt-10 sm:pt-14">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow">معرض الأعمال</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">إبداعات معلماتنا</h1>
          <p className="mt-4 text-lg leading-9 text-ink-soft">
            تطبيقات حقيقية صممتها معلمات الحاسب على دروس من مقرراتهن. تظهر كل مشاركة جديدة هنا لحظة إرسالها.
          </p>
        </div>
        <Gallery key={track ?? "all"} initialTrack={isTrackId(track) ? track : "all"} />
      </div>
    </Shell>
  );
}
