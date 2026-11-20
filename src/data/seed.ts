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
  principal: 'أ. رهف العمري',
  safetyOfficer: 'أ. منيرة الدوسري',
  phone: '0110000000',
  address: 'عنوان افتراضي لأغراض العرض',
  shift: 'الفترة الصباحية 6:45 – 12:30',
  en: {
    name: 'Model Girls Secondary School (Demo School)',
    district: 'Education Office – Northern Sector (fictional)',
    principal: 'Ms. Rahaf Al-Omari',
    safetyOfficer: 'Ms. Munira Al-Dosari',
    address: 'Fictional address for demo purposes',
    shift: 'Morning shift 6:45 – 12:30',
  },
};

export const FLOORS: Floor[] = [
  { id: 'G', name: 'الطابق الأرضي', nameEn: 'Ground Floor', level: 0 },
  { id: 'F1', name: 'الطابق الأول', nameEn: 'First Floor', level: 1 },
  { id: 'F2', name: 'الطابق الثاني', nameEn: 'Second Floor', level: 2 },
];

export const ASSEMBLY_POINTS: AssemblyPoint[] = [
  { id: 'AP-A', name: 'نقطة التجمع (أ)', nameEn: 'Assembly Point A', description: 'الساحة الأمامية – شرق المبنى', descriptionEn: 'Front yard – east of the building' },
  { id: 'AP-B', name: 'نقطة التجمع (ب)', nameEn: 'Assembly Point B', description: 'الملعب الخلفي – غرب المبنى', descriptionEn: 'Back playground – west of the building' },
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

interface RoomDef { name: string; en?: string; kind: Zone['kind']; classKey?: string; capacity?: number }
const LAYOUT: Record<string, { top: RoomDef[]; bottom: RoomDef[] }> = {
  G: {
    top: [
      { name: 'فصل 1/4', en: 'Class 1/4', kind: 'classroom', classKey: '1-4' },
      { name: 'فصل 1/3', en: 'Class 1/3', kind: 'classroom', classKey: '1-3' },
      { name: 'الدرج الرئيسي', en: "Main Stairs", kind: 'stairs' },
      { name: 'فصل 1/2', en: 'Class 1/2', kind: 'classroom', classKey: '1-2' },
      { name: 'فصل 1/1', en: 'Class 1/1', kind: 'classroom', classKey: '1-1' },
    ],
    bottom: [
      { name: 'المقصف المدرسي', en: "Cafeteria", kind: 'service', capacity: 60 },
      { name: 'العيادة المدرسية', en: "School Clinic", kind: 'clinic', capacity: 8 },
      { name: 'دورات المياه', en: "Restrooms", kind: 'service', capacity: 12 },
      { name: 'الإدارة المدرسية', en: "Administration", kind: 'admin', capacity: 15 },
      { name: 'المسرح المدرسي', en: "School Theater", kind: 'hall', capacity: 120 },
    ],
  },
  F1: {
    top: [
      { name: 'فصل 2/4', en: 'Class 2/4', kind: 'classroom', classKey: '2-4' },
      { name: 'فصل 2/3', en: 'Class 2/3', kind: 'classroom', classKey: '2-3' },
      { name: 'درج الطابق الأول', en: "First Floor Stairs", kind: 'stairs' },
      { name: 'فصل 2/2', en: 'Class 2/2', kind: 'classroom', classKey: '2-2' },
      { name: 'فصل 2/1', en: 'Class 2/1', kind: 'classroom', classKey: '2-1' },
    ],
    bottom: [
      { name: 'قاعة النشاط', en: "Activity Hall", kind: 'hall', capacity: 50 },
      { name: 'مختبر الحاسب', en: "Computer Lab", kind: 'lab', capacity: 30 },
      { name: 'دورات مياه الأول', en: "First Floor Restrooms", kind: 'service', capacity: 12 },
      { name: 'مركز مصادر التعلم', en: "Learning Resource Center", kind: 'library', capacity: 40 },
      { name: 'مختبر العلوم', en: "Science Lab", kind: 'lab', capacity: 30 },
    ],
  },
  F2: {
    top: [
      { name: 'فصل 3/4', en: 'Class 3/4', kind: 'classroom', classKey: '3-4' },
      { name: 'فصل 3/3', en: 'Class 3/3', kind: 'classroom', classKey: '3-3' },
      { name: 'درج الطابق الثاني', en: "Second Floor Stairs", kind: 'stairs' },
      { name: 'فصل 3/2', en: 'Class 3/2', kind: 'classroom', classKey: '3-2' },
      { name: 'فصل 3/1', en: 'Class 3/1', kind: 'classroom', classKey: '3-1' },
    ],
    bottom: [
      { name: 'المصلى', en: "Prayer Hall", kind: 'hall', capacity: 150 },
      { name: 'مستودع الوسائل', en: "Supplies Storage", kind: 'service', capacity: 4 },
      { name: 'دورات مياه الثاني', en: "Second Floor Restrooms", kind: 'service', capacity: 12 },
      { name: 'غرفة المعلمات', en: "Teachers' Lounge", kind: 'admin', capacity: 25 },
      { name: 'مختبر الأحياء', en: "Biology Lab", kind: 'lab', capacity: 30 },
    ],
  },
};

export const ZONES: Zone[] = [];
for (const floor of FLOORS) {
  const lay = LAYOUT[floor.id];
  lay.top.forEach((r, i) => {
    ZONES.push({
      id: `${floor.id}-T${i}`, name: r.name, nameEn: r.en, floorId: floor.id, kind: r.kind,
      x: COLS[i].x, y: TOP.y, w: COLS[i].w, h: TOP.h,
      classId: r.classKey ? `C${r.classKey}` : undefined, capacity: r.capacity ?? 32,
    });
  });
  lay.bottom.forEach((r, i) => {
    ZONES.push({
      id: `${floor.id}-B${i}`, name: r.name, nameEn: r.en, floorId: floor.id, kind: r.kind,
      x: COLS[i].x, y: BOT.y, w: COLS[i].w, h: BOT.h, capacity: r.capacity ?? 30,
    });
  });
  ZONES.push({
    id: `${floor.id}-COR`, name: `ممر ${floor.name}`, nameEn: `${floor.nameEn} Corridor`, floorId: floor.id, kind: 'corridor',
    x: 30, y: 210, w: 940, h: 90, capacity: 80,
  });
}

export const EXITS: Exit[] = [
  { id: 'EX-G-E', name: 'المخرج الرئيسي (شرق)', nameEn: 'Main Exit (East)', floorId: 'G', x: 12, y: 255, assemblyPointId: 'AP-A', kind: 'main' },
  { id: 'EX-G-W', name: 'مخرج الطوارئ (غرب)', nameEn: 'Emergency Exit (West)', floorId: 'G', x: 988, y: 255, assemblyPointId: 'AP-B', kind: 'emergency' },
  { id: 'EX-F1-E', name: 'درج الطوارئ الشرقي', nameEn: 'East Emergency Stairs', floorId: 'F1', x: 12, y: 255, assemblyPointId: 'AP-A', kind: 'stairs' },
  { id: 'EX-F1-W', name: 'درج الطوارئ الغربي', nameEn: 'West Emergency Stairs', floorId: 'F1', x: 988, y: 255, assemblyPointId: 'AP-B', kind: 'stairs' },
  { id: 'EX-F2-E', name: 'درج الطوارئ الشرقي', nameEn: 'East Emergency Stairs', floorId: 'F2', x: 12, y: 255, assemblyPointId: 'AP-A', kind: 'stairs' },
  { id: 'EX-F2-W', name: 'درج الطوارئ الغربي', nameEn: 'West Emergency Stairs', floorId: 'F2', x: 988, y: 255, assemblyPointId: 'AP-B', kind: 'stairs' },
];

const TEACHER_NAMES: [string, string, string, string][] = [
  ['أ. دانة فارس', 'اللغة العربية', 'Ms. Dana Fares', 'Arabic'],
  ['أ. ريم الشهري', 'الرياضيات', 'Ms. Reem Al-Shehri', 'Mathematics'],
  ['أ. ميرال بندر', 'الكيمياء', 'Ms. Meral Bandar', 'Chemistry'],
  ['أ. سارة الزهراني', 'اللغة الإنجليزية', 'Ms. Sara Al-Zahrani', 'English'],
  ['أ. هند المطيري', 'الفيزياء', 'Ms. Hind Al-Mutairi', 'Physics'],
  ['أ. مشاعل فايز', 'الأحياء', 'Ms. Mashael Fayez', 'Biology'],
  ['أ. وعد محمد', 'الدراسات الإسلامية', 'Ms. Waad Mohammed', 'Islamic Studies'],
  ['أ. لطيفة العنزي', 'الحاسب الآلي', 'Ms. Latifa Al-Anazi', 'Computer Science'],
  ['أ. عبير الشمري', 'الاجتماعيات', 'Ms. Abeer Al-Shammari', 'Social Studies'],
  ['أ. وفاء الدوسري', 'اللغة العربية', 'Ms. Wafa Al-Dosari', 'Arabic'],
  ['أ. جواهر السهلي', 'الرياضيات', 'Ms. Jawaher Al-Sahli', 'Mathematics'],
  ['أ. مها البقمي', 'التربية الأسرية', 'Ms. Maha Al-Baqami', 'Home Economics'],
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
      id: tId, name: TEACHER_NAMES[idx][0], subject: TEACHER_NAMES[idx][1], nameEn: TEACHER_NAMES[idx][2], subjectEn: TEACHER_NAMES[idx][3], classId: `C${key}`,
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
const FIRST_EN = [
  'Lama', 'Jood', 'Rahaf', 'Reema', 'Shahad', 'Ghala', 'Dana', 'Leen', 'Layan', 'Jana', 'Raghad', 'Aseel', 'Waad', 'Haya', 'Nouf', 'Mayar',
  'Alanoud', 'Aljawhara', 'Bashayer', 'Tala', 'Hala', 'Razan', 'Rawan', 'Sadeem', 'Salma', 'Shouq', 'Ahd', 'Farah', 'Lujain', 'Maram',
  'Munira', 'Nada', 'Nujood', 'Noura', 'Hattan', 'Wajd', 'Yara', 'Areej', 'Bayan', 'Jumana', 'Dalal', 'Rana', 'Sara', 'Shatha', 'Ghadeer',
  'Lulwa', 'Mashael', 'Nawal', 'Hadeel', 'Walaa', 'Afnan', 'Alaa', 'Elaf', 'Retaj', 'Renad', 'Jouri', 'Deem', 'Malak', 'Toleen', 'Saja',
];
const FATHER_EN = ['Abdullah', 'Mohammed', 'Fahad', 'Saad', 'Khalid', 'Nasser', 'Sultan', 'Turki', 'Ibrahim', 'Abdulaziz', 'Faisal', 'Majed', 'Saud', 'Bandar', 'Ahmed', 'Abdulrahman'];
const FAMILY_EN = [
  'Al-Qahtani', 'Al-Otaibi', 'Al-Shehri', 'Al-Ghamdi', 'Al-Zahrani', 'Al-Dosari', 'Al-Mutairi', 'Al-Harbi', 'Al-Anazi', 'Al-Shammari', 'Al-Subaie',
  'Al-Baqami', 'Al-Sahli', 'Al-Omari', 'Al-Malki', 'Al-Rashidi', 'Al-Juhani', 'Al-Ahmadi', 'Al-Yami', 'Al-Thubaiti', 'Al-Khalidi', 'Al-Qarni',
  'Al-Asiri', 'Al-Shahrani', 'Al-Tamimi', 'Al-Faifi', 'Al-Hazmi', 'Al-Saedi', 'Al-Hajri', 'Al-Marri',
];
const MEDICAL = ['ربو – تحمل بخاخًا', 'حساسية غذائية', 'سكري النوع الأول', 'صرع – تحت المتابعة', 'فقر دم'];
const MEDICAL_EN = ['Asthma – carries an inhaler', 'Food allergy', 'Type 1 diabetes', 'Epilepsy – under follow-up', 'Anemia'];

export function buildStudents(seed = 20261120): Student[] {
  const rnd = mulberry32(seed);
  const idxOf = (len: number) => Math.floor(rnd() * len);
  const used = new Set<string>();
  const out: Student[] = [];
  CLASSES.forEach((c, ci) => {
    for (let i = 0; i < CLASS_SIZES[ci]; i++) {
      let name = '';
      let nameEn = '';
      do {
        const a = idxOf(FIRST.length), b = idxOf(FATHER.length), d = idxOf(FAMILY.length);
        name = `${FIRST[a]} ${FATHER[b]} ${FAMILY[d]}`;
        nameEn = `${FIRST_EN[a]} ${FATHER_EN[b]} ${FAMILY_EN[d]}`;
      } while (used.has(name));
      used.add(name);
      const r = rnd();
      const attendance = r < 0.06 ? 'absent' : r < 0.09 ? 'late' : 'present';
      const med = rnd() < 0.07 ? idxOf(MEDICAL.length) : -1;
      out.push({
        id: `S${c.id.slice(1)}-${String(i + 1).padStart(2, '0')}`,
        name,
        nameEn,
        classId: c.id,
        attendance,
        safety: 'unverified',
        medicalNote: med >= 0 ? MEDICAL[med] : undefined,
        medicalNoteEn: med >= 0 ? MEDICAL_EN[med] : undefined,
      });
    }
  });
  // scripted scenario needs a known asthma case in 2/2
  const s22 = out.filter((s) => s.classId === 'C2-2' && s.attendance !== 'absent');
  if (s22[4]) { s22[4].medicalNote = MEDICAL[0]; s22[4].medicalNoteEn = MEDICAL_EN[0]; }
  return out;
}

export function buildSensors(): Sensor[] {
  const list: Sensor[] = [];
  let n = 1;
  const add = (s: Omit<Sensor, 'id' | 'reading' | 'triggered' | 'battery'> & { battery?: number }) =>
    { const { battery, ...rest } = s; list.push({ ...rest, id: `SN-${String(n++).padStart(3, '0')}`, reading: 0, triggered: false, battery: battery ?? 70 + ((n * 7) % 30) }); }

  for (const c of CLASSES) {
    add({ name: `عدّاد إشغال ${c.name}`, nameEn: `Occupancy counter ${c.name}`, kind: 'occupancy', zoneId: c.zoneId, online: true });
  }
  for (const f of FLOORS) {
    add({ name: `كاميرا عدّ – ممر ${f.name}`, nameEn: `Counting camera – ${f.nameEn} Corridor`, kind: 'camera', zoneId: `${f.id}-COR`, online: true });
    add({ name: `كاميرا عدّ – ${ZONES.find((z) => z.id === `${f.id}-T2`)!.name}`, nameEn: `Counting camera – ${ZONES.find((z) => z.id === `${f.id}-T2`)!.nameEn}`, kind: 'camera', zoneId: `${f.id}-T2`, online: f.id !== 'F2', battery: f.id === 'F2' ? 12 : undefined });
    add({ name: `كاشف دخان – ممر ${f.name}`, nameEn: `Smoke detector – ${f.nameEn} Corridor`, kind: 'smoke', zoneId: `${f.id}-COR`, online: true });
  }
  ZONES.filter((z) => z.kind === 'lab' || z.kind === 'service' || z.kind === 'hall').forEach((z) => {
    add({ name: `كاشف دخان – ${z.name}`, nameEn: `Smoke detector – ${z.nameEn}`, kind: 'smoke', zoneId: z.id, online: true });
  });
  add({ name: 'حساس حرارة – مختبر العلوم', nameEn: 'Heat sensor – Science Lab', kind: 'heat', zoneId: 'F1-B4', online: true });
  add({ name: 'حساس حرارة – المقصف المدرسي', nameEn: 'Heat sensor – Cafeteria', kind: 'heat', zoneId: 'G-B0', online: true });
  for (const e of EXITS) {
    add({ name: `حساس باب – ${e.name} (${FLOORS.find((f) => f.id === e.floorId)!.name})`, nameEn: `Door sensor – ${e.nameEn} (${FLOORS.find((f) => f.id === e.floorId)!.nameEn})`, kind: 'door', zoneId: `${e.floorId}-COR`, online: !(e.id === 'EX-F2-W') });
  }
  for (const ap of ASSEMBLY_POINTS) {
    add({ name: `كاميرا عدّ – ${ap.name}`, nameEn: `Counting camera – ${ap.nameEn}`, kind: 'camera', assemblyPointId: ap.id, online: true });
  }
  return list;
}

const DEMO_SOURCE = 'نموذج إجرائي للعرض – يجب استبداله بالدليل المعتمد من الجهة المختصة (إدارة التعليم / الدفاع المدني)';

export const PROCEDURES: SafetyProcedure[] = [
  {
    id: 'PR-FIRE', type: 'fire', title: 'إجراءات الاستجابة لحالة حريق', titleEn: 'Fire response procedure', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'تفعيل جرس الإنذار وإبلاغ مسؤولة السلامة وقائدة المدرسة فورًا.',
      'إيقاف الدروس وبدء الإخلاء بهدوء عبر أقرب مخرج آمن وفق خطة الإخلاء المعتمدة.',
      'عدم استخدام المصاعد والابتعاد عن مصدر الدخان، والانخفاض قرب الأرض عند وجود دخان.',
      'تصطحب المعلمة سجل الحضور وتغلق باب الفصل دون قفله.',
      'التوجه إلى نقطة التجمع المخصصة للفصل والبقاء فيها.',
      'حصر الطالبات بالاسم ومطابقته بسجل الحضور، والإبلاغ عن أي نقص فورًا.',
      'عدم العودة إلى المبنى إلا بعد إذن الجهة المختصة.',
    ],
    stepsEn: [
      'Sound the alarm and notify the safety officer and the principal immediately.',
      'Stop lessons and start a calm evacuation through the nearest safe exit according to the approved evacuation plan.',
      'Do not use elevators, keep away from the source of smoke, and stay low if there is smoke.',
      'The teacher takes the attendance register and closes the classroom door without locking it.',
      "Go to the class's assigned assembly point and stay there.",
      'Account for students by name against the attendance register and report any missing student immediately.',
      'Do not re-enter the building until the competent authority gives permission.',
    ],
    roles: [
      { role: 'principal', action: 'إدارة غرفة العمليات ومتابعة اكتمال الحصر واتخاذ القرار.', actionEn: 'Run the operations room, follow up on accountability and make decisions.' },
      { role: 'safety', action: 'التحقق من خلو المناطق وتوجيه فرق الإخلاء والتواصل عبر القنوات الرسمية.', actionEn: 'Verify areas are clear, direct evacuation teams and communicate through official channels.' },
      { role: 'teacher', action: 'قيادة طالبات الفصل إلى نقطة التجمع وتأكيد سلامتهن بالاسم.', actionEn: 'Lead the class to the assembly point and confirm each student by name.' },
    ],
  },
  {
    id: 'PR-THREAT', type: 'external_threat', title: 'إجراءات الإيواء عند تهديد خارجي', titleEn: 'Shelter-in-place procedure for external threats', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'إبلاغ قائدة المدرسة ومسؤولة السلامة بالتهديد فورًا.',
      'إبقاء الطالبات داخل الفصول وإغلاق الأبواب والنوافذ.',
      'الابتعاد عن النوافذ والأبواب والتزام الهدوء.',
      'التحقق من حضور الطالبات داخل الفصل وتأكيده عبر المنصة.',
      'عدم فتح الأبواب أو مغادرة المبنى إلا بتوجيه من قائدة المدرسة أو الجهات المختصة.',
      'التواصل مع الجهات المختصة عبر القنوات الرسمية المعتمدة فقط.',
    ],
    stepsEn: [
      'Report the threat to the principal and the safety officer immediately.',
      'Keep students inside classrooms and close doors and windows.',
      'Stay away from windows and doors and remain calm.',
      'Check that every student is in the classroom and confirm it on the platform.',
      'Do not open doors or leave the building unless directed by the principal or the competent authorities.',
      'Contact the competent authorities through approved official channels only.',
    ],
    roles: [
      { role: 'principal', action: 'تقييم الموقف والتنسيق مع الجهات المختصة عبر القنوات الرسمية.', actionEn: 'Assess the situation and coordinate with authorities through official channels.' },
      { role: 'safety', action: 'التأكد من إغلاق المداخل ومتابعة المناطق المشتركة.', actionEn: 'Make sure entrances are closed and monitor shared areas.' },
      { role: 'teacher', action: 'إبقاء الطالبات في الفصل وتأكيد وجودهن بالاسم.', actionEn: 'Keep students in the classroom and confirm their presence by name.' },
    ],
  },
  {
    id: 'PR-EVAC', type: 'evacuation', title: 'إجراءات الإخلاء العام', titleEn: 'General evacuation procedure', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'إعلان الإخلاء عبر جرس الإنذار أو الإذاعة المدرسية.',
      'إخلاء الفصول والمرافق بانتظام عبر المسارات المحددة في خطة الإخلاء.',
      'مساعدة الطالبات ذوات الاحتياجات الخاصة وفق الخطة المعدة مسبقًا.',
      'التوجه إلى نقاط التجمع المحددة وعدم التجمع قرب المبنى.',
      'حصر الطالبات بالاسم ورفع النتيجة عبر المنصة.',
      'انتظار التعليمات قبل العودة أو الانصراف.',
    ],
    stepsEn: [
      'Announce the evacuation using the alarm bell or the school PA system.',
      'Evacuate classrooms and facilities in order using the routes defined in the evacuation plan.',
      'Assist students with special needs according to the prepared plan.',
      'Go to the designated assembly points and do not gather near the building.',
      'Account for students by name and submit the result through the platform.',
      'Wait for instructions before returning or dismissal.',
    ],
    roles: [
      { role: 'principal', action: 'إصدار قرار الإخلاء ومتابعة الحصر.', actionEn: 'Issue the evacuation decision and follow up on accountability.' },
      { role: 'safety', action: 'تفقد المرافق المشتركة ودورات المياه والتأكد من خلوها.', actionEn: 'Check shared facilities and restrooms and make sure they are empty.' },
      { role: 'teacher', action: 'مرافقة الفصل وتأكيد سلامة الطالبات.', actionEn: 'Accompany the class and confirm students are safe.' },
    ],
  },
  {
    id: 'PR-MED', type: 'medical', title: 'إجراءات الحالة الطارئة الصحية', titleEn: 'Medical emergency procedure', version: '1.0-demo', source: DEMO_SOURCE,
    steps: [
      'استدعاء المسؤولة الصحية في المدرسة فورًا.',
      'عدم تحريك المصابة إلا عند وجود خطر مباشر في الموقع.',
      'تقديم الإسعافات الأولية من شخص مؤهل فقط.',
      'إبعاد بقية الطالبات عن موقع الحالة.',
      'التواصل مع ولي الأمر والجهات الصحية عبر القنوات المعتمدة.',
      'توثيق الحالة والوقت والإجراءات المتخذة.',
    ],
    stepsEn: [
      'Call the school health officer immediately.',
      'Do not move the injured student unless there is immediate danger at the location.',
      'First aid is given by a qualified person only.',
      'Keep other students away from the scene.',
      'Contact the guardian and health authorities through approved channels.',
      'Document the case, the time and the actions taken.',
    ],
    roles: [
      { role: 'principal', action: 'متابعة الحالة والتواصل مع ولي الأمر.', actionEn: 'Follow up on the case and contact the guardian.' },
      { role: 'safety', action: 'تأمين الموقع ومساندة المسؤولة الصحية.', actionEn: 'Secure the scene and support the health officer.' },
      { role: 'teacher', action: 'الإبلاغ الفوري والبقاء مع بقية الطالبات.', actionEn: 'Report immediately and stay with the other students.' },
    ],
  },
];

