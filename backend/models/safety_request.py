from pydantic import BaseModel


class SafetyRequest(BaseModel):
    message: str