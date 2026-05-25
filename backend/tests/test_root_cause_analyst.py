import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from agents.vision_inspector import vision_inspector, InspectionState
from agents.report_writer import report_writer
from agents.root_cause_analyst import root_cause_analyst

# Build initial state
heatmap = np.zeros((224, 224))
heatmap[160:224, 160:224] = 0.9

state = InspectionState(
    image_path="test_image.png",
    anomaly_score=0.7998,
    heatmap=heatmap.tolist(),
    severity="",
    defect_location="",
    coverage_percent=0.0,
    max_intensity=0.0,
    mean_intensity=0.0,
    is_defective=False,
    inspection_report="",
    root_cause="",
    similar_past_cases=[],
    decision="",
    decision_justification=""
)

# Run Agent 1
state = vision_inspector(state)
print(f"Agent 1 ✅ — Severity: {state['severity']}, Location: {state['defect_location']}")

# Run Agent 2
state = report_writer(state)
print(f"Agent 2 ✅ — Report generated ({len(state['inspection_report'])} chars)")

# Run Agent 3
print("\nCalling Agent 3 — Root Cause Analyst...")
state = root_cause_analyst(state)

print("\n--- ROOT CAUSE ANALYSIS ---")
print(state["root_cause"])
print(f"\nSimilar past cases found: {len(state['similar_past_cases'])}")
print("---------------------------")
print("\nAgent 3 complete ✅")