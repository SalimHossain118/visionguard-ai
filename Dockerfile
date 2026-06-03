# VisionGuard AI — Hugging Face Spaces Dockerfile
# This file is used specifically for HF Spaces deployment
# The docker/ folder contains local development Dockerfiles

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy environment example
COPY .env.example .

# Create necessary directories
RUN mkdir -p backend/models backend/data/chromadb

# HF Spaces requires port 7860
EXPOSE 7860

# Start FastAPI on port 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]