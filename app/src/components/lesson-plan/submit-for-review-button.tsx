'use client';

/**
 * SubmitForReviewButton — submits a lesson plan for advisor review.
 *
 * Visible only while status ∈ { 'draft', 'changes_requested' }.
 * On success calls onSubmitted() so the parent can flip local state
 * (hide the button, show a "قيد المراجعة" badge).
 *
 * Uses the app's ToastProvider for success feedback and an inline
 * Alert for errors so users can see the full message.
 */

import { useCallback, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast-provider';

interface Props {
  planId: string;
  status: string | null;
  onSubmitted: () => void;
}

export function SubmitForReviewButton({ planId, status, onSubmitted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const eligible = status === 'draft' || status === 'changes_requested';

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/lesson-plans/${planId}/submit-for-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        let msg = body.error ?? `HTTP ${res.status}`;
        if (res.status === 409) {
          msg = 'لا يمكن إرسال الخطة للمراجعة في حالتها الحالية.';
        } else if (res.status === 401 || res.status === 403) {
          msg = 'غير مصرّح — يرجى تسجيل الدخول وإعادة المحاولة.';
        }
        setError(msg);
        return;
      }

      showToast({
        type: 'correct',
        title: 'تم إرسال الخطة للمراجعة',
        message: 'سيتم إعلامك بعد مراجعة المستشار.',
        duration: 3500,
      });
      onSubmitted();
    } catch {
      setError('فشل الاتصال بالخادم. يرجى إعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  }, [planId, onSubmitted, showToast]);

  if (!eligible) return null;

  return (
    <div className="flex flex-col items-stretch gap-2">
      <Button
        size="sm"
        onClick={submit}
        disabled={loading}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {loading ? 'جارٍ الإرسال…' : 'إرسال للمراجعة'}
      </Button>
      {error && (
        <Alert variant="error" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