export const DEMO_USERS: User[] = [
  { id: 'U-P', name: SCHOOL.principal, nameEn: SCHOOL.en!.principal, role: 'principal', title: 'قائدة المدرسة', titleEn: 'School Principal' },
  { id: 'U-T', name: 'أ. وعد محمد', nameEn: 'Ms. Waad Mohammed', role: 'teacher', title: 'معلمة – رائدة فصل 2/3', titleEn: 'Teacher – Homeroom 2/3', teacherId: 'T7' },
  { id: 'U-S', name: SCHOOL.safetyOfficer, nameEn: SCHOOL.en!.safetyOfficer, role: 'safety', title: 'مسؤولة الأمن والسلامة', titleEn: 'Safety & Security Officer' },
  { id: 'U-A', name: 'م. دانة الحربي', nameEn: 'Eng. Dana Al-Harbi', role: 'admin', title: 'مديرة النظام', titleEn: 'System Administrator' },
];

export interface DemoAlert { label: string; labelEn: string; text: string; textEn: string; source: string; sourceEn: string }
export const DEMO_ALERT_TEXTS: DemoAlert[] = [
  {
    label: 'حريق في مختبر العلوم', labelEn: 'Fire in the Science Lab',
    source: 'بلاغ تجريبي – نظام إنذار الحريق (محاكاة)', sourceEn: 'Demo report – fire alarm system (simulated)',
    text: 'عاجل: كاشف الدخان في مختبر العلوم بالطابق الأول رصد دخانًا كثيفًا مع رائحة احتراق. يلزم الإخلاء الفوري للمبنى.',
    textEn: 'Urgent: the smoke detector in the Science Lab on the First Floor detected heavy smoke and a burning smell. Immediate evacuation of the building is required.',
  },
  {
    label: 'شخص مشبوه قرب البوابة', labelEn: 'Suspicious person near the gate',
    source: 'بلاغ تجريبي – حارسة البوابة (محاكاة)', sourceEn: 'Demo report – gate guard (simulated)',
    text: 'تم رصد شخص مشبوه يحاول الدخول من البوابة الخلفية، يرجى إغلاق الأبواب وإبقاء الطالبات داخل الفصول.',
    textEn: 'A suspicious person was seen trying to enter through the back gate. Please lock the doors and keep students inside classrooms.',
  },
  {
    label: 'تسرب غاز في المقصف', labelEn: 'Gas leak in the cafeteria',
    source: 'بلاغ تجريبي – عاملة المقصف (محاكاة)', sourceEn: 'Demo report – cafeteria staff (simulated)',
    text: 'رائحة تسرب غاز في المقصف المدرسي بالطابق الأرضي، مطلوب إخلاء المنطقة ومغادرة المبنى.',
    textEn: 'Smell of a gas leak in the Cafeteria on the Ground Floor. The area must be evacuated and everyone must leave the building.',
  },
  {
    label: 'حالة إغماء في المصلى', labelEn: 'Fainting case in the prayer hall',
    source: 'بلاغ تجريبي – معلمة مناوبة (محاكاة)', sourceEn: 'Demo report – teacher on duty (simulated)',
    text: 'حالة إغماء لطالبة في المصلى بالطابق الثاني مع صعوبة في التنفس، نحتاج المسؤولة الصحية.',
    textEn: 'A student fainted in the Prayer Hall on the Second Floor and has difficulty breathing. We need the health officer.',
  },
];
