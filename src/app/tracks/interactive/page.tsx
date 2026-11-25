import type { Metadata } from "next";
import { DoorOpen, LockKeyhole, Mic, MonitorUp, Hand, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ApplySpace, Section, SectionNav, StepFlow, ToolCard, TrackGallery, TrackHero, TrackSwitch } from "@/components/TrackParts";

export const metadata: Metadata = { title: "إدارة الحصة التفاعلية" };

const VIRTUAL = [
  { icon: DoorOpen, title: "تنظيم دخول الطالبات", text: "فعّلي غرفة الانتظار، وابدئي بنشاط ترحيبي قصير يشغل الطالبات حتى يكتمل الحضور، وسجّلي الحضور آليًا." },
  { icon: LockKeyhole, title: "إدارة صلاحيات المشاركة", text: "حدّدي من يستطيع مشاركة الشاشة أو الكتابة على السبورة، وامنحي الصلاحية مؤقتًا لمن تعرض عملها ثم استرجعيها." },
  { icon: Mic, title: "التحكم في الصوت والكاميرا والمحادثة", text: "اكتمي الميكروفونات عند الدخول، واتفقي على قواعد واضحة: متى نفتح الصوت؟ ومتى نكتب في المحادثة؟" },
  { icon: MonitorUp, title: "مشاركة الشاشة والسبورة", text: "جهّزي النوافذ مسبقًا، وشاركي التطبيق المطلوب فقط لا الشاشة كاملة، واستخدمي السبورة للشرح والحل الجماعي." },
  { icon: Hand, title: "تنظيم تفاعل الطالبات", text: "استخدمي رفع اليد والتفاعلات والاستطلاعات السريعة والغرف الفرعية لتوزيع الأدوار وإشراك الجميع." },
  { icon: ShieldCheck, title: "الإدارة الآمنة والإنهاء الصحيح", text: "اقفلي الحصة بعد اكتمال الحضور، وأنهي الجلسة للجميع لا بالمغادرة فقط، واحفظي التسجيل والمرفقات في مكانها." },
];

const TOOLS = [
  { name: "Nearpod", use: "الدروس والعروض التفاعلية", when: "عند تقديم مفهوم جديد وتريدين أسئلة وأنشطة مدمجة داخل الشرح تتابعين فيها كل طالبة.", url: "https://nearpod.com", tone: "sage" },
  { name: "Blooket", use: "المسابقات التعليمية", when: "لمراجعة ممتعة في نهاية الوحدة أو بداية الحصة بروح المنافسة والألعاب.", url: "https://www.blooket.com", tone: "petrol" },
  { name: "Socrative", use: "الأسئلة وقياس الفهم", when: "لقياس سريع للفهم واختبارات قصيرة وبطاقات خروج مع تقارير فورية.", url: "https://www.socrative.com", tone: "peach" },
  { name: "Edpuzzle", use: "الفيديوهات التفاعلية", when: "حين يكون الفيديو جزءًا من الدرس: أضيفي أسئلة داخله لتضمني متابعة الطالبات وفهمهن.", url: "https://edpuzzle.com", tone: "sage" },
  { name: "ClassPoint", use: "التفاعل داخل PowerPoint", when: "إن كنتِ تشرحين بعروض PowerPoint وتريدين أسئلة وتصويتًا دون مغادرة الشرائح.", url: "https://www.classpoint.io", tone: "petrol" },
  { name: "Wooclap", use: "التصويت والأسئلة الفورية", when: "لاستطلاع رأي أو سؤال مفاجئ أو سحابة كلمات تكشف ما تفكر فيه الطالبات الآن.", url: "https://www.wooclap.com", tone: "peach" },
  { name: "Curipod", use: "إنشاء دروس وأنشطة تفاعلية", when: "عندما تحتاجين إلى بناء نشاط تفاعلي سريع من فكرة الدرس مع مساحة لإبداع الطالبات.", url: "https://curipod.com", tone: "sage" },
  { name: "Padlet", use: "مشاركة الأفكار والمنتجات", when: "لجمع أفكار الطالبات أو عرض منتجاتهن على جدار واحد والتعليق عليها.", url: "https://padlet.com", tone: "petrol" },
] as const;

