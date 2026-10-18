import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import Button from './ui/Button';
import Alert from './ui/Alert';

export default function FeedbackModal({ referenceId, assessmentType }) {
  const [rating, setRating] = useState(null); // 'helpful' | 'unclear' | 'appears_incorrect'
  const [category, setCategory] = useState('general');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.submitFeedback({
        reference_id: referenceId,
        assessment_type: assessmentType || 'text',
        feedback_rating: rating,
        feedback_category: category,
        comments: comments.trim() || undefined
      });

      setSubmitted(true);
    } catch {
      setErrorMessage('Feedback submission error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          marginTop: '1.25rem',
          padding: '0.85rem',
          background: 'var(--color-success-50)',
          border: '1px solid var(--color-success-200)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-success-800)',
          fontSize: 'var(--font-size-sm)'
        }}
      >
        <CheckCircle2 size={18} aria-hidden="true" />
        <span>Thank you! Your feedback helps us continuously improve safety detection without collecting personal credentials.</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
        Was this safety assessment helpful?
      </div>
      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Your feedback helps improve our rule-based engine. We never collect messages, audio, or credentials with feedback.
      </p>

      {/* Rating buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setRating('helpful')}
          className={`btn ${rating === 'helpful' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-xs)', minHeight: '36px', borderRadius: 'var(--radius-sm)' }}
          aria-pressed={rating === 'helpful'}
        >
          <ThumbsUp size={14} aria-hidden="true" /> Helpful & Clear
        </button>

        <button
          type="button"
          onClick={() => setRating('unclear')}
          className={`btn ${rating === 'unclear' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-xs)', minHeight: '36px', borderRadius: 'var(--radius-sm)' }}
          aria-pressed={rating === 'unclear'}
        >
          <HelpCircle size={14} aria-hidden="true" /> Unclear / Confusing
        </button>

        <button
          type="button"
          onClick={() => setRating('appears_incorrect')}
          className={`btn ${rating === 'appears_incorrect' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-xs)', minHeight: '36px', borderRadius: 'var(--radius-sm)' }}
          aria-pressed={rating === 'appears_incorrect'}
        >
          <ThumbsDown size={14} aria-hidden="true" /> Appears Incorrect
        </button>
      </div>

      {rating && (
        <form onSubmit={handleSubmit} style={{ animation: 'fadeIn 0.2s ease' }}>
          {(rating === 'unclear' || rating === 'appears_incorrect') && (
            <div style={{ marginBottom: '0.65rem' }}>
              <label htmlFor="feedback-category-select" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.25rem' }}>
                Why does it seem incorrect or unclear?
              </label>
              <select
                id="feedback-category-select"
                className="guided-select"
                style={{ padding: '0.45rem', minHeight: '38px', fontSize: 'var(--font-size-sm)' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="false_alarm">False Alarm (Legitimate message was flagged)</option>
                <option value="missed_scam">Missed a Scam (Suspicious behavior wasn't detected)</option>
                <option value="unclear_explanation">Explanation was too technical or confusing</option>
                <option value="general">Other feedback</option>
              </select>
            </div>
          )}

          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="feedback-comments-input" style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.25rem' }}>
              Additional Remarks (Optional - Never include PINs, passwords, or personal details):
            </label>
            <input
              type="text"
              id="feedback-comments-input"
              className="guided-select"
              style={{ padding: '0.45rem', minHeight: '38px', fontSize: 'var(--font-size-sm)' }}
              placeholder="e.g. This was an official utility bill reminder..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={300}
            />
          </div>

          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Sending Feedback..."
            leftIcon={Send}
            style={{ padding: '0.45rem 1rem', fontSize: 'var(--font-size-xs)', minHeight: '38px' }}
          >
            Submit Feedback
          </Button>
        </form>
      )}
    </div>
  );
}
