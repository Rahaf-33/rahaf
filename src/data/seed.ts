import type {
  AssemblyPoint, ClassRoom, Exit, Floor, SafetyProcedure, SchoolInfo, Sensor, Student, Teacher, User, Zone,
} from '@/types';
import { mulberry32 } from '@/lib/random';

/* ------------------------------------------------------------------ */
/*  جميع البيانات في هذا الملف تجريبية (Demo) ولا تمثل مدرسة حقيقية.     */
/* ------------------------------------------------------------------ */

export const SCHOOL: SchoolInfo = {
  name: 'الثانوية النموذجية للبنات (مدرسة تجريبية)',
  district: 'مكتب التعليم – القطاع الشمالي (افتراضي)',
  principal: 'أ. هيفاء السبيعي',
  safetyOfficer: 'أ. منيرة الدوسري',
  phone: '0110000000',
  address: 'عنوان افتراضي لأغراض العرض',
  shift: 'الفترة الصباحية 6:45 – 12:30',
};

export const FLOORS: Floor[] = [
  { id: 'G', name: 'الطابق الأرضي', level: 0 },
  { id: 'F1', name: 'الطابق الأول', level: 1 },
  { id: 'F2', name: 'الطابق الثاني', level: 2 },
];

export const ASSEMBLY_POINTS: AssemblyPoint[] = [
  { id: 'AP-A', name: 'نقطة التجمع (أ)', description: 'الساحة الأمامية – شرق المبنى' },
  { id: 'AP-B', name: 'نقطة التجمع (ب)', description: 'الملعب الخلفي – غرب المبنى' },
];

/* Floor plan geometry – viewBox 1000 x 520 (RTL: east = left side of the drawing) */
const TOP = { y: 30, h: 170 };
const BOT = { y: 310, h: 180 };
const COLS = [
  { x: 30, w: 200 },
  { x: 240, w: 200 },
  { x: 450, w: 100 },
  { x: 560, w: 200 },
  { x: 770, w: 200 },
];

interface RoomDef { name: string; kind: Zone['kind']; classKey?: string; capacity?: number }
const LAYOUT: Record<string, { top: RoomDef[]; bottom: RoomDef[] }> = {
  G: {
    top: [
      { name: 'فصل 1/4', kind: 'classroom', classKey: '1-4' },
      { name: 'فصل 1/3', kind: 'classroom', classKey: '1-3' },
      { name: 'الدرج الرئيسي', kind: 'stairs' },
      { name: 'فصل 1/2', kind: 'classroom', classKey: '1-2' },
      { name: 'فصل 1/1', kind: 'classroom', classKey: '1-1' },
    ],
    bottom: [
      { name: 'المقصف المدرسي', kind: 'service', capacity: 60 },
      { name: 'العيادة المدرسية', kind: 'clinic', capacity: 8 },
      { name: 'دورات المياه', kind: 'service', capacity: 12 },
      { name: 'الإدارة المدرسية', kind: 'admin', capacity: 15 },
      { name: 'المسرح المدرسي', kind: 'hall', capacity: 120 },
    ],
  },
  F1: {
    top: [
      { name: 'فصل 2/4', kind: 'classroom', classKey: '2-4' },
      { name: 'فصل 2/3', kind: 'classroom', classKey: '2-3' },
      { name: 'درج الطابق الأول', kind: 'stairs' },
      { name: 'فصل 2/2', kind: 'classroom', classKey: '2-2' },
      { name: 'فصل 2/1', kind: 'classroom', classKey: '2-1' },
    ],
    bottom: [
      { name: 'قاعة النشاط', kind: 'hall', capacity: 50 },
      { name: 'مختبر الحاسب', kind: 'lab', capacity: 30 },
      { name: 'دورات مياه الأول', kind: 'service', capacity: 12 },
      { name: 'مركز مصادر التعلم', kind: 'library', capacity: 40 },
      { name: 'مختبر العلوم', kind: 'lab', capacity: 30 },
    ],
  },
  F2: {
    top: [
      { name: 'فصل 3/4', kind: 'classroom', classKey: '3-4' },
      { name: 'فصل 3/3', kind: 'classroom', classKey: '3-3' },
      { name: 'درج الطابق الثاني', kind: 'stairs' },
      { name: 'فصل 3/2', kind: 'classroom', classKey: '3-2' },
      { name: 'فصل 3/1', kind: 'classroom', classKey: '3-1' },
    ],
    bottom: [
      { name: 'المصلى', kind: 'hall', capacity: 150 },
      { name: 'مستودع الوسائل', kind: 'service', capacity: 4 },
      { name: 'دورات مياه الثاني', kind: 'service', capacity: 12 },
      { name: 'غرفة المعلمات', kind: 'admin', capacity: 25 },
      { name: 'مختبر الأحياء', kind: 'lab', capacity: 30 },
    ],
  },
};

