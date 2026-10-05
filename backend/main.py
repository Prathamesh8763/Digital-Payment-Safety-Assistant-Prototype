from fastapi import FastAPI

from backend.models.analysis_result import AnalysisResult
from backend.models.safety_request import SafetyRequest
from backend.services.safety_engine import analyze_message


app = FastAPI(
    title="Digital Payment Safety Assistant",
    description="A privacy-focused assistant for identifying potential digital payment scams.",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Digital Payment Safety Assistant API is running"
    }


@app.post("/analyze", response_model=AnalysisResult)
def analyze(request: SafetyRequest):
    return analyze_message(request.message)