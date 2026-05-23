import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.vision_inspector import vision_inspector, InspectionState

def test_defective_image():
    # Simulate a heatmap with a defect in bottom-right
    heatmap = np.zeros((224, 224))
    heatmap[160:224, 160:224] = 0.9  # high anomaly bottom-right

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

    result = vision_inspector(state)

    print(f"Severity         : {result['severity']}")
    print(f"Location         : {result['defect_location']}")
    print(f"Coverage         : {result['coverage_percent']}%")
    print(f"Max intensity    : {result['max_intensity']}")
    print(f"Mean intensity   : {result['mean_intensity']}")
    print(f"Is defective     : {result['is_defective']}")

    assert result['severity'] == 'HIGH'
    assert result['defect_location'] == 'bottom-right'
    assert result['is_defective'] == True
    print("\nAll tests passed ✅")

test_defective_image()