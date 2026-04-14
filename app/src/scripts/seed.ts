/**
 * Database Seed Script
 * Populates the Railway PostgreSQL database with:
 * - 1 subject (Mathematics)
 * - 1 grade level (Grade 11 Literary)
 * - 3 chapters (Units 3, 4, 5)
 * - 15 lessons
 * - 37 learning outcomes
 * - 18 misconception types
 * - XP config (6 Bloom levels)
 * - Badge definitions
 *
 * Pilot data (seed:pilot):
 * - 1 classroom (Grade 11 Arts - A)
 * - 15 students (realistic Qatari names)
 * - 1 sample assessment (absolute value function, 5 questions)
 *
 * Usage: pnpm db:seed       (curriculum only)
 *        pnpm seed:pilot    (curriculum + pilot data)
 */

import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
  users,
  subjects,
  gradeLevels,
  chapters,
  lessons,
  learningOutcomes,
  misconceptionTypes,
  xpConfig,
  badgeDefinitions,
  classrooms,
  classroomStudents,
  assessments,
  assessmentQuestions,
} from '../db/schema';
import { MISCONCEPTION_CATALOG } from '../lib/misconceptions/catalog';
import { BADGE_DEFINITIONS } from '../lib/gamification/badges';
import curriculumData from '../data/curriculum-structure.json';

