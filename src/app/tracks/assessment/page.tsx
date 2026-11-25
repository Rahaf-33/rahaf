import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { ApplySpace, Section, SectionNav, StepFlow, TrackGallery, TrackHero, TrackSwitch } from "@/components/TrackParts";

export const metadata: Metadata = { title: "التقويم من أجل التعلم" };

const CONCEPTS = [
  { term: "القياس", def: "جمع معلومات أو بيانات عن أداء الطالبة.", eg: "حصلت الطالبة على 7 من 10 في نشاط البرمجة.", tone: "bg-sage-100 text-sage-700" },
  { term: "التقييم", def: "إصدار حكم على مستوى الأداء وفق معيار.", eg: "أداؤها «متمكنة» في استخدام الشروط، و«نامية» في التكرار.", tone: "bg-petrol-100 text-petrol-700" },
  { term: "التقويم", def: "استخدام نتائج القياس والتقييم لاتخاذ قرار يحسن التعلم والتدريس.", eg: "سأعيد شرح الحلقات بمثال مرئي وأعطيها تمرينًا موجّهًا.", tone: "bg-peach-100 text-peach-500" },
];

const TYPES = [
  { name: "تقويم التعلم", en: "Assessment of Learning", when: "في نهاية الوحدة أو الفصل", purpose: "التحقق مما تعلمته الطالبة وإصدار الدرجة.", who: "المعلمة تحكم", eg: "اختبار نهاية الوحدة" },
  { name: "التقويم كتعلم", en: "Assessment as Learning", when: "طوال عملية التعلم", purpose: "أن تراقب الطالبة تعلمها وتنظمه بنفسها.", who: "الطالبة تتأمل", eg: "سجل تأمل ذاتي بعد كل مشروع" },
  { name: "التقويم من أجل التعلم", en: "Assessment for Learning", when: "أثناء الحصة وبشكل مستمر", purpose: "جمع أدلة على التعلم لتعديل التدريس وتحديد الخطوة التالية.", who: "المعلمة والطالبة معًا", eg: "سؤال كاشف يتبعه تعديل الشرح فورًا", highlight: true },
];

const STRATEGIES = [
  { title: "توضيح أهداف التعلم ومعايير النجاح", text: "تعرف الطالبة إلى أين تتجه، وكيف يبدو العمل المتقن قبل أن تبدأ." },
  { title: "الأسئلة والمناقشات التي تكشف الفهم", text: "أسئلة مصممة لإظهار طريقة التفكير والمفاهيم الخاطئة، لا لاستدعاء المعلومة فقط." },
  { title: "التغذية الراجعة الوصفية", text: "تصف ما تحقق، وتحدد الخطوة التالية بوضوح بدل الاكتفاء بالدرجة أو «أحسنتِ»." },
  { title: "الطالبة مصدر تعلم لزميلاتها", text: "مراجعة الأقران والتعلم التعاوني بمعايير واضحة يجعل كل طالبة معلّمة ومتعلمة." },
  { title: "الطالبة مالكة لتعلمها", text: "التقييم الذاتي يمنحها القدرة على الحكم على عملها وتخطيط تحسينه." },
];

const CODE_EXAMPLE = [
  { title: "عرض كود يحتوي على خطأ", text: "تعرض المعلمة مقطعًا قصيرًا: حلقة يُفترض أن تطبع الأعداد من 1 إلى 5 لكنها تطبع حتى 4." },
  { title: "اكتشاف الخطأ", text: "تطلب من كل طالبة تحديد السطر الخاطئ واقتراح التصحيح خلال دقيقتين." },
  { title: "جمع الإجابات", tag: "Socrative · Wooclap", text: "ترسل الطالبات إجاباتهن رقميًا فتظهر للمعلمة إجابات الجميع لا المتطوعات فقط." },
  { title: "تحديد الخطأ الأكثر شيوعًا", text: "يتضح أن 60٪ ظنن أن range(1, 5) تشمل العدد 5 — هذا هو الدليل." },
  { title: "تعديل الشرح بناءً على الأدلة", text: "تعيد المعلمة شرح حدود الدالة range بمثال مرئي، ثم سؤال تحقق سريع قبل الانتقال." },
];