export const ZONES: Zone[] = [];
for (const floor of FLOORS) {
  const lay = LAYOUT[floor.id];
  lay.top.forEach((r, i) => {
    ZONES.push({
      id: `${floor.id}-T${i}`, name: r.name, floorId: floor.id, kind: r.kind,
      x: COLS[i].x, y: TOP.y, w: COLS[i].w, h: TOP.h,
      classId: r.classKey ? `C${r.classKey}` : undefined, capacity: r.capacity ?? 32,
    });
  });
  lay.bottom.forEach((r, i) => {
    ZONES.push({
      id: `${floor.id}-B${i}`, name: r.name, floorId: floor.id, kind: r.kind,
      x: COLS[i].x, y: BOT.y, w: COLS[i].w, h: BOT.h, capacity: r.capacity ?? 30,
    });
  });
  ZONES.push({
    id: `${floor.id}-COR`, name: `ممر ${floor.name}`, floorId: floor.id, kind: 'corridor',
    x: 30, y: 210, w: 940, h: 90, capacity: 80,
  });
}

export const EXITS: Exit[] = [
  { id: 'EX-G-E', name: 'المخرج الرئيسي (شرق)', floorId: 'G', x: 12, y: 255, assemblyPointId: 'AP-A', kind: 'main' },
  { id: 'EX-G-W', name: 'مخرج الطوارئ (غرب)', floorId: 'G', x: 988, y: 255, assemblyPointId: 'AP-B', kind: 'emergency' },
  { id: 'EX-F1-E', name: 'درج الطوارئ الشرقي', floorId: 'F1', x: 12, y: 255, assemblyPointId: 'AP-A', kind: 'stairs' },
  { id: 'EX-F1-W', name: 'درج الطوارئ الغربي', floorId: 'F1', x: 988, y: 255, assemblyPointId: 'AP-B', kind: 'stairs' },
  { id: 'EX-F2-E', name: 'درج الطوارئ الشرقي', floorId: 'F2', x: 12, y: 255, assemblyPointId: 'AP-A', kind: 'stairs' },
  { id: 'EX-F2-W', name: 'درج الطوارئ الغربي', floorId: 'F2', x: 988, y: 255, assemblyPointId: 'AP-B', kind: 'stairs' },
];

const TEACHER_NAMES: [string, string][] = [
  ['أ. نوف القحطاني', 'اللغة العربية'],
  ['أ. ريم الشهري', 'الرياضيات'],
  ['أ. أمل الغامدي', 'الكيمياء'],
  ['أ. سارة الزهراني', 'اللغة الإنجليزية'],
  ['أ. هند المطيري', 'الفيزياء'],
  ['أ. منال الحربي', 'الأحياء'],
  ['أ. نورة العتيبي', 'الدراسات الإسلامية'],
  ['أ. لطيفة العنزي', 'الحاسب الآلي'],
  ['أ. عبير الشمري', 'الاجتماعيات'],
  ['أ. وفاء الدوسري', 'اللغة العربية'],
  ['أ. جواهر السهلي', 'الرياضيات'],
  ['أ. مها البقمي', 'التربية الأسرية'],
];

