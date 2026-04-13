'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { joinClassAction } from './join-action';

/**
 * Client component for the student join form.
 * Students enter a 6-character class code and their display name.
 */
export function StudentJoinForm() {
  const t = useTranslations('student');
  const [state, formAction, pending] = useActionState(joinClassAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-2xl font-bold">
            م
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('welcome')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('classCode')}</Label>
              <Input
                id="code"
                name="code"
                type="text"
                placeholder={t('classCodePlaceholder')}
                required
                maxLength={6}
                minLength={6}
                dir="ltr"
                className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">{t('studentName')}</Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder={t('studentNamePlaceholder')}
                required
                autoComplete="name"
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

            <Button type="submit" className="w-full text-lg py-5" disabled={pending}>
              {pending ? t('joining') : t('joinClass')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