const UI_EXAMPLE = [
  { title: "عرض تصميمات الطالبات", tag: "Padlet", text: "تنشر كل طالبة لقطة واجهة التطبيق الذي صممته على جدار مشترك." },
  { title: "قائمة معايير واضحة", text: "وضوح الأزرار، تناسق الألوان، سهولة التنقل، قابلية القراءة — بمستويات أداء متدرجة." },
  { title: "تقييم الأقران", text: "تقيّم كل طالبة عملين لزميلتيها: «نجمتان وأمنية» مرتبطة بالمعايير." },
  { title: "تغذية راجعة وصفية", text: "«الألوان متناسقة والأزرار واضحة، الخطوة التالية: كبّري الخط في شاشة الإعدادات ليسهل قراءته»." },
];

const METHODS = [
  { name: "بطاقات الخروج الرقمية", how: "سؤال أو سؤالان في آخر دقائق الحصة عبر نموذج أو Socrative.", when: "لمعرفة من حقق هدف الحصة وتخطيط بداية الحصة القادمة." },
  { name: "التصويت الفوري", how: "سؤال اختيار من متعدد تظهر نتيجته لحظيًا عبر Wooclap أو ClassPoint.", when: "قبل الانتقال لفكرة جديدة للتأكد من أن الأساس واضح." },
  { name: "الأسئلة الكاشفة للفهم", how: "خيارات مبنية على أخطاء شائعة، فكل إجابة خاطئة تكشف تصورًا محددًا.", when: "في المفاهيم التي يكثر فيها الخلط مثل أنواع البيانات والشروط." },
  { name: "ألواح الإجابات السريعة", how: "ترفع كل طالبة إجابتها في وقت واحد على لوح أو سبورة رقمية.", when: "للتحقق السريع من مهارة إجرائية كتحويل الأنظمة العددية." },
  { name: "التقييم الذاتي", how: "قائمة «أستطيع أن…» تحدد فيها الطالبة مستواها أمام كل هدف.", when: "في نهاية المشروع أو قبل الاختبار لتوجيه المراجعة." },
  { name: "مراجعة الأقران", how: "تبادل الأعمال وتقييمها بمعايير مكتوبة وصيغة تعليق محددة.", when: "في المشاريع البرمجية والتصميم حين تتعدد الحلول الصحيحة." },
  { name: "مقياس التقدير المتدرج", how: "مستويات أداء (مبتدئة، نامية، متمكنة، متميزة) بوصف واضح لكل مستوى.", when: "لتقييم المنتجات والمهارات المركبة ومشاركته مع الطالبات مسبقًا." },
];