const CLASS_SIZES = [26, 25, 27, 24, 26, 25, 25, 27, 24, 26, 25, 26];
export const CLASSES: ClassRoom[] = [];
export const TEACHERS: Teacher[] = [];
let idx = 0;
for (let g = 1; g <= 3; g++) {
  for (let s = 1; s <= 4; s++) {
    const key = `${g}-${s}`;
    const zone = ZONES.find((z) => z.classId === `C${key}`)!;
    const tId = `T${idx + 1}`;
    CLASSES.push({
      id: `C${key}`,
      name: `${g}/${s}`,
      grade: g === 1 ? 'الأول الثانوي' : g === 2 ? 'الثاني الثانوي' : 'الثالث الثانوي',
      floorId: zone.floorId,
      zoneId: zone.id,
      teacherId: tId,
      assemblyPointId: s <= 2 ? 'AP-A' : 'AP-B',
    });
    TEACHERS.push({
      id: tId, name: TEACHER_NAMES[idx][0], subject: TEACHER_NAMES[idx][1], classId: `C${key}`,
      phone: `05000000${String(idx + 10)}`,
    });
    idx++;
  }
}

const FIRST = [
  'لمى', 'جود', 'رهف', 'ريما', 'شهد', 'غلا', 'دانة', 'لين', 'ليان', 'جنى', 'رغد', 'أسيل', 'وعد', 'هيا', 'نوف', 'ميار',
  'العنود', 'الجوهرة', 'بشاير', 'تالا', 'حلا', 'رزان', 'روان', 'سديم', 'سلمى', 'شوق', 'عهد', 'فرح', 'لجين', 'مرام',
  'منيرة', 'ندى', 'نجود', 'نورة', 'هتان', 'وجد', 'يارا', 'أريج', 'بيان', 'جمانة', 'دلال', 'رنا', 'سارة', 'شذى', 'غدير',
  'لولوة', 'مشاعل', 'نوال', 'هديل', 'ولاء', 'أفنان', 'آلاء', 'إيلاف', 'رتاج', 'ريناد', 'جوري', 'ديم', 'ملاك', 'تولين', 'سجى',
];
const FATHER = ['عبدالله', 'محمد', 'فهد', 'سعد', 'خالد', 'ناصر', 'سلطان', 'تركي', 'إبراهيم', 'عبدالعزيز', 'فيصل', 'ماجد', 'سعود', 'بندر', 'أحمد', 'عبدالرحمن'];
const FAMILY = [
  'القحطاني', 'العتيبي', 'الشهري', 'الغامدي', 'الزهراني', 'الدوسري', 'المطيري', 'الحربي', 'العنزي', 'الشمري', 'السبيعي',
  'البقمي', 'السهلي', 'العمري', 'المالكي', 'الرشيدي', 'الجهني', 'الأحمدي', 'اليامي', 'الثبيتي', 'الخالدي', 'القرني',
  'العسيري', 'الشهراني', 'التميمي', 'الفيفي', 'الحازمي', 'الصاعدي', 'الهاجري', 'المري',
];
const MEDICAL = ['ربو – تحمل بخاخًا', 'حساسية غذائية', 'سكري النوع الأول', 'صرع – تحت المتابعة', 'فقر دم'];

