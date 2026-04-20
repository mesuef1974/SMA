/**
 * الخطة الفصلية — رياضيات 1-1
 * الصف الحادي عشر — المسار الأدبي — دولة قطر
 * الفصل الدراسي الثاني — العام الدراسي 2025-2026
 *
 * المصدر: وزارة التربية والتعليم والتعليم العالي
 * رمز الوثيقة: ES-ESM.P3-4 | الإصدار 1 | 2024-05-30
 */

export interface WeekEntry {
  weekNumber: number;
  dateRange: string;
  lesson: string;
  lessonAr: string;
  notes?: string;
}

export interface SemesterUnit {
  unitNumber: number;
  titleAr: string;
  titleEn: string;
  weeks: WeekEntry[];
}

// ---------------------------------------------------------------------------
// الوحدة 4: الدوال وعلاقاتها البيانية
// ---------------------------------------------------------------------------

const unit4: SemesterUnit = {
  unitNumber: 4,
  titleAr: 'الدوال وعلاقاتها البيانية',
  titleEn: 'Functions and their Graphs',
  weeks: [
    {
      weekNumber: 1,
      dateRange: '2026/2/19–22',
      lesson: '4.3',
      lessonAr: '4.3 التردد والتطبيق',
    },
    {
      weekNumber: 2,
      dateRange: '2026/2/26–3/1',
      lesson: '4.4',
      lessonAr: '4.4 التردد والتطبيق (تتمة)',
    },
    {
      weekNumber: 3,
      dateRange: '2026/3/5–8',
      lesson: '4.4',
      lessonAr: '4.4 العمليات على الدوال',
    },
    {
      weekNumber: 4,
      dateRange: '2026/3/12–15',
      lesson: '4.4',
      lessonAr: '4.4 العمليات على الدوال (تتمة)',
    },
    // إجازة رمضان المبارك
    // إجازة عيد الفطر المبارك
    {
      weekNumber: 11,
      dateRange: '2026/4/13–17',
      lesson: 'مراجعة',
      lessonAr: 'مراجعة اختبار منتصف الفصل الدراسي الثاني',
      notes: 'مراجعة',
    },
    {
      weekNumber: 12,
      dateRange: '2026/4/20–24',
      lesson: 'مراجعة',
      lessonAr: 'مراجعة اختبار منتصف الفصل الدراسي الثاني',
      notes: 'مراجعة',
    },
    {
      weekNumber: 13,
      dateRange: '2026/4/27–5/1',
      lesson: 'مراجعة',
      lessonAr: 'مراجعة اختبار منتصف الفصل الدراسي الثاني',
      notes: 'مراجعة',
    },
    // إجازة نهاية أسبوع مطولة
    {
      weekNumber: 15,
      dateRange: '2026/5/10–14',
      lesson: '4.6',
      lessonAr: '4.6 الدوال العكسية',
    },
    {
      weekNumber: 16,
      dateRange: '2026/5/17–21',
      lesson: '4.6',
      lessonAr: '4.6 الدوال العكسية (تتمة)',
    },
    {
      weekNumber: 17,
      dateRange: '2026/5/24–28',
      lesson: 'اختبار',
      lessonAr: 'اختبار نهاية الفصل الدراسي الثاني',
      notes: 'اختبار',
    },
  ],
};

// ---------------------------------------------------------------------------
// الوحدة 5: الإحصاء
// ---------------------------------------------------------------------------

