# VisionGuard AI — Hugging Face Spaces Dockerfile
# Two-stage build:
# Stage 1: Build React frontend
# Stage 2: Run FastAPI backend + serve React static files

# ─────────────────────────────────────────────
# Stage 1 — Build React Frontend
# We use Node.js to compile React into static files.
# After this stage, Node.js is discarded — only the
# build output (HTML, CSS, JS) goes to stage 2.
# ─────────────────────────────────────────────
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copy package files first for Docker layer caching
# If dependencies haven't changed, npm install is skipped
COPY frontend/package*.json ./
RUN npm install

# Copy source code and build
COPY frontend/ .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Python Backend
# Installs FastAPI and all backend dependencies.
# Copies the React build output into backend/static/
# FastAPI serves both the API and the React app.
# ─────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# requirements.txt copied first for layer caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy React build output into backend/static/
# FastAPI will serve these files at the root URL
COPY --from=frontend-build /app/build ./backend/static/

# Create necessary directories
RUN mkdir -p backend/models backend/data/chromadb

# HF Spaces requires port 7860
EXPOSE 7860

# Start FastAPI — serves both API and React frontend
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]