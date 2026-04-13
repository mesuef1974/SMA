/**
 * Few-shot example: Lesson 3-1 — Absolute Value Function
 *
 * A complete lesson plan for Grade 11 Literary Track (Qatar curriculum).
 * Conforms exactly to the LessonPlanData type from ../schema.ts.
 *
 * Used as a few-shot example in the system prompt so that Claude sees
 * a concrete, high-quality output before generating a new plan.
 */

import type { LessonPlanData } from '../schema';

/**
 * Complete lesson preparation for lesson 3-1 (Absolute Value Function),
 * period 1 of 2, targeting Grade 11 Literary Track — State of Qatar.
 */
export const EXAMPLE_3_1: LessonPlanData = {
  header: {
    lesson_title_ar: 'دالة القيمة المطلقة',
    lesson_title_en: 'Absolute Value Function',
    unit_number: 3,
    period: '1',
    teacher_guide_pages: 'ص 5A-10',
    student_book_pages: 'ص 132-138',
  },

  learning_outcomes: [
    {
      outcome_ar:
        'يمثّل دالة القيمة المطلقة بيانيًّا ويحدّد الخواص الأساسية للتمثيل البياني (الرأس، محور التناظر، المجال، المدى)',
      bloom_level: 'apply',
      action_verb_ar: 'يمثّل ويحدّد',
    },
    {
      outcome_ar:
        'يفسّر التمثيل البياني لدالة قيمة مطلقة تنمذج موقفًا حياتيًّا',
      bloom_level: 'understand',
      action_verb_ar: 'يفسّر',
    },
    {
      outcome_ar:
        'يستكشف التحويلات الهندسية لدالة القيمة المطلقة ويقارن تمثيلاتها البيانية',
      bloom_level: 'analyze',
      action_verb_ar: 'يستكشف ويقارن',
    },
  ],

  warm_up: {
    duration_minutes: 5,
    activity_ar:
      'راجع مفهوم القيمة المطلقة كمسافة على خط الأعداد. اسأل الطلاب: ما المسافة بين العدد \\(-3\\) والصفر على خط الأعداد؟ وبين \\(3\\) والصفر؟ ماذا تلاحظ؟ ثم اعرض: \\(|{-3}| = 3\\) و \\(|3| = 3\\). ذكّر بتعريف: \\(|x| = x\\) إذا \\(x \\geq 0\\)، و \\(|x| = -x\\) إذا \\(x < 0\\).',
    prerequisite_concepts: [
      'القيمة المطلقة كمسافة',
      'خط الأعداد',
      'المتباينات الخطية',
    ],
    target_bloom: 'remember',
  },

  explore: {
    duration_minutes: 15,
    activity_ar:
      'وزّع على الطلاب جدولاً فارغاً لقيم الدالة \\(f(x) = |x|\\). اطلب منهم حساب \\(f(x)\\) للقيم \\(x = -3, -2, -1, 0, 1, 2, 3\\) ثم تمثيل النقاط على المستوى الإحداثي وربطها. ناقش: ما شكل الرسم البياني؟ أين يقع الرأس؟ ما محور التناظر؟ ثم كرّر مع الدالة \\(g(x) = |x - 2| + 1\\) وقارن بين التمثيلين.',
    guiding_questions: [
      'ما شكل التمثيل البياني للدالة \\(f(x) = |x|\\)؟ بماذا يشبه الحرف V؟',
      'أين يقع رأس التمثيل البياني؟ وما إحداثياته؟',
      'ما محور تناظر الرسم البياني؟ كيف تتأكد أنه محور تناظر فعلاً؟',
      'ماذا يحدث للرسم البياني عندما ننتقل من \\(f(x) = |x|\\) إلى \\(g(x) = |x - 2| + 1\\)؟',
    ],
    differentiation: {
      approaching:
        'وفّر جدول قيم مملوءاً جزئياً وورقة مربعات مع محاور مرسومة مسبقاً. ساعد الطالب على حساب \\(|{-3}|\\) و \\(|{-2}|\\) خطوة بخطوة قبل الانتقال للرسم.',
      meeting:
        'يكمل الطالب جدول القيم ويرسم التمثيل البياني ويحدّد الرأس ومحور التناظر مستقلاً، ثم يقارن بين \\(f(x) = |x|\\) و \\(g(x) = |x - 2| + 1\\).',
      exceeding:
        'بعد إكمال النشاط الأساسي، اطلب من الطالب استنتاج القاعدة العامة: ما أثر \\(h\\) و \\(k\\) في \\(y = |x - h| + k\\) على التمثيل البياني؟ ثم ارسم \\(y = |x + 1| - 3\\) بدون جدول قيم.',
    },
  },

  explain: {
    duration_minutes: 5,
    concept_ar:
      'دالة القيمة المطلقة الأم هي \\(f(x) = |x|\\). تمثيلها البياني على شكل حرف V رأسه عند نقطة الأصل \\((0, 0)\\) ومحور تناظره هو المحور \\(y\\). الصورة العامة: \\(f(x) = a|x - h| + k\\) حيث \\((h, k)\\) هي إحداثيات الرأس، و \\(x = h\\) هو محور التناظر. إذا \\(a > 0\\) يفتح لأعلى (قيمة صغرى)، وإذا \\(a < 0\\) يفتح لأسفل (قيمة عظمى).',
    key_vocabulary: [
      'دالة القيمة المطلقة — absolute value function',
      'رأس التمثيل البياني — vertex',
      'محور التناظر — axis of symmetry',
      'التحويلات الهندسية — transformations',
      'الإزاحة الرأسية — vertical shift',
      'الإزاحة الأفقية — horizontal shift',
    ],
    formulas: [
      '\\(|x| = \\begin{cases} x & \\text{إذا } x \\geq 0 \\\\ -x & \\text{إذا } x < 0 \\end{cases}\\)',
      '\\(f(x) = a|x - h| + k\\) حيث الرأس \\((h, k)\\) ومحور التناظر \\(x = h\\)',
      'المجال: \\(\\mathbb{R}\\) (جميع الأعداد الحقيقية)',
      'المدى: \\([k, +\\infty)\\) إذا \\(a > 0\\)، و \\((-\\infty, k]\\) إذا \\(a < 0\\)',
    ],
    worked_examples: [
      'مثال: ارسم التمثيل البياني لـ \\(f(x) = |x - 3| + 2\\) وحدّد الرأس ومحور التناظر والمجال والمدى.\n\nالحل خطوة بخطوة:\n1. الصورة العامة: \\(f(x) = a|x - h| + k\\) حيث \\(a = 1\\)، \\(h = 3\\)، \\(k = 2\\).\n2. الرأس: \\((h, k) = (3, 2)\\).\n3. محور التناظر: \\(x = 3\\).\n4. بما أن \\(a = 1 > 0\\)، الرسم يفتح لأعلى.\n5. جدول قيم:\n   \\(x = 1 \\Rightarrow f(1) = |1-3|+2 = 4\\)\n   \\(x = 2 \\Rightarrow f(2) = |2-3|+2 = 3\\)\n   \\(x = 3 \\Rightarrow f(3) = |3-3|+2 = 2\\) (الرأس)\n   \\(x = 4 \\Rightarrow f(4) = |4-3|+2 = 3\\)\n   \\(x = 5 \\Rightarrow f(5) = |5-3|+2 = 4\\)\n6. ارسم النقاط وصلها بخطين مستقيمين يشكلان حرف V.\n7. المجال: \\(\\mathbb{R}\\). المدى: \\([2, +\\infty)\\).',
      'مثال: حدّد الرأس ومحور التناظر واتجاه الفتح لـ \\(g(x) = -2|x + 1| + 5\\).\n\nالحل خطوة بخطوة:\n1. نكتب بالصورة العامة: \\(g(x) = -2|x - (-1)| + 5\\).\n2. إذن: \\(a = -2\\)، \\(h = -1\\)، \\(k = 5\\).\n3. الرأس: \\((-1, 5)\\).\n4. محور التناظر: \\(x = -1\\).\n5. بما أن \\(a = -2 < 0\\)، الرسم يفتح لأسفل، أي الرأس نقطة عظمى.\n6. المدى: \\((-\\infty, 5]\\).',
    ],
    misconception_alerts: [
      '[MC-FUN-002] خطأ في تحديد المجال والمدى: بعض الطلاب يكتبون المدى \\(\\mathbb{R}\\) لدالة القيمة المطلقة. ذكّرهم أن \\(|x| \\geq 0\\) دائماً، فمدى \\(f(x) = |x|\\) هو \\([0, +\\infty)\\) وليس \\(\\mathbb{R}\\).',
      '[MC-FUN-001] خلط بين الدالة والمعادلة: بعض الطلاب يحاولون "حل" \\(f(x) = |x|\\) بإيجاد قيمة \\(x\\). وضّح أن هذا تعريف للدالة وليس معادلة تُحل.',
    ],
  },

  practice: {
    duration_minutes: 12,
    items: [
      {
        question_ar:
          'حدّد الرأس ومحور التناظر واتجاه الفتح لكل مما يلي:\nأ) \\(f(x) = |x - 4|\\)\nب) \\(g(x) = |x + 2| - 3\\)\nج) \\(h(x) = -|x - 1| + 6\\)',
        bloom_level: 'apply',
        tier: 'meeting',
        expected_answer:
          'أ) الرأس: \\((4, 0)\\)، محور التناظر: \\(x = 4\\)، يفتح لأعلى.\nب) الرأس: \\((-2, -3)\\)، محور التناظر: \\(x = -2\\)، يفتح لأعلى.\nج) الرأس: \\((1, 6)\\)، محور التناظر: \\(x = 1\\)، يفتح لأسفل.',
        source_page: 'ص 134',
      },
      {
        question_ar:
          'ارسم التمثيل البياني لـ \\(f(x) = |x + 1| - 2\\) على المستوى الإحداثي. حدّد: الرأس، محور التناظر، المجال، المدى.',
        bloom_level: 'apply',
        tier: 'meeting',
        expected_answer:
          'الرأس: \\((-1, -2)\\). محور التناظر: \\(x = -1\\). المجال: \\(\\mathbb{R}\\). المدى: \\([-2, +\\infty)\\). الرسم على شكل V يفتح لأعلى.',
        source_page: 'ص 135',
      },
      {
        question_ar:
          'أكمل الجدول التالي ثم ارسم \\(f(x) = |x|\\):\n\\(x = -2, -1, 0, 1, 2\\)\n\\(f(x) = ?, ?, ?, ?, ?\\)',
        bloom_level: 'apply',
        tier: 'approaching',
        expected_answer:
          '\\(f(-2) = 2\\)، \\(f(-1) = 1\\)، \\(f(0) = 0\\)، \\(f(1) = 1\\)، \\(f(2) = 2\\). الرسم على شكل V رأسه عند الأصل.',
        source_page: 'ص 133',
      },
      {
        question_ar:
          'بدون إنشاء جدول قيم، ارسم التمثيل البياني لـ \\(f(x) = 3|x - 2| - 1\\) ثم حدّد فترات التزايد والتناقص.',
        bloom_level: 'analyze',
        tier: 'exceeding',
        expected_answer:
          'الرأس: \\((2, -1)\\). محور التناظر: \\(x = 2\\). يفتح لأعلى (\\(a=3>0\\)). الدالة متناقصة على \\((-\\infty, 2)\\) ومتزايدة على \\((2, +\\infty)\\).',
        source_page: 'ص 137',
      },
    ],
  },

  assess: {
    duration_minutes: 5,
    items: [
      {
        question_ar:
          'ما رأس التمثيل البياني لـ \\(f(x) = |x - 5| + 3\\)؟\nأ) \\((5, 3)\\)\nب) \\((-5, 3)\\)\nج) \\((5, -3)\\)\nد) \\((-5, -3)\\)',
        type: 'mcq',
        model_answer_ar: 'أ) \\((5, 3)\\) — لأن \\(h = 5\\) و \\(k = 3\\) في الصورة \\(|x - h| + k\\).',
        bloom_level: 'remember',
      },
      {
        question_ar:
          'اكتب معادلة دالة قيمة مطلقة رأس تمثيلها البياني عند النقطة \\((2, -4)\\) وتفتح لأسفل.',
        type: 'short_answer',
        model_answer_ar:
          '\\(f(x) = -a|x - 2| - 4\\) حيث \\(a > 0\\). أبسط إجابة: \\(f(x) = -|x - 2| - 4\\).',
        bloom_level: 'apply',
      },
    ],
  },

  extend: {
    duration_minutes: 3,
    challenge_ar:
      'تحدٍّ إثرائي (اختياري): يقف أحمد عند النقطة \\(x = 0\\) ويمشي نحو صديقه خالد عند \\(x = 8\\). المسافة بين أحمد وخالد في أي لحظة تُعطى بالدالة \\(d(x) = |x - 8|\\). ارسم هذه الدالة وفسّر: ماذا يمثل الرأس في هذا السياق؟ متى تكون المسافة أقل من \\(3\\) وحدات؟ (حل المتباينة \\(|x - 8| < 3\\)).',
    is_optional: true,
    excluded_from_assessments: true,
  },

  metadata: {
    generated_at: '2026-04-13T10:00:00.000Z',
    generated_by: 'ai',
    bloom_distribution: {
      remember: 2,
      understand: 1,
      apply: 4,
      analyze: 1,
      evaluate: 0,
      create: 0,
    },
    teacher_guide_pages: ['5A', '6', '7', '8', '9', '10'],
    student_book_pages: ['132', '133', '134', '135', '136', '137', '138'],
  },
};

/**
 * Returns the few-shot example as a formatted JSON string suitable
 * for inclusion in the system prompt.
 */
export function getExampleAsPromptString(): string {
  return JSON.stringify(EXAMPLE_3_1, null, 2);
}
