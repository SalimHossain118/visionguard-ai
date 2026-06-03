from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.utils import convert_to_secret_str
from agents.vision_inspector import InspectionState
from memory.chromadb_client import InspectionMemory
import os


def root_cause_analyst(state: InspectionState) -> InspectionState:
    """
    Agent 3 — Root Cause Analyst

    Queries ChromaDB for similar past defects.
    Uses LLM to reason about probable root causes
    based on current defect + historical context.

    This is what separates VisionGuard AI from a simple
    classifier — it thinks across time, not just one image.
    """

    # Convert state to dict for ChromaDB query
    state_dict = dict(state)

    # Query inspection history for similar cases
    memory = InspectionMemory()
    similar_cases = memory.query(state_dict, n_results=5)

    # Build historical context for the LLM
    if similar_cases:
        history_text = "\n\n".join([
            f"Case {i+1}:\n{case['document']}\nSimilarity: {1 - case['distance']:.2f}"
            for i, case in enumerate(similar_cases)
        ])
    else:
        history_text = "No similar historical cases found. This may be a new defect pattern."

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=convert_to_secret_str(os.getenv("GROQ_API_KEY") or "")
    )

    # OpenAI alternative
    # llm = ChatOpenAI(
    #     model="gpt-4o",
    #     temperature=0.2,
    #     api_key=convert_to_secret_str(os.getenv("OPENAI_API_KEY") or "")
    # )

    system_prompt = """You are a senior manufacturing process engineer with 20 years
of experience in industrial quality control. You analyze defect patterns and identify
root causes based on defect characteristics and historical data.

Your analysis is:
- Based on evidence — defect location, severity, coverage, and historical patterns
- Specific — name probable causes, not vague possibilities
- Concise — 2-3 sentences maximum
- Actionable — suggest what to check on the production line

Common root causes in manufacturing:
- Tool wear or damage
- Material batch variation
- Machine calibration drift
- Operator error
- Environmental factors (temperature, humidity)
- Process parameter deviation (speed, pressure, feed rate)"""

    user_prompt = f"""Analyze this defect and identify the most probable root cause.

CURRENT DEFECT:
Severity      : {state['severity']}
Location      : {state['defect_location']}
Coverage      : {state['coverage_percent']}%
Anomaly Score : {state['anomaly_score']:.4f}

HISTORICAL SIMILAR CASES:
{history_text}

Provide a concise root cause analysis in 2-3 sentences.
If historical patterns suggest a recurring issue, highlight it."""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    response = llm.invoke(messages)

    return {
        **state,
        "root_cause": str(response.content),
        "similar_past_cases": similar_cases
    }