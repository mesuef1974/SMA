/**
 * Mock data for the Teacher Dashboard.
 *
 * Contains realistic Grade 11 Literary track math data aligned to
 * Qatar's national curriculum (QNCF). All Arabic text uses natural
 * teacher-friendly phrasing. Do NOT connect to Supabase — these are
 * static fixtures for UI development only.
 */

import type { BloomLevel } from './bloom-keywords';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LessonStatus = 'draft' | 'in_review' | 'approved';
export type MisconceptionSeverity = 'high' | 'medium' | 'low';

export interface MockTeacher {
  id: string;
  name_ar: string;
  name_en: string;
  email: string;
  avatar?: string;
}

export interface MockChapter {
  id: string;
  number: number;
  title_ar: string;
  title_en: string;
}

export interface MockLesson {
  id: string;
  chapterId: string;
  number: number;
  title_ar: string;
  title_en: string;
  periods: number;
  bloomLevels: BloomLevel[];
}

export interface MockLessonPlan {
  id: string;
  lessonId: string;
  teacherId: string;
  status: LessonStatus;
  bloomLevels: BloomLevel[];
  /** ISO date string */
  scheduledDate?: string;
  /** 1-based period slot within the school day */
  periodSlot?: number;
  createdAt: string;
}

export interface MockMisconception {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  frequency: number;
  severity: MisconceptionSeverity;
  chapterId: string;
  detectedAt: string;
}

