import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { SubmitForm } from "@/components/SubmitForm";
import { isTrackId } from "@/lib/tracks";

export const metadata: Metadata = { title: "أضيفي مشاركتك" };

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const { track } = await searchParams;
  return (
    <Shell>
      <div className="container-page max-w-3xl pb-10 pt-10 sm:pt-14">
        <div className="mb-8 text-center">
          <p className="eyebrow">مساحة المشاركة</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">أضيفي بصمتك</h1>
          <p className="mx-auto mt-3 max-w-lg leading-8 text-ink-soft">
            شاركي تطبيقك مع زميلاتك. الحقول المعلّمة بـ <span className="text-peach-500">*</span> فقط إلزامية، والباقي يثري مشاركتك.
          </p>
        </div>
        <SubmitForm initialTrack={isTrackId(track) ? track : undefined} />
      </div>
    </Shell>
  );
}
