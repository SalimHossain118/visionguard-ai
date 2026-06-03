from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# Download sample images from HF Hub on startup if not present
# Download sample images from HF Hub on startup if not present
try:
    from utils.download_assets import download_samples
    download_samples()
except Exception as e:
    print(f"Warning: Could not download samples: {e}")

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

# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:80",
        "https://*.hf.space",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes — must be registered before the catch-all frontend route
from api.routes import router as api_router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "VisionGuard AI",
        "version": "1.0.0"
    }


# Serve React frontend static files
# This runs only when the React build exists (production/HF Spaces)
# In local development the React dev server runs separately on port 3000
static_path = os.path.join(os.path.dirname(__file__), 'static')

if os.path.exists(static_path):
    # Serve React's static assets (JS, CSS, images)
    app.mount(
        '/static',
        StaticFiles(directory=os.path.join(static_path, 'static')),
        name='static'
    )

    # Catch-all route — serves React's index.html for all non-API routes
    # This is required for React Router to work correctly
    @app.get('/{full_path:path}')
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(static_path, 'index.html'))