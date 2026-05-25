import numpy as np
from typing import TypedDict


# This is the shared state that flows between all agents in LangGraph.
# Every agent reads from this and adds to it.
# Think of it as the inspection file that gets passed from desk to desk.

class InspectionState(TypedDict):
    # Input from PatchCore
    image_path: str
    anomaly_score: float
    heatmap: list  # numpy array serialized to list for LangGraph compatibility

    # Filled by Agent 1 — Vision Inspector
    severity: str
    defect_location: str
    coverage_percent: float
    max_intensity: float
    mean_intensity: float
    is_defective: bool

    # Filled by Agent 2 — Report Writer
    inspection_report: str

    # Filled by Agent 3 — Root Cause Analyst
    root_cause: str
    similar_past_cases: list

    # Filled by Agent 4 — Decision Router
    decision: str
    decision_justification: str


def vision_inspector(state: InspectionState) -> InspectionState:
    """
    Agent 1 — Vision Inspector

    Receives raw PatchCore output and structures it into
    meaningful inspection data for the downstream agents.

    No LLM needed here — this is pure data processing.
    Fast, deterministic, always runs first.
    """

    heatmap = np.array(state["heatmap"])
    score   = state["anomaly_score"]

    # Determine severity based on anomaly score thresholds
    # These thresholds are tunable business rules
    if score < 0.3:
        severity = "NORMAL"
    elif score < 0.5:
        severity = "LOW"
    elif score < 0.7:
        severity = "MEDIUM"
    elif score < 0.85:
        severity = "HIGH"
    else:
        severity = "CRITICAL"

    # Calculate defect coverage — what percentage of the part is affected
    threshold       = 0.5
    defect_mask     = heatmap > threshold
    coverage        = float(np.sum(defect_mask) / heatmap.size * 100)

    # Find defect location  divide image into 3x3 grid
    # and find which region has the highest anomaly intensity
    h, w    = heatmap.shape
    regions = {
        "top-left":     heatmap[:h//3,    :w//3],
        "top-center":   heatmap[:h//3,    w//3:2*w//3],
        "top-right":    heatmap[:h//3,    2*w//3:],
        "center-left":  heatmap[h//3:2*h//3, :w//3],
        "center":       heatmap[h//3:2*h//3, w//3:2*w//3],
        "center-right": heatmap[h//3:2*h//3, 2*w//3:],
        "bottom-left":  heatmap[2*h//3:,  :w//3],
        "bottom-center":heatmap[2*h//3:,  w//3:2*w//3],
        "bottom-right": heatmap[2*h//3:,  2*w//3:],
    }
    location = max(regions, key=lambda r: regions[r].mean())

    # Update state with structured inspection data
    return {
        **state,
        "severity":         severity,
        "defect_location":  location,
        "coverage_percent": round(coverage, 2),
        "max_intensity":    round(float(heatmap.max()), 4),
        "mean_intensity":   round(float(heatmap.mean()), 4),
        "is_defective":     score >= 0.3,
    }