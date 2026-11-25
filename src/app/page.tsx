import Link from "next/link";
import { ArrowLeft, BookOpenCheck, MonitorPlay, MousePointerClick, QrCode, Smartphone, Sparkles, UploadCloud, Users } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Mark } from "@/components/Logo";
import { Gallery } from "@/components/Gallery";
import { TRACK_LIST } from "@/lib/tracks";

const TRACK_ICON = { interactive: MousePointerClick, assessment: BookOpenCheck } as const;

export default function Home() {
  return (
    <Shell>
      {/* البطل */}
      <section className="container-page pb-16 pt-14 sm:pt-20">
        <div className="relative mx-auto max-w-3xl text-center">
          <Mark className="mx-auto mb-6 h-16 w-16 animate-rise sm:h-20 sm:w-20" />
          <h1 className="animate-rise font-display text-5xl font-extrabold tracking-tight text-ink sm:text-7xl">
            بصمة <span className="text-sage-600">رقمية</span>
          </h1>
          <p className="mt-5 animate-rise font-display text-xl font-bold text-petrol-600 [animation-delay:80ms] sm:text-2xl">
            إبداع تقني يبدأ بفكرة، ويترك أثرًا في الممارسة.
          </p>
          <p className="mx-auto mt-6 max-w-2xl animate-rise text-base leading-8 text-ink-soft [animation-delay:160ms] sm:text-lg sm:leading-9">
            أهلًا بمعلمات الحاسب، هنا نلتقي لنتعلم ونجرب ونتشارك خبراتنا، ونحوّل المعرفة إلى ممارسات تعليمية ملهمة.
          </p>
        </div>
      </section>

      {/* المساران */}
      <section className="container-page" aria-labelledby="tracks-h">
        <h2 id="tracks-h" className="sr-only">المسارات التدريبية</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {TRACK_LIST.map((t, i) => {
            const Icon = TRACK_ICON[t.id];
            const sage = t.tone === "sage";
            return (
              <Link
                key={t.id}
                href={t.href}
                className="card group relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-9"
              >
                <span
                  aria-hidden
                  className={`absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-60 transition duration-500 group-hover:scale-110 ${sage ? "bg-sage-100" : "bg-petrol-100"}`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${sage ? "bg-sage-100 text-sage-700" : "bg-petrol-100 text-petrol-700"}`}>
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="font-display text-sm font-bold text-ink-mute">المسار {i === 0 ? "الأول" : "الثاني"}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-extrabold sm:text-3xl">{t.title}</h3>
                  <p className="mt-3 leading-8 text-ink-soft">{t.description}</p>
                  <span className={`mt-7 inline-flex items-center gap-2 font-semibold ${sage ? "text-sage-700" : "text-petrol-700"}`}>
                    ابدئي المسار
                    <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* كيف نشارك */}
      <section className="container-page mt-20" aria-labelledby="how-h">
        <div className="mb-8 text-center">
          <p className="eyebrow">ثلاث خطوات فقط</p>
          <h2 id="how-h" className="h-section mt-2">كيف تتركين بصمتك؟</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "تعلّمي وجرّبي", text: "اطّلعي على أفكار المسار وأمثلته من دروس الحاسب." },
            { icon: Smartphone, title: "طبّقي على درسك", text: "اختاري درسًا من مقررك وصممي تطبيقك بالأداة المناسبة." },
            { icon: UploadCloud, title: "شاركي زميلاتك", text: "ارفعي عملك من جوالك ليظهر مباشرة على شاشة الورشة." },
          ].map((s, i) => (
            <li key={s.title} className="card flex items-start gap-4 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-peach-50 text-peach-500">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-ink-mute">{i + 1}</p>
                <h3 className="font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm leading-7 text-ink-soft">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex justify-center">
          <Link href="/submit" className="btn-primary !min-h-[52px] !px-8 !text-base">
            <UploadCloud className="h-5 w-5" /> أضيفي مشاركتك
          </Link>
        </div>
      </section>

      {/* أحدث الأعمال */}
      <section className="container-page mt-24" aria-labelledby="latest-h">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">مباشرة من الورشة</p>
            <h2 id="latest-h" className="h-section mt-2">أحدث إبداعات معلماتنا</h2>
          </div>
          <Link href="/gallery" className="btn-soft">
            المعرض كاملًا <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <Gallery compact limit={3} />
      </section>

      {/* أدوات المدربة */}
      <section className="container-page mt-24" aria-labelledby="trainer-h">
        <div className="rounded-4xl border border-ink/[0.06] bg-white/60 p-6 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">للمدربة</p>
              <h2 id="trainer-h" className="h-section mt-2">ورشة تتحول إلى مجتمع ممارسة</h2>
              <p className="mt-3 leading-8 text-ink-soft">
                اعرضي رمز QR في البداية، اشرحي المسار، ودعي المعلمات يطبقن ويرفعن أعمالهن، ثم استعرضيها واحدة تلو الأخرى على السبورة.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[460px]">
              <Link href="/qr" className="btn-soft !min-h-[56px]"><QrCode className="h-4 w-4" /> رمز QR</Link>
              <Link href="/present" className="btn-soft !min-h-[56px]"><MonitorPlay className="h-4 w-4" /> وضع العرض</Link>
              <Link href="/closing" className="btn-soft !min-h-[56px]"><Users className="h-4 w-4" /> الختام</Link>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