async function seed() {
  console.log('--- Seeding database ---\n');

  // -------------------------------------------------------------------------
  // 0. Demo Teacher (S1-6)
  // -------------------------------------------------------------------------
  console.log('[0/12] Inserting demo teacher...');
  const passwordHash = await bcrypt.hash('Sma2026!', 12);
  const [teacher] = await db
    .insert(users)
    .values({
      email: 'teacher@sma.qa',
      passwordHash,
      fullName: 'Sufian',
      fullNameAr: 'أ. سفيان',
      role: 'teacher',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (teacher) {
    console.log(`  -> teacher: ${teacher.id} (${teacher.fullNameAr})`);
  } else {
    console.log('  -> teacher already exists, skipped.');
  }

  // -------------------------------------------------------------------------
  // 1. Subject
  // -------------------------------------------------------------------------
  console.log('[1/12] Inserting subject...');
  const [insertedSubject] = await db
    .insert(subjects)
    .values({
      name: 'Mathematics',
      nameAr: 'الرياضيات',
      code: 'MATH',
    })
    .onConflictDoNothing({ target: subjects.code })
    .returning();
  const subject = insertedSubject ?? (await db.select().from(subjects).where(eq(subjects.code, 'MATH')))[0];
  console.log(`  -> subject: ${subject.id} (${subject.nameAr})`);

  // -------------------------------------------------------------------------
  // 2. Grade Level
  // -------------------------------------------------------------------------
  console.log('[2/12] Inserting grade level...');
  const [insertedGrade] = await db
    .insert(gradeLevels)
    .values({
      grade: 11,
      track: 'literary',
      subjectId: subject.id,
      academicYear: '2025-2026',
    })
    .onConflictDoNothing()
    .returning();
  const gradeLevel = insertedGrade ?? (await db.select().from(gradeLevels).where(
    and(eq(gradeLevels.grade, 11), eq(gradeLevels.track, 'literary'), eq(gradeLevels.subjectId, subject.id))
  ))[0];
  console.log(`  -> gradeLevel: ${gradeLevel.id} (Grade ${gradeLevel.grade} ${gradeLevel.track})`);

  // -------------------------------------------------------------------------
  // 3. Chapters
  // -------------------------------------------------------------------------
  console.log('[3/12] Inserting chapters...');
  const chapterMap: Record<number, string> = {};

  for (const unit of curriculumData.units) {
    const [insertedChapter] = await db
      .insert(chapters)
      .values({
        gradeLevelId: gradeLevel.id,
        number: unit.number,
        title: unitTitleEn(unit.number),
        titleAr: unit.title,
        semester: curriculumData.semester,
        sortOrder: unit.number,
      })
      .onConflictDoNothing()
      .returning();
    const chapter = insertedChapter ?? (await db.select().from(chapters).where(
      and(eq(chapters.gradeLevelId, gradeLevel.id), eq(chapters.number, unit.number))
    ))[0];
    chapterMap[unit.number] = chapter.id;
    console.log(`  -> chapter ${unit.number}: ${chapter.id} (${unit.title})`);
  }

  // -------------------------------------------------------------------------
  // 4. Lessons
  // -------------------------------------------------------------------------
  console.log('[4/12] Inserting lessons...');
  let lessonCount = 0;
  const lessonIdMap: Record<string, string> = {};

  for (const unit of curriculumData.units) {
    const chapterId = chapterMap[unit.number];
    let sortIdx = 1;

    for (const lsn of unit.lessons) {
      const [insertedLesson] = await db
        .insert(lessons)
        .values({
          chapterId,
          number: lsn.number,
          title: lessonTitleEn(lsn.number),
          titleAr: lsn.title,
          periodCount: lsn.periods ?? 2,
          sortOrder: sortIdx++,
        })
        .onConflictDoNothing()
        .returning();
      const lesson = insertedLesson ?? (await db.select().from(lessons).where(
        and(eq(lessons.chapterId, chapterId), eq(lessons.number, lsn.number))
      ))[0];
      lessonIdMap[lsn.number] = lesson.id;
      lessonCount++;
      console.log(`  -> lesson ${lsn.number}: ${lesson.id} (${lsn.title})`);
    }
  }
  console.log(`  Total lessons: ${lessonCount}`);

  // -------------------------------------------------------------------------
  // 5. Learning Outcomes
  // -------------------------------------------------------------------------
  console.log('[5/12] Inserting learning outcomes...');
  let loCount = 0;

  for (const unit of curriculumData.units) {
    for (const lsn of unit.lessons) {
      const lessonId = lessonIdMap[lsn.number];
      let sortIdx = 1;

      for (const outcomeDesc of lsn.learning_outcomes) {
        await db.insert(learningOutcomes).values({
          lessonId,
          code: `LO-${lsn.number}-${sortIdx}`,
          description: outcomeDescEn(lsn.number, sortIdx),
          descriptionAr: outcomeDesc,
          bloomLevel: 'understand',
          sortOrder: sortIdx,
        }).onConflictDoNothing();
        loCount++;
        sortIdx++;
      }
    }
  }
  console.log(`  Total learning outcomes: ${loCount}`);

  // -------------------------------------------------------------------------
  // 6. Misconception Types
  // -------------------------------------------------------------------------
  console.log('[6/12] Inserting misconception types...');
  let mcCount = 0;

  for (const mc of MISCONCEPTION_CATALOG) {
    await db.insert(misconceptionTypes).values({
      code: mc.code,
      name: mc.name,
      nameAr: mc.nameAr,
      description: mc.description,
      descriptionAr: mc.descriptionAr,
      category: mc.category,
      severity: mc.severity,
      remediationHint: mc.remediationHintEn,
      remediationHintAr: mc.remediationHintAr,
    }).onConflictDoNothing();
    mcCount++;
  }
  console.log(`  Total misconception types: ${mcCount}`);

  // -------------------------------------------------------------------------
  // 7. XP Config (Bloom level → XP reward mapping)
  // -------------------------------------------------------------------------
  console.log('[7/12] Inserting XP config (Bloom levels)...');
  const xpConfigData = [
    { bloomLevel: 'remember' as const,    xpReward: 10, descriptionAr: 'التذكر — استرجاع المعلومات' },
    { bloomLevel: 'understand' as const,  xpReward: 15, descriptionAr: 'الفهم — شرح الأفكار والمفاهيم' },
    { bloomLevel: 'apply' as const,       xpReward: 20, descriptionAr: 'التطبيق — استخدام المعلومات في مواقف جديدة' },
    { bloomLevel: 'analyze' as const,     xpReward: 30, descriptionAr: 'التحليل — تفكيك المعلومات إلى أجزاء' },
    { bloomLevel: 'evaluate' as const,    xpReward: 40, descriptionAr: 'التقويم — إصدار أحكام مبنية على معايير' },
    { bloomLevel: 'create' as const,      xpReward: 50, descriptionAr: 'الإبداع — إنتاج عمل أصيل' },
  ];
  let xpConfigCount = 0;
  for (const cfg of xpConfigData) {
    await db.insert(xpConfig).values(cfg).onConflictDoNothing();
    xpConfigCount++;
  }
  console.log(`  Total XP config entries: ${xpConfigCount}`);

  // -------------------------------------------------------------------------
  // 8. Badge Definitions
  // -------------------------------------------------------------------------
  console.log('[8/12] Inserting badge definitions...');
  let badgeCount = 0;
  for (const badge of BADGE_DEFINITIONS) {
    await db.insert(badgeDefinitions).values({
      code: badge.code,
      nameAr: badge.nameAr,
      descriptionAr: badge.descriptionAr,
      icon: badge.icon,
      category: badge.category,
      xpReward: badge.xpReward,
      criteriaJson: badge.criteriaJson,
    }).onConflictDoNothing();
    badgeCount++;
  }
  console.log(`  Total badge definitions: ${badgeCount}`);

  // -------------------------------------------------------------------------
  // 9–12. Pilot Data (classroom, students, assessment)
  // -------------------------------------------------------------------------
  const runPilot = process.argv.includes('--pilot');

  let pilotClassroomCount = 0;
  let pilotStudentCount = 0;
  let pilotAssessmentCount = 0;
  let pilotQuestionCount = 0;

  if (runPilot) {
    console.log('\n--- Seeding pilot data ---\n');

    // Resolve teacher ID (may have been skipped above if already existed)
    const existingTeacher = teacher ?? (
      await db.select().from(users).where(eq(users.email, 'teacher@sma.qa'))
    )[0];
    if (!existingTeacher) {
      throw new Error('Teacher account not found — cannot create pilot data');
    }

    // -----------------------------------------------------------------------
    // 9. Classroom
    // -----------------------------------------------------------------------
    console.log('[9/12] Inserting pilot classroom...');
    const [insertedClassroom] = await db
      .insert(classrooms)
      .values({
        teacherId: existingTeacher.id,
        name: 'الصف الحادي عشر أدبي - أ',
        nameAr: 'الصف الحادي عشر أدبي - أ',
        code: 'SMA11A',
        academicYear: '2025-2026',
        isActive: true,
      })
      .onConflictDoNothing({ target: classrooms.code })
      .returning();
    const classroom = insertedClassroom ?? (
      await db.select().from(classrooms).where(eq(classrooms.code, 'SMA11A'))
    )[0];
    if (insertedClassroom) {
      pilotClassroomCount = 1;
      console.log(`  -> classroom: ${classroom.id} (${classroom.nameAr})`);
    } else {
      console.log('  -> classroom already exists, skipped.');
    }

    // -----------------------------------------------------------------------
    // 10. Students (15 realistic Qatari male names)
    // -----------------------------------------------------------------------
    console.log('[10/12] Inserting pilot students...');
    const studentNames = [
      'محمد', 'أحمد', 'عبدالله', 'يوسف', 'خالد',
      'عمر', 'سعود', 'حمد', 'فهد', 'ناصر',
      'علي', 'إبراهيم', 'مبارك', 'جاسم', 'تميم',
    ];

    // Check existing students to avoid duplicates (no unique constraint on table)
    const existingStudents = await db
      .select({ displayName: classroomStudents.displayName })
      .from(classroomStudents)
      .where(eq(classroomStudents.classroomId, classroom.id));
    const existingNames = new Set(existingStudents.map((s) => s.displayName));

    for (const name of studentNames) {
      if (existingNames.has(name)) continue;
      const [inserted] = await db
        .insert(classroomStudents)
        .values({
          classroomId: classroom.id,
          displayName: name,
          displayNameAr: name,
          isActive: true,
        })
        .returning();
      if (inserted) {
        pilotStudentCount++;
        console.log(`  -> student: ${inserted.id} (${name})`);
      }
    }
    if (pilotStudentCount === 0) {
      console.log('  -> students already exist, skipped.');
    } else {
      console.log(`  Total students inserted: ${pilotStudentCount}`);
    }

    // -----------------------------------------------------------------------
    // 11. Sample Assessment (lesson 3-1: absolute value function)
    // -----------------------------------------------------------------------
    console.log('[11/12] Inserting sample assessment...');
    const lessonId31 = lessonIdMap['3-1'];
    if (!lessonId31) {
      console.warn('  -> WARNING: lesson 3-1 not found, skipping assessment.');
    } else {
      const assessmentTitle = 'تقييم: دالة القيمة المطلقة';

      // Check if assessment already exists (no unique constraint on table)
      const existingAssessment = (
        await db
          .select()
          .from(assessments)
          .where(
            and(
              eq(assessments.teacherId, existingTeacher.id),
              eq(assessments.titleAr, assessmentTitle),
            ),
          )
      )[0];

      const assessment = existingAssessment ?? (
        await db
          .insert(assessments)
          .values({
            lessonId: lessonId31,
            teacherId: existingTeacher.id,
            title: 'Assessment: Absolute Value Function',
            titleAr: assessmentTitle,
            type: 'formative',
          })
          .returning()
      )[0];

      if (!existingAssessment) {
        pilotAssessmentCount = 1;
        console.log(`  -> assessment: ${assessment.id} (${assessmentTitle})`);

        // -------------------------------------------------------------------
        // 12. Assessment Questions (5 questions)
        // -------------------------------------------------------------------
        console.log('[12/12] Inserting assessment questions...');

        const questions: {
          questionText: string;
          questionTextAr: string;
          correctAnswer: string;
          bloomLevel: 'remember' | 'understand' | 'apply';
          sortOrder: number;
        }[] = [
          {
            questionText: 'What is the definition of the absolute value function?',
            questionTextAr: 'ما تعريف دالة القيمة المطلقة؟',
            correctAnswer: 'f(x) = |x| تُعرَّف بأنها: f(x) = x إذا x ≥ 0، و f(x) = -x إذا x < 0',
            bloomLevel: 'remember',
            sortOrder: 1,
          },
          {
            questionText: 'What is the vertex of f(x) = |x|?',
            questionTextAr: 'ما رأس التمثيل البياني للدالة f(x) = |x|؟',
            correctAnswer: '(0, 0)',
            bloomLevel: 'remember',
            sortOrder: 2,
          },
          {
            questionText: 'Explain why the graph of f(x) = |x| is symmetric about the y-axis.',
            questionTextAr: 'وضّح لماذا يكون التمثيل البياني للدالة f(x) = |x| متناظرًا حول المحور الصادي.',
            correctAnswer: 'لأن |x| = |-x| لكل قيمة x، فإن الدالة زوجية وبالتالي متناظرة حول محور الصادي',
            bloomLevel: 'understand',
            sortOrder: 3,
          },
          {
            questionText: 'Describe how the graph of g(x) = |x - 3| + 2 differs from f(x) = |x|.',
            questionTextAr: 'صف كيف يختلف التمثيل البياني للدالة g(x) = |x - 3| + 2 عن التمثيل البياني للدالة f(x) = |x|.',
            correctAnswer: 'ينتقل التمثيل البياني 3 وحدات إلى اليمين و 2 وحدة إلى الأعلى، فيصبح الرأس عند النقطة (3, 2)',
            bloomLevel: 'understand',
            sortOrder: 4,
          },
          {
            questionText: 'Solve the equation |2x - 4| = 6.',
            questionTextAr: 'حل المعادلة |2x - 4| = 6.',
            correctAnswer: 'x = 5 أو x = -1',
            bloomLevel: 'apply',
            sortOrder: 5,
          },
        ];

        for (const q of questions) {
          const [insertedQ] = await db
            .insert(assessmentQuestions)
            .values({
              assessmentId: assessment.id,
              questionText: q.questionText,
              questionTextAr: q.questionTextAr,
              questionType: 'short_answer',
              correctAnswer: q.correctAnswer,
              bloomLevel: q.bloomLevel,
              points: 1,
              sortOrder: q.sortOrder,
            })
            .returning();
          if (insertedQ) {
            pilotQuestionCount++;
            console.log(`  -> question ${q.sortOrder}: ${q.questionTextAr.substring(0, 40)}...`);
          }
        }
        console.log(`  Total questions inserted: ${pilotQuestionCount}`);
      } else {
        console.log('  -> assessment already exists, skipped.');
        console.log('[12/12] Assessment questions already exist, skipped.');
      }
    }
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n--- Seed complete ---');
  console.log(`  subjects:           1`);
  console.log(`  grade_levels:       1`);
  console.log(`  chapters:           ${Object.keys(chapterMap).length}`);
  console.log(`  lessons:            ${lessonCount}`);
  console.log(`  learning_outcomes:  ${loCount}`);
  console.log(`  misconception_types:${mcCount}`);
  console.log(`  xp_config:          ${xpConfigCount}`);
  console.log(`  badge_definitions:  ${badgeCount}`);
  if (runPilot) {
    console.log(`  classrooms:         ${pilotClassroomCount}`);
    console.log(`  students:           ${pilotStudentCount}`);
    console.log(`  assessments:        ${pilotAssessmentCount}`);
    console.log(`  questions:          ${pilotQuestionCount}`);
  }

  const baseTotal = 1 + 1 + Object.keys(chapterMap).length + lessonCount + loCount + mcCount + xpConfigCount + badgeCount;
  const pilotTotal = pilotClassroomCount + pilotStudentCount + pilotAssessmentCount + pilotQuestionCount;
  console.log(`  TOTAL rows:         ${baseTotal + pilotTotal}`);

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers — English titles derived from the Arabic curriculum
// ---------------------------------------------------------------------------

function unitTitleEn(num: number): string {
  const map: Record<number, string> = {
    3: 'Functions and Their Graphs',
    4: 'Properties of Functions and Operations',
    5: 'Statistics',
  };
  return map[num] ?? `Unit ${num}`;
}

function lessonTitleEn(number: string): string {
  const map: Record<string, string> = {
    '3-1': 'Absolute Value Function',
    '3-2': 'Piecewise-Defined Functions',
    '3-3': 'Square Root Function',
    '3-4': 'Cube Root Function',
    '3-5': 'Inverse Variation and Reciprocal Function',
    '4-1': 'Analyzing Functions Graphically',
    '4-2': 'Translations of Functions',
    '4-3': 'Stretches and Compressions',
    '4-4': 'Operations on Functions',
    '4-5': 'Inverse Functions',
    '5-1': 'Analyzing Data Displays',
    '5-2': 'Comparing Data Sets',
    '5-3': 'Interpreting Data Distribution Shapes',
    '5-4': 'Standard Deviation',
    '5-5': 'Two-Way Frequency Tables',
  };
  return map[number] ?? `Lesson ${number}`;
}

function outcomeDescEn(lessonNum: string, idx: number): string {
  return `Learning outcome ${idx} for lesson ${lessonNum}`;
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