export default function AssessmentTrack() {
  return (
    <Shell>
      <TrackHero
        track="assessment"
        index="الثاني"
        intro="التقويم من أجل التعلم ليس اختبارًا إضافيًا، بل عادة صفية: نجمع الدليل على تعلم الطالبة أثناء التعلم، ثم نستخدمه لنقرر خطوتنا التالية وخطوتها التالية."
      />
      <SectionNav
        items={[
          { id: "concepts", label: "المفاهيم الأساسية" },
          { id: "strategies", label: "الاستراتيجيات الخمس" },
          { id: "examples", label: "أمثلة من الحاسب" },
          { id: "methods", label: "أدوات وطرق حديثة" },
          { id: "apply", label: "مساحة التطبيق" },
          { id: "gallery", label: "مشاركات المسار" },
        ]}
      />

      <Section id="concepts" num={1} title="المفاهيم الأساسية" lead="ثلاث كلمات متقاربة، لكن لكل منها دور مختلف في دورة التعلم.">
        <div className="grid gap-4 md:grid-cols-3">
          {CONCEPTS.map((c, i) => (
            <div key={c.term} className="card relative p-6">
              <span className={`chip ${c.tone}`}>{i + 1} · {c.term}</span>
              <p className="mt-4 font-display text-lg font-bold leading-8">{c.def}</p>
              <p className="mt-4 rounded-2xl bg-ivory-deep p-3 text-sm leading-7 text-ink-soft">
                <span className="font-semibold text-ink">مثال: </span>{c.eg}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mb-4 mt-12 font-display text-xl font-bold">الفرق بين أنواع التقويم</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {TYPES.map((t) => (
            <div key={t.name} className={`rounded-3xl border p-6 ${t.highlight ? "border-petrol-200 bg-petrol-50 shadow-soft" : "border-ink/[0.06] bg-white/90 shadow-soft"}`}>
              <h4 className="font-display text-lg font-bold">{t.name}</h4>
              <p className="text-xs font-medium text-ink-mute" dir="ltr">{t.en}</p>
              <dl className="mt-4 grid gap-3 text-sm leading-7">
                <div><dt className="font-semibold text-ink">متى؟</dt><dd className="text-ink-soft">{t.when}</dd></div>
                <div><dt className="font-semibold text-ink">الهدف</dt><dd className="text-ink-soft">{t.purpose}</dd></div>
                <div><dt className="font-semibold text-ink">الدور</dt><dd className="text-ink-soft">{t.who}</dd></div>
                <div><dt className="font-semibold text-ink">مثال</dt><dd className="text-ink-soft">{t.eg}</dd></div>
              </dl>
              {t.highlight && <span className="chip mt-4 bg-petrol-600 text-white">محور مسارنا</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="strategies" num={2} title="الاستراتيجيات الخمس للتقويم من أجل التعلم" lead="خمس استراتيجيات تعمل معًا: تبدأ من الهدف وتنتهي بطالبة تقود تعلمها.">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STRATEGIES.map((s, i) => (
            <li key={s.title} className="card flex flex-col p-5">
              <span className="font-display text-4xl font-extrabold text-petrol-200">{i + 1}</span>
              <h3 className="mt-3 font-display text-base font-bold leading-7">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="examples" num={3} title="أمثلة من مادة الحاسب">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="chip bg-sage-100 text-sage-700">مثال 1</span>
              <h3 className="font-display text-xl font-bold">درس البرمجة</h3>
            </div>
            <pre dir="ltr" className="mb-5 overflow-x-auto rounded-2xl bg-ink p-5 text-left font-mono text-sm leading-7 text-ivory">
{`# اطبعي الأعداد من 1 إلى 5
for i in range(1, 5):
    print(i)`}
            </pre>
            <StepFlow steps={CODE_EXAMPLE} tone="petrol" />
          </div>
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="chip bg-peach-100 text-peach-500">مثال 2</span>
              <h3 className="font-display text-xl font-bold">درس تصميم واجهات المستخدم</h3>
            </div>
            <div className="card mb-5 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ivory-deep text-ink">
                  <tr><th className="p-3 text-right font-semibold">المعيار</th><th className="p-3 text-center font-semibold">نامية</th><th className="p-3 text-center font-semibold">متمكنة</th></tr>
                </thead>
                <tbody className="text-ink-soft">
                  {["وضوح الأزرار", "تناسق الألوان", "سهولة التنقل", "قابلية القراءة"].map((c) => (
                    <tr key={c} className="border-t border-ink/[0.05]"><td className="p-3">{c}</td><td className="p-3 text-center">○</td><td className="p-3 text-center">●</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <StepFlow steps={UI_EXAMPLE} tone="petrol" />
          </div>
        </div>
      </Section>

      <Section id="methods" num={4} title="أدوات وطرق تطبيق حديثة" lead="كيف تستخدمين كل طريقة، ومتى تكون الخيار الأنسب.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map((m) => (
            <div key={m.name} className="card p-6">
              <h3 className="font-display text-lg font-bold">{m.name}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-soft"><span className="font-semibold text-ink">كيف؟ </span>{m.how}</p>
              <p className="mt-2 text-sm leading-7 text-ink-soft"><span className="font-semibold text-petrol-600">متى؟ </span>{m.when}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="apply" num={5} title="مساحة التطبيق">
        <ApplySpace
          track="assessment"
          instructions="اختاري درسًا من مقررك، وصممي استراتيجية تقويم من أجل التعلم، بحيث توضّح كيف ستجمعين دليلًا على تعلم الطالبات، وكيف ستستخدمين هذا الدليل لاتخاذ قرار تعليمي"
          hints={[
            "حددي هدف التعلم ومعيار النجاح أولًا.",
            "ما الأداة أو الطريقة التي ستجمعين بها الدليل؟",
            "ماذا ستفعلين إن أظهر الدليل أن الطالبات لم يتقنّ الهدف؟",
          ]}
        />
      </Section>

      <TrackGallery track="assessment" />
      <TrackSwitch current="assessment" />
    </Shell>
  );
}