export function buildStudents(seed = 20261120): Student[] {
  const rnd = mulberry32(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const used = new Set<string>();
  const out: Student[] = [];
  CLASSES.forEach((c, ci) => {
    for (let i = 0; i < CLASS_SIZES[ci]; i++) {
      let name = '';
      do { name = `${pick(FIRST)} ${pick(FATHER)} ${pick(FAMILY)}`; } while (used.has(name));
      used.add(name);
      const r = rnd();
      const attendance = r < 0.06 ? 'absent' : r < 0.09 ? 'late' : 'present';
      out.push({
        id: `S${c.id.slice(1)}-${String(i + 1).padStart(2, '0')}`,
        name,
        classId: c.id,
        attendance,
        safety: 'unverified',
        medicalNote: rnd() < 0.07 ? pick(MEDICAL) : undefined,
      });
    }
  });
  // scripted scenario needs a known asthma case in 2/2
  const s22 = out.filter((s) => s.classId === 'C2-2' && s.attendance !== 'absent');
  if (s22[4]) s22[4].medicalNote = 'ربو – تحمل بخاخًا';
  return out;
}

export function buildSensors(): Sensor[] {
  const list: Sensor[] = [];
  let n = 1;
  const add = (s: Omit<Sensor, 'id' | 'reading' | 'triggered' | 'battery'> & { battery?: number }) =>
    { const { battery, ...rest } = s; list.push({ ...rest, id: `SN-${String(n++).padStart(3, '0')}`, reading: 0, triggered: false, battery: battery ?? 70 + ((n * 7) % 30) }); }

  for (const c of CLASSES) {
    add({ name: `عدّاد إشغال ${c.name}`, kind: 'occupancy', zoneId: c.zoneId, online: true });
  }
  for (const f of FLOORS) {
    add({ name: `كاميرا عدّ – ممر ${f.name}`, kind: 'camera', zoneId: `${f.id}-COR`, online: true });
    add({ name: `كاميرا عدّ – ${ZONES.find((z) => z.id === `${f.id}-T2`)!.name}`, kind: 'camera', zoneId: `${f.id}-T2`, online: f.id !== 'F2', battery: f.id === 'F2' ? 12 : undefined });
    add({ name: `كاشف دخان – ممر ${f.name}`, kind: 'smoke', zoneId: `${f.id}-COR`, online: true });
  }
  ZONES.filter((z) => z.kind === 'lab' || z.kind === 'service' || z.kind === 'hall').forEach((z) => {
    add({ name: `كاشف دخان – ${z.name}`, kind: 'smoke', zoneId: z.id, online: true });
  });
  add({ name: 'حساس حرارة – مختبر العلوم', kind: 'heat', zoneId: 'F1-B4', online: true });
  add({ name: 'حساس حرارة – المقصف المدرسي', kind: 'heat', zoneId: 'G-B0', online: true });
  for (const e of EXITS) {
    add({ name: `حساس باب – ${e.name} (${FLOORS.find((f) => f.id === e.floorId)!.name})`, kind: 'door', zoneId: `${e.floorId}-COR`, online: !(e.id === 'EX-F2-W') });
  }
  for (const ap of ASSEMBLY_POINTS) {
    add({ name: `كاميرا عدّ – ${ap.name}`, kind: 'camera', assemblyPointId: ap.id, online: true });
  }
  return list;
}

const DEMO_SOURCE = 'نموذج إجرائي للعرض – يجب استبداله بالدليل المعتمد من الجهة المختصة (إدارة التعليم / الدفاع المدني)';

export const PROCEDURES: SafetyProcedure[] = [
  {
    id: 'PR-FIRE', type: 'fire', title: 'إجراءات الاستجابة لحالة حريق', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'تفعيل جرس الإنذار وإبلاغ مسؤولة السلامة وقائدة المدرسة فورًا.',
      'إيقاف الدروس وبدء الإخلاء بهدوء عبر أقرب مخرج آمن وفق خطة الإخلاء المعتمدة.',
      'عدم استخدام المصاعد والابتعاد عن مصدر الدخان، والانخفاض قرب الأرض عند وجود دخان.',
      'تصطحب المعلمة سجل الحضور وتغلق باب الفصل دون قفله.',
      'التوجه إلى نقطة التجمع المخصصة للفصل والبقاء فيها.',
      'حصر الطالبات بالاسم ومطابقته بسجل الحضور، والإبلاغ عن أي نقص فورًا.',
      'عدم العودة إلى المبنى إلا بعد إذن الجهة المختصة.',
    ],
    roles: [
      { role: 'principal', action: 'إدارة غرفة العمليات ومتابعة اكتمال الحصر واتخاذ القرار.' },
      { role: 'safety', action: 'التحقق من خلو المناطق وتوجيه فرق الإخلاء والتواصل عبر القنوات الرسمية.' },
      { role: 'teacher', action: 'قيادة طالبات الفصل إلى نقطة التجمع وتأكيد سلامتهن بالاسم.' },
    ],
  },
  {
    id: 'PR-THREAT', type: 'external_threat', title: 'إجراءات الإيواء عند تهديد خارجي', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'إبلاغ قائدة المدرسة ومسؤولة السلامة بالتهديد فورًا.',
      'إبقاء الطالبات داخل الفصول وإغلاق الأبواب والنوافذ.',
      'الابتعاد عن النوافذ والأبواب والتزام الهدوء.',
      'التحقق من حضور الطالبات داخل الفصل وتأكيده عبر المنصة.',
      'عدم فتح الأبواب أو مغادرة المبنى إلا بتوجيه من قائدة المدرسة أو الجهات المختصة.',
      'التواصل مع الجهات المختصة عبر القنوات الرسمية المعتمدة فقط.',
    ],
    roles: [
      { role: 'principal', action: 'تقييم الموقف والتنسيق مع الجهات المختصة عبر القنوات الرسمية.' },
      { role: 'safety', action: 'التأكد من إغلاق المداخل ومتابعة المناطق المشتركة.' },
      { role: 'teacher', action: 'إبقاء الطالبات في الفصل وتأكيد وجودهن بالاسم.' },
    ],
  },
  {
    id: 'PR-EVAC', type: 'evacuation', title: 'إجراءات الإخلاء العام', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'إعلان الإخلاء عبر جرس الإنذار أو الإذاعة المدرسية.',
      'إخلاء الفصول والمرافق بانتظام عبر المسارات المحددة في خطة الإخلاء.',
      'مساعدة الطالبات ذوات الاحتياجات الخاصة وفق الخطة المعدة مسبقًا.',
      'التوجه إلى نقاط التجمع المحددة وعدم التجمع قرب المبنى.',
      'حصر الطالبات بالاسم ورفع النتيجة عبر المنصة.',
      'انتظار التعليمات قبل العودة أو الانصراف.',
    ],
    roles: [
      { role: 'principal', action: 'إصدار قرار الإخلاء ومتابعة الحصر.' },
      { role: 'safety', action: 'تفقد المرافق المشتركة ودورات المياه والتأكد من خلوها.' },
      { role: 'teacher', action: 'مرافقة الفصل وتأكيد سلامة الطالبات.' },
    ],
  },
  {
    id: 'PR-MED', type: 'medical', title: 'إجراءات الحالة الطارئة الصحية', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'استدعاء المسؤولة الصحية في المدرسة فورًا.',
      'عدم تحريك المصابة إلا عند وجود خطر مباشر في الموقع.',
      'تقديم الإسعافات الأولية من شخص مؤهل فقط.',
      'إبعاد بقية الطالبات عن موقع الحالة.',
      'التواصل مع ولي الأمر والجهات الصحية عبر القنوات المعتمدة.',
      'توثيق الحالة والوقت والإجراءات المتخذة.',
    ],
    roles: [
      { role: 'principal', action: 'متابعة الحالة والتواصل مع ولي الأمر.' },
      { role: 'safety', action: 'تأمين الموقع ومساندة المسؤولة الصحية.' },
      { role: 'teacher', action: 'الإبلاغ الفوري والبقاء مع بقية الطالبات.' },
    ],
  },
];

