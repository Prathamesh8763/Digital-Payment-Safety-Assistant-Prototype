import os
import json
import time
import uuid
from typing import Dict, Any, List
from schemas.safety import FeedbackRequest, FeedbackResponse

FEEDBACK_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "feedback_store.json")
MAX_FEEDBACK_ENTRIES = 500  # Retention ceiling to prevent disk bloat

class FeedbackService:
    """
    Handles user feedback and corrections without collecting raw message contents or credentials.
    Complies with FR-04:
      - Never requires raw message or credential fields.
      - Enforces retention bounds.
      - Rate-limiting guard against automated spam.
    """

    def __init__(self):
        self._last_submissions: Dict[str, float] = {}

    def record_feedback(self, feedback: FeedbackRequest, client_ip: str = "local") -> FeedbackResponse:
        now = time.time()
        # Rate limit: max 1 submission every 3 seconds per client IP
        last_time = self._last_submissions.get(client_ip, 0)
        if now - last_time < 3.0:
            return FeedbackResponse(
                status="rate_limited",
                feedback_id="throttled",
                message="Feedback submission rate limit reached. Please wait a few seconds."
            )
        self._last_submissions[client_ip] = now

        feedback_id = "fb_" + uuid.uuid4().hex[:10]
        record = {
            "feedback_id": feedback_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "reference_id": feedback.reference_id or "anonymous",
            "assessment_type": feedback.assessment_type,
            "rating": feedback.feedback_rating,
            "category": feedback.feedback_category,
            "comments": feedback.comments[:300] if feedback.comments else None
        }

        # Save to local retention-bounded JSON store
        self._append_to_store(record)

        return FeedbackResponse(
            status="success",
            feedback_id=feedback_id,
            message="Thank you! Your feedback helps us improve detection rules and clarity."
        )

    def _append_to_store(self, record: Dict[str, Any]):
        try:
            records = []
            if os.path.exists(FEEDBACK_FILE_PATH):
                with open(FEEDBACK_FILE_PATH, "r", encoding="utf-8") as f:
                    records = json.load(f)
            records.append(record)
            # Bound storage to MAX_FEEDBACK_ENTRIES
            if len(records) > MAX_FEEDBACK_ENTRIES:
                records = records[-MAX_FEEDBACK_ENTRIES:]
            with open(FEEDBACK_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2)
        except Exception:
            # Safe failure: Feedback storage failure must never crash user workflows
            pass

    def get_feedback_count(self) -> int:
        try:
            if os.path.exists(FEEDBACK_FILE_PATH):
                with open(FEEDBACK_FILE_PATH, "r", encoding="utf-8") as f:
                    return len(json.load(f))
        except Exception:
            pass
        return 0
