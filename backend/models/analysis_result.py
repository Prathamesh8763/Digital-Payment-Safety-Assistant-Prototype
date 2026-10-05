from pydantic import BaseModel
from typing import List


class AnalysisResult(BaseModel):
    risk_level: str
    reasons: List[str]
    recommendation: str