import { setRequestLocale } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/lib/auth';
import { isAdvisor } from '@/lib/advisor';
import { getLessonPlanById } from '@/db/queries';
import { LessonPlanViewer } from '@/components/lesson-plan/lesson-plan-viewer';
import { AdvisorActionBar } from '@/components/lesson-plan/advisor-action-bar';
import type { LessonPlanData } from '@/lib/lesson-plans/schema';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata() {
  return { title: 'عرض خطة الدرس' };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LessonPlanDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const plan = await getLessonPlanById(id);
  if (!plan || !plan.sectionData) {
    notFound();
  }

  const advisor = isAdvisor(session);
  const ownsPlan = plan.teacherId === session.user.id;
  if (!advisor && !ownsPlan && session.user.role !== 'admin') {
    redirect(`/${locale}/dashboard/lesson-plans`);
  }

  const data = plan.sectionData as LessonPlanData;
  const gate = data.gate_results;
  const advisorGate = gate?.advisor_gate ?? 'pending';

  const reviewerName =
    plan.reviewer?.fullNameAr ?? plan.reviewer?.fullName ?? null;

  return (
    <div dir="rtl" className="space-y-6 p-4 sm:p-6">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          href={
            advisor
              ? `/${locale}/dashboard/advisor/review`
              : `/${locale}/dashboard/lesson-plans`
          }
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>{advisor ? 'العودة إلى قائمة المراجعة' : 'العودة إلى خططي'}</span>
        </Link>
      </div>

      {/* Advisor action bar — visible only to advisors */}
      {advisor && (
        <AdvisorActionBar
          planId={plan.id}
          initialGate={advisorGate}
          reviewerName={reviewerName}
          reviewedAt={gate?.advisor_reviewed_at ?? null}
          notes={gate?.advisor_notes ?? null}
          initialRubric={gate?.advisor_rubric_scores ?? null}
          initialComment={gate?.advisor_comment ?? null}
        />
      )}

      {/* Read-only badge for non-advisor viewers if already approved */}
      {!advisor && advisorGate === 'approved' && (
        <div
          className="rounded-2xl border p-4"
          style={{
            background: 'color-mix(in srgb, var(--success) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)',
          }}
        >
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: 'var(--success)',
                color: 'var(--success-foreground)',
              }}
            >
              مُعتَمد من المستشار
            </span>
            {reviewerName && (
              <span className="text-muted-foreground">
                المراجع: <span className="text-foreground">{reviewerName}</span>
              </span>
            )}
            {gate?.advisor_reviewed_at && (
              <span className="text-muted-foreground" dir="ltr">
                {new Date(gate.advisor_reviewed_at).toLocaleString('ar-QA')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Plan viewer */}
      <LessonPlanViewer plan={data} />
    </div>
  );
}
