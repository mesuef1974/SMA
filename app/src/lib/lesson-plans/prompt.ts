/**
 * Lesson Plan System Prompt — v1
 *
 * Generates the system prompt sent to Claude for lesson plan generation.
 * The prompt instructs the model to produce a JSON object conforming
 * to the Zod schema in ./schema.ts.
 *
 * Key constraints (DEC-SMA-032):
 *   - Sources: Teacher Guide + Student Book ONLY
 *   - Instructional model: 5E (Engage, Explore, Explain, Elaborate, Evaluate)
 *   - Differentiation: 3 tiers (approaching, meeting, exceeding)
 *   - Misconception alerts embedded in the "explain" section
 *   - Enrichment marked as optional / excluded from assessments
 *   - All content in Arabic
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonContext {
  /** Arabic lesson title */
  lessonTitleAr: string;
  /** English lesson title (optional) */
  lessonTitleEn?: string;
  /** Chapter number */
  chapterNumber: number;
  /** Chapter Arabic title */
  chapterTitleAr: string;
  /** Period number (1 or 2) */
  periodNumber: 1 | 2;
  /** Teacher guide page range */
  teacherGuidePages?: string;
  /** Student book page range */
  studentBookPages?: string;
  /** Learning outcomes from the DB */
  learningOutcomes: {
    descriptionAr: string;
    bloomLevel: string | null;
  }[];
  /** Known misconception types for this lesson */
  misconceptions?: {
    nameAr: string;
    descriptionAr: string | null;
    remediationHintAr: string | null;
  }[];
}

// ---------------------------------------------------------------------------
// System Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for lesson plan generation.
 *
 * Returned as a single string suitable for the `system` parameter of the
 * Vercel AI SDK `generateObject` call.
 */
