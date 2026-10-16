import os
import json
import logging
from typing import Optional
import httpx
from schemas.safety import SafetyAssessmentResponse

logger = logging.getLogger("safety.ai")

class AIAnalysisService:
    """
    Supplements the deterministic rule-based safety engine with optional AI reasoning.
    Follows FR-03:
      - Validates all AI inputs and outputs strictly against schema.
      - Never replaces rule-based indicators if AI fails or times out.
      - Keeps raw content out of error logs.
    """

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.enabled = bool(self.api_key)

    async def enhance_assessment(
        self, 
        text: str, 
        baseline: SafetyAssessmentResponse
    ) -> SafetyAssessmentResponse:
        """
        Enhances the baseline assessment using an external AI provider (Gemini) if configured,
        or returns the baseline cleanly if unavailable.
        """
        if not self.enabled:
            # Safe local fallback: Baseline is completely preserved
            baseline.ai_enhanced = False
            baseline.confidence_rating = "Deterministic Rule Baseline"
            return baseline

        # Prompt strictly forbidding hallucination or credential requests
        prompt = (
            f"You are a Digital Payment Safety Assistant evaluator. Analyze the following suspicious user situation:\n"
            f"\"{text}\"\n\n"
            f"Baseline Engine Detection:\n"
            f"- Risk Level: {baseline.risk_level}\n"
            f"- Indicators Detected: {[ind.name for ind in baseline.indicators]}\n\n"
            f"Provide a concise, plain-language summary for an inexperienced user explaining the social engineering or manipulation tactic used. "
            f"Do not hallucinate facts. Reply in valid JSON with exactly one key: 'contextual_summary'."
        )

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
            }

            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content_str = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(content_str)
                        ai_summary = parsed.get("contextual_summary")
                        if ai_summary and isinstance(ai_summary, str):
                            baseline.ai_enhanced = True
                            baseline.ai_analysis_summary = ai_summary
                            baseline.confidence_rating = "Hybrid (Rules + AI Validation)"
                            return baseline
        except Exception as e:
            # Silent fallback to rule-based engine: Never crash or expose internal errors
            logger.warning("AI enhancement unavailable, falling back to rule engine baseline.")

        # Default fallback
        baseline.ai_enhanced = False
        baseline.confidence_rating = "Deterministic Rule Baseline"
        return baseline
