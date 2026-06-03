from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.utils import convert_to_secret_str
from agents.vision_inspector import InspectionState
import os


def report_writer(state: InspectionState) -> InspectionState:
    """
    Agent 2 — Report Writer

    Receives structured inspection data from Agent 1.
    Uses LLM to generate a human-readable inspection report.
    Written in language a factory operator understands —
    no AI or data science knowledge required.

    Model: Groq + Llama 3 (free tier)
    Switch to GPT-4o-mini by replacing ChatGroq with ChatOpenAI
    """

    # Groq — free tier, use during development
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.3,
        api_key=convert_to_secret_str(os.getenv("GROQ_API_KEY") or "")
    )

    # OpenAI — uncomment when ready, comment out Groq above
    # llm = ChatOpenAI(
    #     model="gpt-4o-mini",
    #     temperature=0.3,
    #     api_key=convert_to_secret_str(os.getenv("OPENAI_API_KEY") or "")
    # )

    system_prompt = """You are an industrial quality control engineer writing
inspection reports for factory operators. Your reports are:
- Clear and concise — operators read them in under 30 seconds
- Factual — based only on the data provided, no assumptions
- Actionable — the operator knows exactly what to do next
- Professional — written like a real QC engineer, not an AI

Never use technical AI/ML terminology like anomaly score or heatmap.
Use manufacturing language: defect, surface irregularity, deviation, affected area."""

    user_prompt = f"""Write a quality inspection report based on these findings:

Part Status    : {"DEFECTIVE" if state["is_defective"] else "NORMAL"}
Severity Level : {state["severity"]}
Defect Location: {state["defect_location"]} of the part
Area Affected  : {state["coverage_percent"]}% of total surface
Anomaly Score  : {state["anomaly_score"]:.4f}

Write a professional 3-paragraph inspection report:
Paragraph 1: What was found and where
Paragraph 2: Assessment of severity and potential impact
Paragraph 3: Recommended immediate action"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    response = llm.invoke(messages)

    return {
        **state,
        "inspection_report": response.content # type: ignore
    }