import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import {
  classrooms,
  classroomStudents,
  studentMisconceptions,
  misconceptionTypes,
} from '@/db/schema';
import { count, eq, inArray, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = { params: Promise<{ locale: string }> };

interface MisconceptionRow {
  misconceptionTypeId: string;
  nameAr: string;
  name: string;
  category: string | null;
  severity: 'low' | 'medium' | 'high' | null;
  remediationHintAr: string | null;
  totalOccurrences: number;
  resolvedCount: number;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  void locale;
  return { title: 'المفاهيم الخاطئة' };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_AR: Record<string, string> = {
  algebra: 'الجبر',
  functions: 'الدوال',
  trigonometry: 'المثلثات',
  sequences: 'المتتاليات',
  statistics: 'الإحصاء',
  geometry: 'الهندسة',
};

const SEVERITY_AR: Record<string, string> = {
  high: 'خطير',
  medium: 'متوسط',
  low: 'بسيط',
};

function categoryLabel(category: string | null): string {
  if (!category) return 'عام';
  return CATEGORY_AR[category] ?? category;
}

function severityLabel(severity: string | null): string {
  if (!severity) return 'بسيط';
  return SEVERITY_AR[severity] ?? severity;
}

function severityClasses(severity: string | null): string {
  switch (severity) {
    case 'high':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'medium':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400';
    case 'low':
    default:
      return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MisconceptionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // ── 1. Get all classroom IDs owned by this teacher ──────────────────────
  const teacherClassrooms = await db
    .select({ id: classrooms.id })
    .from(classrooms)
    .where(eq(classrooms.teacherId, teacherId));

  const classroomIds = teacherClassrooms.map((c) => c.id);

  // ── 2. Get all student IDs in those classrooms ───────────────────────────
  let studentIds: string[] = [];
  if (classroomIds.length > 0) {
    const students = await db
      .select({ id: classroomStudents.id })
      .from(classroomStudents)
      .where(inArray(classroomStudents.classroomId, classroomIds));
    studentIds = students.map((s) => s.id);
  }

  // ── 3. Aggregate misconceptions for those students ───────────────────────
  let rows: MisconceptionRow[] = [];
  let totalDetected = 0;
  let resolvedTotal = 0;

  if (studentIds.length > 0) {
    const rawRows = await db
      .select({
        misconceptionTypeId: studentMisconceptions.misconceptionTypeId,
        nameAr: misconceptionTypes.nameAr,
        name: misconceptionTypes.name,
        category: misconceptionTypes.category,
        severity: misconceptionTypes.severity,
        remediationHintAr: misconceptionTypes.remediationHintAr,
        totalOccurrences: count(studentMisconceptions.id),
        resolvedCount: sql<number>`count(case when ${studentMisconceptions.resolved} = true then 1 end)`,
      })
      .from(studentMisconceptions)
      .innerJoin(
        misconceptionTypes,
        eq(studentMisconceptions.misconceptionTypeId, misconceptionTypes.id),
      )
      .where(inArray(studentMisconceptions.studentId, studentIds))
      .groupBy(
        studentMisconceptions.misconceptionTypeId,
        misconceptionTypes.nameAr,
        misconceptionTypes.name,
        misconceptionTypes.category,
        misconceptionTypes.severity,
        misconceptionTypes.remediationHintAr,
      )
      .orderBy(sql`count(${studentMisconceptions.id}) desc`)
      .limit(50);

    rows = rawRows.map((r) => ({
      ...r,
      misconceptionTypeId: r.misconceptionTypeId ?? '',
      totalOccurrences: Number(r.totalOccurrences),
      resolvedCount: Number(r.resolvedCount),
    }));

    totalDetected = rows.reduce((s, r) => s + r.totalOccurrences, 0);
    resolvedTotal = rows.reduce((s, r) => s + r.resolvedCount, 0);
  }

  const unresolvedTotal = totalDetected - resolvedTotal;

  // Most common category
  const categoryCounts: Record<string, number> = {};
  for (const row of rows) {
    const cat = row.category ?? 'general';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + row.totalOccurrences;
  }
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  // Group by category for section
  const byCategory: Record<string, MisconceptionRow[]> = {};
  for (const row of rows) {
    const cat = row.category ?? 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(row);
  }

  const isEmpty = rows.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader
        title="المفاهيم الخاطئة"
        subtitle="تتبع المفاهيم الخاطئة الشائعة لدى طلابك عبر جميع الفصول"
        icon={AlertCircle}
      />

      {isEmpty ? (
        // ── Empty state ────────────────────────────────────────────────────
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <AlertCircle className="size-10 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground">
              لم يتم اكتشاف أي مفاهيم خاطئة بعد
            </p>
            <p className="text-sm text-muted-foreground/70">
              ستظهر المفاهيم الخاطئة هنا بعد تفاعل الطلاب مع الأنشطة والتقييمات
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Summary stats ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Total */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm text-muted-foreground mb-1">إجمالي المكتشفة</p>
                <p className="text-3xl font-bold tabular-nums">{totalDetected}</p>
              </CardContent>
            </Card>

            {/* Resolved */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  <p className="text-sm">تم حلها</p>
                </div>
                <p className="text-3xl font-bold tabular-nums">{resolvedTotal}</p>
              </CardContent>
            </Card>

            {/* Unresolved */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-1.5 text-destructive mb-1">
                  <XCircle className="size-3.5" aria-hidden="true" />
                  <p className="text-sm">لم تُحل بعد</p>
                </div>
                <p className="text-3xl font-bold tabular-nums">{unresolvedTotal}</p>
              </CardContent>
            </Card>

            {/* Top category */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  <p className="text-sm">الفئة الأكثر شيوعاً</p>
                </div>
                <p className="text-xl font-bold leading-snug">
                  {topCategory ? categoryLabel(topCategory[0]) : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Top misconceptions list ──────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أكثر المفاهيم الخاطئة شيوعاً</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {rows.map((row) => {
                  const resolutionRate =
                    row.totalOccurrences > 0
                      ? Math.round((row.resolvedCount / row.totalOccurrences) * 100)
                      : 0;

                  return (
                    <details
                      key={row.misconceptionTypeId}
                      className="group px-5 py-4 cursor-pointer select-none"
                    >
                      <summary className="list-none">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Name + category */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{row.nameAr}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {categoryLabel(row.category)}
                            </p>
                          </div>

                          {/* Severity badge */}
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium shrink-0 ${severityClasses(row.severity)}`}
                          >
                            {severityLabel(row.severity)}
                          </Badge>

                          {/* Occurrences */}
                          <div className="text-left min-w-[4rem] shrink-0">
                            <p className="text-lg font-bold tabular-nums leading-none">
                              {row.totalOccurrences}
                            </p>
                            <p className="text-xs text-muted-foreground">حالة</p>
                          </div>

                          {/* Resolution rate */}
                          <div className="text-left min-w-[4rem] shrink-0">
                            <p className="text-lg font-bold tabular-nums leading-none">
                              {resolutionRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">محلولة</p>
                          </div>

                          {/* Expand chevron */}
                          <svg
                            className="size-4 text-muted-foreground shrink-0 rotate-0 group-open:-rotate-180 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>

                      {/* Expanded remediation hint */}
                      {row.remediationHintAr && (
                        <div className="mt-3 pt-3 border-t rounded-lg bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">تلميح العلاج: </span>
                          {row.remediationHintAr}
                        </div>
                      )}
                    </details>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── By category section ─────────────────────────────────────────── */}
          {Object.keys(byCategory).length > 1 && (
            <div>
              <h2 className="text-base font-semibold mb-3">توزيع المفاهيم حسب الفئة</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(byCategory)
                  .sort((a, b) => {
                    const sumA = a[1].reduce((s, r) => s + r.totalOccurrences, 0);
                    const sumB = b[1].reduce((s, r) => s + r.totalOccurrences, 0);
                    return sumB - sumA;
                  })
                  .map(([cat, catRows]) => {
                    const catTotal = catRows.reduce((s, r) => s + r.totalOccurrences, 0);
                    const highCount = catRows.filter((r) => r.severity === 'high').length;

                    return (
                      <Card key={cat}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center justify-between">
                            <span>{categoryLabel(cat)}</span>
                            {highCount > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${severityClasses('high')}`}
                              >
                                {highCount} خطير
                              </Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold tabular-nums mb-1">{catTotal}</p>
                          <p className="text-xs text-muted-foreground mb-3">إجمالي الحالات</p>
                          <ul className="space-y-1">
                            {catRows.slice(0, 4).map((r) => (
                              <li
                                key={r.misconceptionTypeId}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="truncate text-muted-foreground flex-1 ml-2">
                                  {r.nameAr}
                                </span>
                                <span className="tabular-nums font-medium shrink-0">
                                  {r.totalOccurrences}
                                </span>
                              </li>
                            ))}
                            {catRows.length > 4 && (
                              <li className="text-xs text-muted-foreground/60 pt-0.5">
                                +{catRows.length - 4} أخرى
                              </li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
