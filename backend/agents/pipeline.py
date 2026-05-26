import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langgraph.graph import StateGraph, END
from agents.vision_inspector import vision_inspector, InspectionState
from agents.report_writer import report_writer
from agents.root_cause_analyst import root_cause_analyst
from agents.decision_router import decision_router
from memory.chromadb_client import InspectionMemory
import uuid


def build_pipeline():
    """
    Builds the LangGraph orchestration graph.
    Connects all 4 agents into one unified pipeline.
    """

    graph = StateGraph(InspectionState)

    # Add all 4 agents as nodes
    graph.add_node("vision_inspector",    vision_inspector)
    graph.add_node("report_writer",       report_writer)
    graph.add_node("root_cause_analyst",  root_cause_analyst)
    graph.add_node("decision_router",     decision_router)

    # Define the flow — linear for now
    graph.set_entry_point("vision_inspector")
    graph.add_edge("vision_inspector",   "report_writer")
    graph.add_edge("report_writer",      "root_cause_analyst")
    graph.add_edge("root_cause_analyst", "decision_router")
    graph.add_edge("decision_router",    END)

    return graph.compile()


def run_inspection(image_path: str, anomaly_score: float, heatmap: list) -> dict:
    """
    Run the full inspection pipeline on one image.
    This is the single entry point called by FastAPI.

    Returns the complete inspection state with:
    - severity, location, coverage
    - inspection report
    - root cause analysis
    - final decision + justification
    """

    pipeline = build_pipeline()

    initial_state = InspectionState(
        image_path=image_path,
        anomaly_score=anomaly_score,
        heatmap=heatmap,
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

    # Run the pipeline
    final_state = pipeline.invoke(initial_state)

    # Store completed inspection in ChromaDB
    memory = InspectionMemory()
    inspection_id = str(uuid.uuid4())
    memory.store(inspection_id, final_state)

    return final_state


if __name__ == "__main__":
    # Quick test
    import numpy as np

    heatmap = np.zeros((224, 224))
    heatmap[160:224, 160:224] = 0.9

    result = run_inspection(
        image_path="test.png",
        anomaly_score=0.7998,
        heatmap=heatmap.tolist()
    )

    print(f"Decision : {result['decision']}")
    print(f"Reason   : {result['decision_justification']}")