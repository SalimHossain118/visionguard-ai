from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cv.patchcore import PatchCoreInference
from agents.pipeline import run_inspection

router = APIRouter()

# Load models at startup — not on every request.
# Loading a model takes 2-3 seconds — we do it once and cache.
MODELS = {}


def get_model(category: str) -> PatchCoreInference:
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
    Runs PatchCore + LangGraph pipeline.
    Returns full inspection result.
    """

    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='File must be an image.')

    supported = ['metal_nut', 'transistor', 'leather']
    if category not in supported:
        raise HTTPException(status_code=400, detail=f'Category must be one of: {supported}')

    image_bytes = await file.read()

    model = get_model(category)
    anomaly_score, heatmap = model.predict_from_bytes(image_bytes)

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
async def get_history(limit: int = 50):
    """
    Returns real inspection history from ChromaDB.
    Frontend loads this on startup to restore history across all devices.
    """
    from memory.chromadb_client import InspectionMemory
    memory = InspectionMemory()

    if memory.count() == 0:
        return {"total": 0, "inspections": []}

    results = memory.collection.get(
        limit=limit,
        include=["documents", "metadatas"]
    )

    # Safe extraction — Pylance requires explicit None checks
    metadatas = results.get('metadatas') or []
    documents = results.get('documents') or []
    ids       = results.get('ids') or []

    inspections = []
    for i, metadata in enumerate(metadatas):
        inspections.append({
            "id":               ids[i] if i < len(ids) else str(i),
            "anomaly_score":    metadata.get('anomaly_score', 0),
            "severity":         metadata.get('severity', ''),
            "defect_location":  metadata.get('defect_location', ''),
            "coverage_percent": metadata.get('coverage_percent', 0),
            "decision":         metadata.get('decision', ''),
            "category":         metadata.get('image_path', ''),
            "timestamp":        metadata.get('timestamp', ''),
            "inspection_report": documents[i] if i < len(documents) else '',
        })

    # Most recent first
    inspections.sort(key=lambda x: x['timestamp'], reverse=True)

    return {
        "total":       memory.count(),
        "inspections": inspections
    }


@router.get("/categories")
async def get_categories():
    """Returns supported product categories."""
    return {
        "categories": [
            {"id": "metal_nut",  "name": "Metal Nut",  "industry": "Automotive / Industrial"},
            {"id": "transistor", "name": "Transistor", "industry": "Electronics"},
            {"id": "leather",    "name": "Leather",    "industry": "Automotive Interior / Luxury"},
        ]
    }