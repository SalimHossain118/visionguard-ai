from fastapi import APIRouter, File, UploadFile

router = APIRouter()

@router.get("/inspect")
def inspect():

    return {
        "message": "Inspection endpoint is under development."
    }

@router.post("/inspect")
def inspect_image( image:UploadFile = File(...)):

    return {
        "filename": image.filename,
        "content_type": image.content_type,
        "prediction": "placeholder_label",
        "confidence": 0.95,
        "status": "processed"
    }

@router.get("/history")
async def get_history():

    return {
       "history": [
            {
                "id": 1,
                "timestamp": "2026-04-28T10:00:00Z",
                "label": "healthy",
                "confidence": 0.98
            },
            {
                "id": 2,
                "timestamp": "2026-04-29T14:30:00Z",
                "label": "defect_detected",
                "confidence": 0.88
            }
        ]
    }   