export const DEMO_USERS: User[] = [
  { id: 'U-P', name: SCHOOL.principal, role: 'principal', title: 'قائدة المدرسة' },
  { id: 'U-T', name: 'أ. نورة العتيبي', role: 'teacher', title: 'معلمة – رائدة فصل 2/3', teacherId: 'T7' },
  { id: 'U-S', name: SCHOOL.safetyOfficer, role: 'safety', title: 'مسؤولة الأمن والسلامة' },
  { id: 'U-A', name: 'م. دانة الحربي', role: 'admin', title: 'مديرة النظام' },
];

export const DEMO_ALERT_TEXTS: { label: string; text: string; source: string }[] = [
  {
    label: 'حريق في مختبر العلوم',
    source: 'بلاغ تجريبي – نظام إنذار الحريق (محاكاة)',
    text: 'عاجل: كاشف الدخان في مختبر العلوم بالطابق الأول رصد دخانًا كثيفًا مع رائحة احتراق. يلزم الإخلاء الفوري للمبنى.',
  },
  {
    label: 'شخص مشبوه قرب البوابة',
    source: 'بلاغ تجريبي – حارسة البوابة (محاكاة)',
    text: 'تم رصد شخص مشبوه يحاول الدخول من البوابة الخلفية، يرجى إغلاق الأبواب وإبقاء الطالبات داخل الفصول.',
  },
  {
    label: 'تسرب غاز في المقصف',
    source: 'بلاغ تجريبي – عاملة المقصف (محاكاة)',
    text: 'رائحة تسرب غاز في المقصف المدرسي بالطابق الأرضي، مطلوب إخلاء المنطقة ومغادرة المبنى.',
  },
  {
    label: 'حالة إغماء في المصلى',
    source: 'بلاغ تجريبي – معلمة مناوبة (محاكاة)',
    text: 'حالة إغماء لطالبة في المصلى بالطابق الثاني مع صعوبة في التنفس، نحتاج المسؤولة الصحية.',
  },
];