const unit5: SemesterUnit = {
  unitNumber: 5,
  titleAr: 'الإحصاء',
  titleEn: 'Statistics',
  weeks: [
    {
      weekNumber: 1,
      dateRange: '2026/4/26–30',
      lesson: '5.1',
      lessonAr: '5.1 مقارنة مجموعات البيانات',
    },
    {
      weekNumber: 2,
      dateRange: '2026/5/3–7',
      lesson: '5.3',
      lessonAr: '5.3 قصور أشكال تمثيل البيانات',
    },
    {
      weekNumber: 3,
      dateRange: '2026/5/3–7',
      lesson: '5.3',
      lessonAr: '5.3 قصور أشكال تمثيل البيانات (تتمة)',
    },
    {
      weekNumber: 4,
      dateRange: '2026/5/10–14',
      lesson: '5.3',
      lessonAr: '5.3 قصور أشكال تمثيل البيانات (تتمة)',
    },
    {
      weekNumber: 5,
      dateRange: '2026/5/17–21',
      lesson: '5.6',
      lessonAr: '5.6 التوزيع الطبيعي',
    },
    {
      weekNumber: 6,
      dateRange: '2026/5/21–31',
      lesson: '5.6',
      lessonAr: '5.6 التوزيع الطبيعي (تتمة)',
      notes: 'إجازة عيد الأضحى المبارك',
    },
    {
      weekNumber: 7,
      dateRange: '2026/5/31–6/4',
      lesson: 'مراجعة',
      lessonAr: 'مراجعة نهاية الفصل الدراسي الثاني',
      notes: 'مراجعة',
    },
    {
      weekNumber: 8,
      dateRange: '2026/6/7–11',
      lesson: 'مراجعة',
      lessonAr: 'مراجعة نهاية الفصل الدراسي الثاني',
      notes: 'مراجعة',
    },
  ],
};

// ---------------------------------------------------------------------------
// الدروس الإثرائية
// ---------------------------------------------------------------------------

export const enrichmentLessons = [
  '3-5 الدوال والعلاقات (إثرائي)',
  '3-6 دمج الدوال (إثرائي)',
  '4.5 الدوال الكسرية (إثرائي)',
  '5.5 معادلة الدالة الجيبية للتقريب (إثرائي)',
];

// ---------------------------------------------------------------------------
// الخطة الكاملة
// ---------------------------------------------------------------------------

export const SEMESTER_PLAN_Q2_2025_26 = {
  semester: 2,
  academicYear: '2025-2026',
  subject: 'رياضيات 1-1',
  grade: 'الصف الحادي عشر',
  track: 'المسار الأدبي',
  country: 'قطر',
  startDate: '2026-02-19',
  endDate: '2026-06-16',
  finalExamPeriod: '2026-06-04 إلى 2026-06-16',
  documentCode: 'ES-ESM.P3-4',
  units: [unit4, unit5],
  enrichmentLessons,
  importantNotes: [
    'يُسمح باستخدام الآلة الحاسبة الجرافيكية في التدريس وفي الاختبارات',
    'الدروس الإثرائية اختيارية ولا يُسأل عنها في الاختبارات',
    'إجازة رمضان المبارك: منتصف مارس 2026',
    'إجازة عيد الفطر المبارك: نهاية مارس / بداية أبريل 2026',
    'إجازة عيد الأضحى المبارك: أواخر مايو 2026',
  ],
} as const;

// ---------------------------------------------------------------------------
// Helper: build semester plan block for the AI system prompt
// ---------------------------------------------------------------------------

export function buildSemesterPlanBlock(): string {
  const { units, importantNotes, finalExamPeriod } = SEMESTER_PLAN_Q2_2025_26;

  const unitsBlock = units
    .map((unit) => {
      const weeksBlock = unit.weeks
        .filter((w) => !w.notes?.includes('اختبار') && !w.notes?.includes('مراجعة'))
        .map((w) => `    - الأسبوع ${w.weekNumber} (${w.dateRange}): ${w.lessonAr}`)
        .join('\n');
      return `  الوحدة ${unit.unitNumber}: ${unit.titleAr}\n${weeksBlock}`;
    })
    .join('\n\n');

  const notesBlock = importantNotes.map((n) => `  - ${n}`).join('\n');

  return `<weekly_pacing>
ملخّص محلي للوتيرة الأسبوعية — مُستخرج من الخطة الفصلية الرسمية (انظر <semester_plan> للمصدر الكامل).
المادة: رياضيات 1-1 | الصف الحادي عشر | المسار الأدبي | قطر | الفصل الثاني 2025-2026

الدروس المقررة حسب الأسابيع:
${unitsBlock}

اختبار نهاية الفصل: ${finalExamPeriod}

ملاحظات مهمة:
${notesBlock}
</weekly_pacing>`;
}
