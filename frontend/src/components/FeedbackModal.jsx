import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, HelpCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

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
      const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_id: referenceId,
          assessment_type: assessmentType || 'text',
          feedback_rating: rating,
          feedback_category: category,
          comments: comments.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Could not submit feedback.');
      }

      const data = await response.json();
      setSubmitted(true);
    } catch (err) {
      setErrorMessage('Feedback submission error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontSize: '0.88rem' }}>
        <CheckCircle2 size={18} />
        <span>Thank you! Your feedback helps us continuously improve safety detection without collecting personal credentials.</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', marginBottom: '0.35rem' }}>
        Was this safety assessment helpful?
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Your feedback helps improve our rule-based engine. We never collect messages, audio, or credentials with feedback.
      </p>

      {/* Rating buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setRating('helpful')}
          className={`btn ${rating === 'helpful' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', minHeight: '34px', borderRadius: '6px' }}
        >
          <ThumbsUp size={14} /> Helpful & Clear
        </button>

        <button
          type="button"
          onClick={() => setRating('unclear')}
          className={`btn ${rating === 'unclear' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', minHeight: '34px', borderRadius: '6px' }}
        >
          <HelpCircle size={14} /> Unclear / Confusing
        </button>

        <button
          type="button"
          onClick={() => setRating('appears_incorrect')}
          className={`btn ${rating === 'appears_incorrect' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', minHeight: '34px', borderRadius: '6px' }}
        >
          <ThumbsDown size={14} /> Appears Incorrect
        </button>
      </div>

      {rating && (
        <form onSubmit={handleSubmit} style={{ animation: 'fadeIn 0.2s ease' }}>
          {(rating === 'unclear' || rating === 'appears_incorrect') && (
            <div style={{ marginBottom: '0.65rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Why does it seem incorrect or unclear?
              </label>
              <select
                className="guided-select"
                style={{ padding: '0.45rem', minHeight: '36px', fontSize: '0.85rem' }}
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Additional Remarks (Optional - Never include PINs, passwords, or personal details):
            </label>
            <input
              type="text"
              className="guided-select"
              style={{ padding: '0.45rem', minHeight: '36px', fontSize: '0.85rem' }}
              placeholder="e.g. This was an official utility bill reminder..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={300}
            />
          </div>

          {errorMessage && (
            <div style={{ color: '#991b1b', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={14} /> {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', minHeight: '34px' }}
          >
            {isSubmitting ? 'Sending Feedback...' : <><Send size={14} /> Submit Feedback</>}
          </button>
        </form>
      )}
    </div>
  );
}
