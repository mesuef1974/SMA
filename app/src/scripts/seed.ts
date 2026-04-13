/**
 * Database Seed Script
 * Populates the Railway PostgreSQL database with:
 * - 1 subject (Mathematics)
 * - 1 grade level (Grade 11 Literary)
 * - 3 chapters (Units 3, 4, 5)
 * - 15 lessons
 * - 37 learning outcomes
 * - 18 misconception types
 *
 * Usage: pnpm db:seed
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
} from '../db/schema';
import { MISCONCEPTION_CATALOG } from '../lib/misconceptions/catalog';
import { BADGE_DEFINITIONS } from '../lib/gamification/badges';
import curriculumData from '../data/curriculum-structure.json';

async function seed() {
  console.log('--- Seeding database ---\n');

  // -------------------------------------------------------------------------
  // 0. Demo Teacher (S1-6)
  // -------------------------------------------------------------------------
  console.log('[0/8] Inserting demo teacher...');
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
  console.log('[1/8] Inserting subject...');
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
  console.log('[2/8] Inserting grade level...');
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
  console.log('[3/8] Inserting chapters...');
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
  console.log('[4/8] Inserting lessons...');
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
  console.log('[5/8] Inserting learning outcomes...');
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
  console.log('[6/8] Inserting misconception types...');
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
  console.log('[7/8] Inserting XP config (Bloom levels)...');
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
  console.log('[8/8] Inserting badge definitions...');
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
  console.log(`  TOTAL rows:         ${1 + 1 + Object.keys(chapterMap).length + lessonCount + loCount + mcCount + xpConfigCount + badgeCount}`);

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