const EXAMPLE = [
  { title: "تهيئة بسؤال تفاعلي", tag: "Wooclap", text: "سؤال افتتاحي: «ما أول ما يخطر ببالك عند سماع كلمة اختراق؟» تظهر إجابات الطالبات في سحابة كلمات على الشاشة." },
  { title: "عرض موقف تعليمي", tag: "Nearpod", text: "تعرض المعلمة رسالة تصيّد حقيقية الشكل تَعِد بجائزة وتطلب كلمة المرور، وتسأل: هل تفتحين الرابط؟ ولماذا؟" },
  { title: "إشراك الطالبات في نشاط", tag: "Padlet", text: "في مجموعات، تحلل كل مجموعة رسالة مختلفة وتحدد علامات الاحتيال فيها، ثم تنشر نتيجتها على جدار مشترك." },
  { title: "جمع الإجابات", tag: "Socrative", text: "ثلاثة أسئلة سريعة لكل طالبة: صنّفي الرسالة (آمنة/احتيالية) واذكري الدليل. تصل الإجابات فورًا للمعلمة." },
  { title: "عرض النتائج ومناقشتها", tag: "Blooket", text: "تعرض المعلمة نسب الإجابات وتناقش أكثر الأخطاء شيوعًا، ثم تختم بمسابقة قصيرة لترسيخ قواعد الحماية." },
];

export default function InteractiveTrack() {
  return (
    <Shell>
      <TrackHero
        track="interactive"
        index="الأول"
        intro="الحصة التفاعلية لا تعني أدوات أكثر، بل مشاركة أوسع: كل طالبة لها صوت، وكل نشاط له هدف، والمعلمة تدير الوقت والتفاعل بثقة — حضوريًا أو افتراضيًا."
      />
      <SectionNav
        items={[
          { id: "virtual", label: "الحصة الافتراضية" },
          { id: "tools", label: "التطبيقات المساندة" },
          { id: "example", label: "مثال تطبيقي" },
          { id: "apply", label: "مساحة التطبيق" },
          { id: "gallery", label: "مشاركات المسار" },
        ]}
      />

      <Section id="virtual" num={1} title="إدارة الحصة الافتراضية" lead="ست ممارسات تجعل الحصة الافتراضية منظمة وآمنة من الدخول حتى الإنهاء.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIRTUAL.map((v) => (
            <div key={v.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <v.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold">{v.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-soft">{v.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tools" num={2} title="التطبيقات المساندة" lead="الأداة المناسبة هي التي تخدم هدف اللحظة في الحصة. إليكِ متى تختارين كل واحدة.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <ToolCard key={t.name} {...t} />
          ))}
        </div>
      </Section>

      <Section id="example" num={3} title="مثال تطبيقي: درس «الأمن السيبراني»" lead="كيف تتحول خمس دقائق من الشرح إلى رحلة تفاعلية تشارك فيها كل طالبة.">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <StepFlow steps={EXAMPLE} tone="sage" />
          <aside className="card h-fit p-6 lg:sticky lg:top-36">
            <p className="eyebrow">هدف الدرس</p>
            <p className="mt-2 font-display text-lg font-bold leading-8">أن تميّز الطالبة رسائل التصيّد الاحتيالي وتطبّق قواعد حماية حساباتها.</p>
            <div className="mt-5 border-t border-ink/[0.06] pt-5 text-sm leading-7 text-ink-soft">
              <p className="font-semibold text-ink">لماذا ينجح؟</p>
              <p className="mt-1">لأن الطالبة تكتشف القاعدة بنفسها من موقف واقعي، وتسمع المعلمة صوت كل طالبة عبر الإجابات الرقمية، لا صوت المتطوعات فقط.</p>
            </div>
          </aside>
        </div>
      </Section>

      <Section id="apply" num={4} title="مساحة التطبيق">
        <ApplySpace
          track="interactive"
          instructions="اختاري درسًا من مقررك، وصممي جزءًا تفاعليًا منه باستخدام برنامج أو أداة مناسبة، ثم شاركينا تطبيقك"
          hints={[
            "يكفي جزء واحد من الدرس: تهيئة، أو نشاط، أو ختام.",
            "ارفعي لقطة شاشة لتصميمك أو ملفه، أو ضعي رابط النشاط.",
            "اكتبي في الوصف كيف ستتفاعل الطالبات معه.",
          ]}
        />
      </Section>

      <TrackGallery track="interactive" />
      <TrackSwitch current="interactive" />
    </Shell>
  );
}