export interface MockStudentProgress {
  studentId: string;
  name_ar: string;
  completionRate: number;
  averageScore: number;
  lastActive: string;
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export const MOCK_TEACHERS: MockTeacher[] = [
  {
    id: 't1',
    name_ar: 'أحمد المنصوري',
    name_en: 'Ahmed Al-Mansoori',
    email: 'ahmed.mansoori@edu.qa',
  },
  {
    id: 't2',
    name_ar: 'فاطمة الكواري',
    name_en: 'Fatma Al-Kuwari',
    email: 'fatma.kuwari@edu.qa',
  },
  {
    id: 't3',
    name_ar: 'محمد الهاجري',
    name_en: 'Mohammed Al-Hajri',
    email: 'mohammed.hajri@edu.qa',
  },
];

// ---------------------------------------------------------------------------
// Chapters (Qatar Grade 11 Literary math curriculum)
// ---------------------------------------------------------------------------

export const MOCK_CHAPTERS: MockChapter[] = [
  { id: 'ch1', number: 1, title_ar: 'الدوال', title_en: 'Functions' },
  { id: 'ch2', number: 2, title_ar: 'الدوال المثلثية', title_en: 'Trigonometric Functions' },
  { id: 'ch3', number: 3, title_ar: 'المتتاليات والمتسلسلات', title_en: 'Sequences and Series' },
  { id: 'ch4', number: 4, title_ar: 'الإحصاء والاحتمالات', title_en: 'Statistics and Probability' },
  { id: 'ch5', number: 5, title_ar: 'الهندسة التحليلية', title_en: 'Analytic Geometry' },
];

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export const MOCK_LESSONS: MockLesson[] = [
  // Chapter 1: Functions
  {
    id: 'l1-1', chapterId: 'ch1', number: 1,
    title_ar: 'مفهوم الدالة ومجالها ومداها',
    title_en: 'Function concept, domain and range',
    periods: 2, bloomLevels: ['remember', 'understand'],
  },
  {
    id: 'l1-2', chapterId: 'ch1', number: 2,
    title_ar: 'العمليات على الدوال',
    title_en: 'Operations on functions',
    periods: 2, bloomLevels: ['apply', 'analyze'],
  },
  {
    id: 'l1-3', chapterId: 'ch1', number: 3,
    title_ar: 'تركيب الدوال والدالة العكسية',
    title_en: 'Composition and inverse functions',
    periods: 2, bloomLevels: ['apply', 'analyze', 'evaluate'],
  },

  // Chapter 2: Trigonometric Functions
  {
    id: 'l2-1', chapterId: 'ch2', number: 1,
    title_ar: 'الزوايا ووحدات القياس',
    title_en: 'Angles and units of measure',
    periods: 1, bloomLevels: ['remember', 'understand'],
  },
  {
    id: 'l2-2', chapterId: 'ch2', number: 2,
    title_ar: 'الدوال المثلثية الأساسية',
    title_en: 'Basic trigonometric functions',
    periods: 2, bloomLevels: ['understand', 'apply'],
  },
  {
    id: 'l2-3', chapterId: 'ch2', number: 3,
    title_ar: 'الرسم البياني للدوال المثلثية',
    title_en: 'Graphing trigonometric functions',
    periods: 2, bloomLevels: ['apply', 'analyze', 'create'],
  },
  {
    id: 'l2-4', chapterId: 'ch2', number: 4,
    title_ar: 'المتطابقات المثلثية',
    title_en: 'Trigonometric identities',
    periods: 2, bloomLevels: ['apply', 'evaluate'],
  },

  // Chapter 3: Sequences and Series
  {
    id: 'l3-1', chapterId: 'ch3', number: 1,
    title_ar: 'المتتاليات الحسابية',
    title_en: 'Arithmetic sequences',
    periods: 2, bloomLevels: ['remember', 'apply'],
  },
  {
    id: 'l3-2', chapterId: 'ch3', number: 2,
    title_ar: 'المتتاليات الهندسية',
    title_en: 'Geometric sequences',
    periods: 2, bloomLevels: ['understand', 'apply'],
  },
  {
    id: 'l3-3', chapterId: 'ch3', number: 3,
    title_ar: 'مجموع المتسلسلات',
    title_en: 'Sum of series',
    periods: 2, bloomLevels: ['apply', 'analyze', 'evaluate'],
  },

  // Chapter 4: Statistics and Probability
  {
    id: 'l4-1', chapterId: 'ch4', number: 1,
    title_ar: 'مقاييس النزعة المركزية',
    title_en: 'Measures of central tendency',
    periods: 2, bloomLevels: ['remember', 'apply'],
  },
  {
    id: 'l4-2', chapterId: 'ch4', number: 2,
    title_ar: 'مقاييس التشتت',
    title_en: 'Measures of dispersion',
    periods: 2, bloomLevels: ['understand', 'apply', 'analyze'],
  },
  {
    id: 'l4-3', chapterId: 'ch4', number: 3,
    title_ar: 'الاحتمالات والتوافيق',
    title_en: 'Probability and combinations',
    periods: 2, bloomLevels: ['apply', 'analyze'],
  },

  // Chapter 5: Analytic Geometry
  {
    id: 'l5-1', chapterId: 'ch5', number: 1,
    title_ar: 'معادلة الخط المستقيم',
    title_en: 'Equation of a straight line',
    periods: 1, bloomLevels: ['remember', 'apply'],
  },
  {
    id: 'l5-2', chapterId: 'ch5', number: 2,
    title_ar: 'المستقيمات المتوازية والمتعامدة',
    title_en: 'Parallel and perpendicular lines',
    periods: 2, bloomLevels: ['understand', 'apply', 'analyze'],
  },
  {
    id: 'l5-3', chapterId: 'ch5', number: 3,
    title_ar: 'معادلة الدائرة',
    title_en: 'Equation of a circle',
    periods: 2, bloomLevels: ['apply', 'analyze', 'create'],
  },
];

// ---------------------------------------------------------------------------
// Lesson Plans (linked to the first teacher by default)
// ---------------------------------------------------------------------------

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export const MOCK_LESSON_PLANS: MockLessonPlan[] = [
  {
    id: 'lp1', lessonId: 'l1-1', teacherId: 't1',
    status: 'approved', bloomLevels: ['remember', 'understand'],
    scheduledDate: today, periodSlot: 1,
    createdAt: '2026-03-01',
  },
  {
    id: 'lp2', lessonId: 'l1-2', teacherId: 't1',
    status: 'approved', bloomLevels: ['apply', 'analyze'],
    scheduledDate: today, periodSlot: 3,
    createdAt: '2026-03-03',
  },
  {
    id: 'lp3', lessonId: 'l1-3', teacherId: 't1',
    status: 'in_review', bloomLevels: ['apply', 'analyze', 'evaluate'],
    scheduledDate: tomorrow, periodSlot: 2,
    createdAt: '2026-03-05',
  },
  {
    id: 'lp4', lessonId: 'l2-1', teacherId: 't1',
    status: 'approved', bloomLevels: ['remember', 'understand'],
    createdAt: '2026-03-08',
  },
  {
    id: 'lp5', lessonId: 'l2-2', teacherId: 't1',
    status: 'draft', bloomLevels: ['understand', 'apply'],
    createdAt: '2026-03-10',
  },
  {
    id: 'lp6', lessonId: 'l2-3', teacherId: 't1',
    status: 'draft', bloomLevels: ['apply', 'analyze', 'create'],
    createdAt: '2026-03-12',
  },
  {
    id: 'lp7', lessonId: 'l3-1', teacherId: 't1',
    status: 'approved', bloomLevels: ['remember', 'apply'],
    createdAt: '2026-03-15',
  },
  {
    id: 'lp8', lessonId: 'l3-2', teacherId: 't1',
    status: 'in_review', bloomLevels: ['understand', 'apply'],
    createdAt: '2026-03-17',
  },
  {
    id: 'lp9', lessonId: 'l4-1', teacherId: 't1',
    status: 'approved', bloomLevels: ['remember', 'apply'],
    createdAt: '2026-03-20',
  },
  {
    id: 'lp10', lessonId: 'l5-1', teacherId: 't1',
    status: 'draft', bloomLevels: ['remember', 'apply'],
    createdAt: '2026-03-22',
  },
];

// ---------------------------------------------------------------------------
// Misconceptions
// ---------------------------------------------------------------------------

export const MOCK_MISCONCEPTIONS: MockMisconception[] = [
  {
    id: 'm1',
    name_ar: 'خلط المجال والمدى',
    name_en: 'Confusing domain and range',
    description_ar: 'يخلط الطلاب بين مجال الدالة ومداها عند تحديد قيم الإدخال والإخراج',
    frequency: 23,
    severity: 'high',
    chapterId: 'ch1',
    detectedAt: '2026-04-10',
  },
  {
    id: 'm2',
    name_ar: 'خطأ في تحويل الراديان إلى درجات',
    name_en: 'Radian to degree conversion error',
    description_ar: 'يستخدم الطلاب معامل التحويل بشكل معكوس عند التحويل بين الراديان والدرجات',
    frequency: 18,
    severity: 'high',
    chapterId: 'ch2',
    detectedAt: '2026-04-11',
  },
  {
    id: 'm3',
    name_ar: 'خطأ الفرق المشترك في المتتاليات الحسابية',
    name_en: 'Common difference error in arithmetic sequences',
    description_ar: 'يحسب الطلاب الفرق المشترك بالطرح في الاتجاه الخطأ',
    frequency: 15,
    severity: 'medium',
    chapterId: 'ch3',
    detectedAt: '2026-04-09',
  },
  {
    id: 'm4',
    name_ar: 'خلط الوسيط والمنوال',
    name_en: 'Confusing median and mode',
    description_ar: 'يخلط الطلاب بين الوسيط والمنوال في مجموعات البيانات',
    frequency: 12,
    severity: 'medium',
    chapterId: 'ch4',
    detectedAt: '2026-04-12',
  },
  {
    id: 'm5',
    name_ar: 'خطأ في إشارة الميل',
    name_en: 'Slope sign error',
    description_ar: 'يخطئ الطلاب في تحديد إشارة الميل عند حساب ميل الخط المستقيم',
    frequency: 9,
    severity: 'low',
    chapterId: 'ch5',
    detectedAt: '2026-04-08',
  },
  {
    id: 'm6',
    name_ar: 'عدم فهم تركيب الدوال',
    name_en: 'Function composition misunderstanding',
    description_ar: 'يعامل الطلاب تركيب الدوال وكأنه ضرب بدلاً من التعويض',
    frequency: 20,
    severity: 'high',
    chapterId: 'ch1',
    detectedAt: '2026-04-13',
  },
];

// ---------------------------------------------------------------------------
// Student Progress (mock class of 28 students)
// ---------------------------------------------------------------------------

export const MOCK_STUDENT_PROGRESS: MockStudentProgress[] = [
  { studentId: 's1', name_ar: 'خالد العتيبي', completionRate: 92, averageScore: 88, lastActive: '2026-04-13' },
  { studentId: 's2', name_ar: 'نورة المري', completionRate: 85, averageScore: 79, lastActive: '2026-04-13' },
  { studentId: 's3', name_ar: 'سعود الدوسري', completionRate: 78, averageScore: 72, lastActive: '2026-04-12' },
  { studentId: 's4', name_ar: 'مريم الحمد', completionRate: 95, averageScore: 91, lastActive: '2026-04-13' },
  { studentId: 's5', name_ar: 'عبدالله الشمري', completionRate: 60, averageScore: 55, lastActive: '2026-04-11' },
  { studentId: 's6', name_ar: 'لطيفة الكبيسي', completionRate: 88, averageScore: 84, lastActive: '2026-04-13' },
  { studentId: 's7', name_ar: 'فهد المالكي', completionRate: 73, averageScore: 68, lastActive: '2026-04-12' },
  { studentId: 's8', name_ar: 'شيخة البوعينين', completionRate: 90, averageScore: 86, lastActive: '2026-04-13' },
  { studentId: 's9', name_ar: 'حمد الثاني', completionRate: 65, averageScore: 61, lastActive: '2026-04-10' },
  { studentId: 's10', name_ar: 'هند المهندي', completionRate: 82, averageScore: 77, lastActive: '2026-04-13' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the lesson object for a given lesson plan */
export function getLessonForPlan(plan: MockLessonPlan): MockLesson | undefined {
  return MOCK_LESSONS.find((l) => l.id === plan.lessonId);
}

/** Get the chapter object for a given lesson */
export function getChapterForLesson(lesson: MockLesson): MockChapter | undefined {
  return MOCK_CHAPTERS.find((ch) => ch.id === lesson.chapterId);
}

/** Get today's lesson plans */
export function getTodayLessonPlans(): MockLessonPlan[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return MOCK_LESSON_PLANS.filter((lp) => lp.scheduledDate === todayStr);
}

/** Compute Bloom level distribution across all lesson plans */
export function getBloomDistribution(): Record<BloomLevel, number> {
  const dist: Record<BloomLevel, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };
  for (const plan of MOCK_LESSON_PLANS) {
    for (const level of plan.bloomLevels) {
      dist[level]++;
    }
  }
  return dist;
}

/** Aggregate stats for the dashboard overview */
export function getDashboardStats() {
  const totalPlans = MOCK_LESSON_PLANS.length;
  const approved = MOCK_LESSON_PLANS.filter((p) => p.status === 'approved').length;
  const drafts = MOCK_LESSON_PLANS.filter((p) => p.status === 'draft').length;
  const inReview = MOCK_LESSON_PLANS.filter((p) => p.status === 'in_review').length;
  const totalStudents = MOCK_STUDENT_PROGRESS.length;
  const avgCompletion = Math.round(
    MOCK_STUDENT_PROGRESS.reduce((s, p) => s + p.completionRate, 0) / totalStudents,
  );
  const weekMisconceptions = MOCK_MISCONCEPTIONS.filter((m) => {
    const diff = Date.now() - new Date(m.detectedAt).getTime();
    return diff < 7 * 86_400_000;
  }).length;

  return {
    totalPlans,
    approved,
    drafts,
    inReview,
    totalStudents,
    avgCompletion,
    weekMisconceptions,
  };
}
