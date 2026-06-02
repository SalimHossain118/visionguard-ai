from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cv.patchcore import PatchCoreInference
from agents.pipeline import run_inspection

router = APIRouter()

# Load models at startup — not on every request
# This is critical for performance
# Loading a model takes 2-3 seconds — we do it once
MODELS = {}

def get_model(category: str) -> PatchCoreInference:
    """
    Load model lazily — only when first requested.
    Cache in memory for subsequent requests.
    """
    if category not in MODELS:
        try:
            MODELS[category] = PatchCoreInference(category)
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail=f'Model not found for category: {category}. Train the model first.'
            )
    return MODELS[category]


class InspectionResponse(BaseModel):
    category:               str
    anomaly_score:          float
    severity:               str
    defect_location:        str
    coverage_percent:       float
    is_defective:           bool
    inspection_report:      str
    root_cause:             str
    decision:               str
    decision_justification: str
    heatmap:                list


@router.post("/inspect", response_model=InspectionResponse)
async def inspect_image(
    file:     UploadFile = File(...),
    category: str        = "metal_nut"
):
    """
    Main inspection endpoint.

    Accepts an image file and product category.
    Returns full inspection result including:
    - Anomaly score and heatmap
    - Severity and defect location
    - LLM-generated inspection report
    - Root cause analysis
    - Pass / Rework / Quarantine decision
    """

    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail='File must be an image (jpg, png, etc.)'
        )

    # Validate category
    supported = ['metal_nut', 'transistor', 'leather']
    if category not in supported:
        raise HTTPException(
            status_code=400,
            detail=f'Category must be one of: {supported}'
        )

    # Read image bytes
    image_bytes = await file.read()

    # Run PatchCore inference
    model = get_model(category)
    anomaly_score, heatmap = model.predict_from_bytes(image_bytes)

    # Run LangGraph pipeline
    result = run_inspection(
        image_path=file.filename or "uploaded_image",
        anomaly_score=anomaly_score,
        heatmap=heatmap
    )

    return InspectionResponse(
        category=category,
        anomaly_score=result['anomaly_score'],
        severity=result['severity'],
        defect_location=result['defect_location'],
        coverage_percent=result['coverage_percent'],
        is_defective=result['is_defective'],
        inspection_report=result['inspection_report'],
        root_cause=result['root_cause'],
        decision=result['decision'],
        decision_justification=result['decision_justification'],
        heatmap=result['heatmap']
    )


@router.get("/history")
async def get_history():
    """
    Returns recent inspection history from ChromaDB.
    """
    from memory.chromadb_client import InspectionMemory
    memory = InspectionMemory()
    return {
        "total_inspections": memory.count(),
        "message": "Inspection history endpoint — full implementation in Phase 5"
    }


@router.get("/categories")
async def get_categories():
    """
    Returns supported product categories.
    """
    return {
        "categories": [
            {"id": "metal_nut",   "name": "Metal Nut",   "industry": "Automotive / Industrial"},
            {"id": "transistor",  "name": "Transistor",  "industry": "Electronics"},
            {"id": "leather",     "name": "Leather",     "industry": "Automotive Interior / Luxury"},
        ]
    }