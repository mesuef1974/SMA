'use client';

/**
 * FeedbackForm — S4-10
 *
 * Client component rendered inside the Help page.
 * Sends feedback via POST /api/feedback.
 */

import { useState, type FormEvent } from 'react';

interface FeedbackFormProps {
  /** Pre-translated UI labels from the `help` namespace. */
  labels: {
    contact: string;
    contactDescription: string;
    nameLabel: string;
    typeLabel: string;
    typeBug: string;
    typeSuggestion: string;
    typeQuestion: string;
    messageLabel: string;
    submitFeedback: string;
    feedbackSuccess: string;
    feedbackError: string;
  };
}

type FeedbackType = 'bug' | 'suggestion' | 'question';

/**
 * Feedback / contact form displayed at the bottom of the help page.
 */
export default function FeedbackForm({ labels }: FeedbackFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FeedbackType>('question');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, message: message.trim() }),
      });

      if (res.ok) {
        setStatus('success');
        setName('');
        setType('question');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
        {labels.contact}
      </h2>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        {labels.contactDescription}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="feedback-name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {labels.nameLabel}
          </label>
          <input
            id="feedback-name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Type */}
        <div>
          <label
            htmlFor="feedback-type"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {labels.typeLabel}
          </label>
          <select
            id="feedback-type"
            value={type}
            onChange={(e) => setType(e.target.value as FeedbackType)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="question">{labels.typeQuestion}</option>
            <option value="bug">{labels.typeBug}</option>
            <option value="suggestion">{labels.typeSuggestion}</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="feedback-message"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {labels.messageLabel}
          </label>
          <textarea
            id="feedback-message"
            required
            maxLength={2000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '...' : labels.submitFeedback}
        </button>

        {/* Status messages */}
        {status === 'success' && (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {labels.feedbackSuccess}
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {labels.feedbackError}
          </p>
        )}
      </form>
    </section>
  );
}
