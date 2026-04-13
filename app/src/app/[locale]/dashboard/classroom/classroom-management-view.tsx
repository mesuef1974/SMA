'use client';

import { useActionState, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Copy,
  Check,
  Users,
  GraduationCap,
} from 'lucide-react';
import { createClassroomAction } from './classroom-actions';

// ---------------------------------------------------------------------------
// Types — serializable data passed from the server component
// ---------------------------------------------------------------------------

interface StudentData {
  id: string;
  displayName: string;
  displayNameAr: string;
  joinedAt: string;
  isActive: boolean;
}

interface ClassroomData {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  academicYear: string;
  isActive: boolean;
  studentsCount: number;
  students: StudentData[];
  createdAt: string;
}

interface ClassroomManagementViewProps {
  classrooms: ClassroomData[];
}

/**
 * Client view for teacher classroom management.
 * Shows existing classrooms with codes and student lists,
 * plus a form to create new classrooms.
 */
export function ClassroomManagementView({
  classrooms,
}: ClassroomManagementViewProps) {
  const t = useTranslations('classroom');
  const locale = useLocale();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [state, formAction, pending] = useActionState(createClassroomAction, undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /** Copy classroom code to clipboard. */
  function handleCopyCode(code: string, classroomId: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(classroomId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Reset form on success
  if (state?.success && showCreateForm) {
    setShowCreateForm(false);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-1.5"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('createNew')}
        </Button>
      </div>

      {/* Create classroom form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('createNew')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('className')}</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t('classNamePlaceholder')}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">{t('classNameAr')}</Label>
                  <Input
                    id="nameAr"
                    name="nameAr"
                    type="text"
                    placeholder={t('classNameArPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">{t('academicYear')}</Label>
                <Input
                  id="academicYear"
                  name="academicYear"
                  type="text"
                  placeholder={t('academicYearPlaceholder')}
                  required
                  dir="ltr"
                  defaultValue="2025-2026"
                />
              </div>

              {state?.error && (
                <div
                  className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {state.error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? t('creating') : t('createNew')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Classroom list */}
      {classrooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t('noClassrooms')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {classrooms.map((classroom) => (
            <Card key={classroom.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {locale === 'ar' ? classroom.nameAr : classroom.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {classroom.academicYear}
                    </p>
                  </div>
                  <Badge variant={classroom.isActive ? 'default' : 'secondary'}>
                    {classroom.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Class code display — large for projector visibility */}
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t('classCode')}
                  </p>
                  <p
                    className="text-4xl font-mono font-bold tracking-[0.3em] text-primary"
                    dir="ltr"
                  >
                    {classroom.code}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('shareCode')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() =>
                      handleCopyCode(classroom.code, classroom.id)
                    }
                  >
                    {copiedId === classroom.id ? (
                      <>
                        <Check className="size-3.5" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        {t('copyCode')}
                      </>
                    )}
                  </Button>
                </div>

                {/* Students section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {t('studentsList')} ({t('studentsCount', { count: classroom.studentsCount })})
                    </span>
                  </div>

                  {classroom.students.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      {t('noStudents')}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {classroom.students.map((student) => (
                        <li
                          key={student.id}
                          className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium">
                            {locale === 'ar'
                              ? student.displayNameAr
                              : student.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {student.joinedAt
                              ? new Date(student.joinedAt).toLocaleDateString(
                                  locale === 'ar' ? 'ar-QA' : 'en-US',
                                )
                              : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
