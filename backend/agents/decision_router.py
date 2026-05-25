from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.utils import convert_to_secret_str
from agents.vision_inspector import InspectionState
import os


def decision_router(state: InspectionState) -> InspectionState:
    """
    Agent 4 — Decision Router

    Makes the final Pass / Rework / Quarantine decision.
    Combines CV data, inspection report, and root cause analysis.
    Applies business rules then uses LLM to justify the decision
    in plain language the operator can understand and trust.

    This is the last agent in the pipeline.
    Its output goes directly to the React dashboard.
    """

    # Business rules — applied before LLM
    # These are deterministic and fast
    # LLM is used only for justification, not for the decision itself
    score    = state["anomaly_score"]
    severity = state["severity"]
    coverage = state["coverage_percent"]

    # Decision logic — based on severity + coverage
    if severity == "NORMAL" or score < 0.3:
        decision = "PASS"
    elif severity == "CRITICAL" or coverage > 20.0:
        decision = "QUARANTINE"
    elif severity in ["HIGH", "MEDIUM"] and coverage <= 20.0:
        decision = "REWORK"
    elif severity == "LOW":
        decision = "PASS"
    else:
        decision = "REWORK"  # default safe decision

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.1,
        api_key=convert_to_secret_str(os.getenv("GROQ_API_KEY") or "")
    )

    # OpenAI alternative
    # llm = ChatOpenAI(
    #     model="gpt-4o",
    #     temperature=0.1,
    #     api_key=convert_to_secret_str(os.getenv("OPENAI_API_KEY") or "")
    # )

    system_prompt = """You are a quality control decision system in a manufacturing plant.
Your job is to explain a quality control decision to a factory operator in one clear sentence.

Rules:
- Be direct — start with the decision
- Explain why in simple manufacturing terms
- Never use AI/ML terminology
- Maximum one sentence"""

    user_prompt = f"""The quality control system has made this decision: {decision}

Based on these findings:
- Severity: {severity}
- Defect location: {state['defect_location']}
- Area affected: {coverage}% of surface
- Root cause analysis: {state['root_cause'][:200]}

Write one sentence explaining this {decision} decision to the factory operator."""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    response = llm.invoke(messages)

    return {
        **state,
        "decision":               decision,
        "decision_justification": str(response.content)
    }