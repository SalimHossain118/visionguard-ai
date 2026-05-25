import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from agents.vision_inspector import vision_inspector, InspectionState
from agents.report_writer import report_writer
from agents.root_cause_analyst import root_cause_analyst
from agents.decision_router import decision_router

# Build initial state
heatmap = np.zeros((224, 224))
heatmap[160:224, 160:224] = 0.9

state = InspectionState(
    image_path="test_metal_nut.png",
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

print("=" * 50)
print("VISIONGUARD AI — FULL PIPELINE TEST")
print("=" * 50)

# Agent 1
state = vision_inspector(state)
print(f"\nAgent 1 ✅ Vision Inspector")
print(f"  Severity : {state['severity']}")
print(f"  Location : {state['defect_location']}")
print(f"  Coverage : {state['coverage_percent']}%")

# Agent 2
state = report_writer(state)
print(f"\nAgent 2 ✅ Report Writer")
print(f"  Report   : {state['inspection_report'][:100]}...")

# Agent 3
state = root_cause_analyst(state)
print(f"\nAgent 3 ✅ Root Cause Analyst")
print(f"  Cause    : {state['root_cause'][:100]}...")

# Agent 4
state = decision_router(state)
print(f"\nAgent 4 ✅ Decision Router")
print(f"  Decision : {state['decision']}")
print(f"  Reason   : {state['decision_justification']}")

print("\n" + "=" * 50)
print(f"FINAL DECISION: {state['decision']}")
print("=" * 50)