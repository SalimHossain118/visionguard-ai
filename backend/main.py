

from fastapi import FastAPI
from dotenv import load_dotenv
import os

from backend.api.routes import router as api_router

load_dotenv()

app = FastAPI(
    title="VisionGuard AI",
    description="Industrial AI Quality Control System using Computer Vision",
    version="1.0.0",
    contact={
        "name": "VisionGuard Support",
        "url": "https://visionguard.ai/contact",
        "email": "support@visionguard.ai",
    },
    license_info={
       "name": "MIT",
    },
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "VisionGuard AI",
        "version": "1.0.0"
    }