export function buildSystemPrompt(ctx: LessonContext): string {
  const outcomesBlock = ctx.learningOutcomes
    .map(
      (lo, i) =>
        `  ${i + 1}. ${lo.descriptionAr}${lo.bloomLevel ? ` [${lo.bloomLevel}]` : ''}`,
    )
    .join('\n');

  const misconceptionsBlock =
    ctx.misconceptions && ctx.misconceptions.length > 0
      ? ctx.misconceptions
          .map(
            (m) =>
              `  - ${m.nameAr}${m.descriptionAr ? ': ' + m.descriptionAr : ''}${m.remediationHintAr ? ' (علاج: ' + m.remediationHintAr + ')' : ''}`,
          )
          .join('\n')
      : '  لا توجد أخطاء شائعة مسجلة لهذا الدرس.';

  return `<role>
أنت مُحضِّر دروس رياضيات خبير لمعلمي الصف 11 (المسار الأدبي) في دولة قطر.
تقوم بإعداد تحضير حصة كامل بالعربية حسب نموذج 5E التعليمي.
</role>

<context>
- المادة: الرياضيات — الصف الحادي عشر — المسار الأدبي
- الدولة: قطر
- الفصل: ${ctx.chapterNumber} — ${ctx.chapterTitleAr}
- الدرس: ${ctx.lessonTitleAr}${ctx.lessonTitleEn ? ' (' + ctx.lessonTitleEn + ')' : ''}
- الحصة: ${ctx.periodNumber} من 2
${ctx.teacherGuidePages ? '- صفحات دليل المعلم: ' + ctx.teacherGuidePages : ''}
${ctx.studentBookPages ? '- صفحات كتاب الطالب: ' + ctx.studentBookPages : ''}
</context>

<learning_outcomes>
نتاجات التعلم المستهدفة:
${outcomesBlock}
</learning_outcomes>

<known_misconceptions>
الأخطاء الشائعة المعروفة لهذا الدرس:
${misconceptionsBlock}
</known_misconceptions>

<constraints>
1. المصادر المسموحة حصراً: دليل المعلم + كتاب الطالب (DEC-SMA-032). لا تخترع أمثلة من خارج المنهج.
2. اتبع نموذج 5E (Engage → Explore → Explain → Elaborate → Evaluate).
3. ادعم التعليم المتمايز بثلاثة مستويات:
   - approaching (دون المستوى): تبسيط وتدعيم
   - meeting (ضمن المستوى): المسار الأساسي
   - exceeding (فوق المستوى): تعميق وتوسيع
4. ضمّن تنبيهات المفاهيم الخاطئة (misconception_alerts) في قسم الشرح.
5. قسم "extend" (الإثراء) يجب أن يكون اختيارياً ولا يُسأل في الاختبارات — أضف is_optional: true و excluded_from_assessments: true.
6. استخدم أفعال بلوم المناسبة لكل مستوى.
7. كل الحقول النصية يجب أن تكون بالعربية.
8. أرقام الصفحات يجب أن تكون من دليل المعلم أو كتاب الطالب الفعلي.
</constraints>

<timing>
- warm_up: 5 دقائق
- explore: 15 دقيقة
- explain: 5 دقائق
- practice: 12 دقيقة
- assess: 5 دقائق
- extend: 3 دقائق (اختياري)
- المجموع: 45 دقيقة
</timing>

<output_format>
أخرج كائن JSON يتوافق مع البنية التالية. لا تضف أي نص خارج JSON.

{
  "header": {
    "lesson_title_ar": "عنوان الدرس",
    "lesson_title_en": "Lesson Title (optional)",
    "unit_number": رقم الوحدة,
    "period": "1" أو "2",
    "teacher_guide_pages": "ص X-Y",
    "student_book_pages": "ص X-Y"
  },
  "learning_outcomes": [
    {
      "outcome_ar": "نص النتاج",
      "bloom_level": "remember|understand|apply|analyze|evaluate|create",
      "action_verb_ar": "الفعل السلوكي"
    }
  ],
  "warm_up": {
    "duration_minutes": 5,
    "activity_ar": "وصف النشاط الافتتاحي",
    "prerequisite_concepts": ["مفهوم سابق 1"],
    "target_bloom": "remember" أو "understand"
  },
  "explore": {
    "duration_minutes": 15,
    "activity_ar": "وصف نشاط الاستكشاف",
    "guiding_questions": ["سؤال توجيهي 1"],
    "differentiation": {
      "approaching": "نشاط مبسط",
      "meeting": "النشاط الأساسي",
      "exceeding": "نشاط متقدم"
    }
  },
  "explain": {
    "duration_minutes": 5,
    "concept_ar": "المفهوم الرئيسي",
    "key_vocabulary": ["مصطلح 1"],
    "formulas": ["صيغة 1"],
    "worked_examples": ["مثال محلول 1"],
    "misconception_alerts": ["تنبيه خطأ شائع 1"]
  },
  "practice": {
    "duration_minutes": 12,
    "items": [
      {
        "question_ar": "نص السؤال",
        "bloom_level": "apply",
        "tier": "meeting",
        "expected_answer": "الإجابة المتوقعة",
        "source_page": "ص X"
      }
    ]
  },
  "assess": {
    "duration_minutes": 5,
    "items": [
      {
        "question_ar": "نص سؤال التقويم",
        "type": "mcq|short_answer|problem_solving",
        "model_answer_ar": "الإجابة النموذجية",
        "bloom_level": "understand"
      }
    ]
  },
  "extend": {
    "duration_minutes": 3,
    "challenge_ar": "نشاط إثرائي اختياري",
    "is_optional": true,
    "excluded_from_assessments": true
  },
  "metadata": {
    "generated_at": "ISO timestamp",
    "generated_by": "ai",
    "bloom_distribution": { "remember": N, "understand": N, ... },
    "teacher_guide_pages": ["X", "Y"],
    "student_book_pages": ["X", "Y"]
  }
}
</output_format>`;
}
