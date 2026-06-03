import chromadb
import os
from dotenv import load_dotenv

load_dotenv()


class InspectionMemory:
    """
    Manages inspection history using ChromaDB.
    Every completed inspection is stored here.
    Agent 3 queries this to find similar past defects.

    This is the RAG memory layer of VisionGuard AI.
    """

    def __init__(self):
        db_path = os.getenv("CHROMA_DB_PATH", "./backend/data/chromadb")
        os.makedirs(db_path, exist_ok=True)

        self.client = chromadb.PersistentClient(path=db_path)
        self.collection = self.client.get_or_create_collection(
            name="inspection_history",
            metadata={"hnsw:space": "cosine"}
        )
        print(f"InspectionMemory ready. Records: {self.collection.count()}")

    def store(self, inspection_id: str, state: dict):
        """
        Store a completed inspection in ChromaDB.
        Called after every inspection completes.
        """
        document = f"""
        Severity: {state.get('severity')}
        Location: {state.get('defect_location')}
        Coverage: {state.get('coverage_percent')}%
        Anomaly Score: {state.get('anomaly_score')}
        Decision: {state.get('decision')}
        Root Cause: {state.get('root_cause')}
        Report: {state.get('inspection_report', '')[:200]}
        """

        metadata = {
            "severity":         state.get('severity', ''),
            "defect_location":  state.get('defect_location', ''),
            "coverage_percent": float(state.get('coverage_percent', 0)),
            "anomaly_score":    float(state.get('anomaly_score', 0)),
            "decision":         state.get('decision', ''),
            "image_path":       state.get('image_path', ''),
        }

        self.collection.add(
            documents=[document],
            metadatas=[metadata],
            ids=[inspection_id]
        )
        print(f"Inspection stored: {inspection_id}")

    def query(self, state: dict, n_results: int = 5) -> list:
        """
        Find similar past inspections.
        Used by Agent 3 to provide historical context.
        """
        if self.collection.count() == 0:
            return []

        query_text = f"""
        Severity: {state.get('severity')}
        Location: {state.get('defect_location')}
        Coverage: {state.get('coverage_percent')}%
        Anomaly Score: {state.get('anomaly_score')}
        """

        results = self.collection.query(
            query_texts=[query_text],
            n_results=min(n_results, self.collection.count())
        )

        # Safely extract results — Pylance requires explicit None checks
        documents = results.get('documents') or [[]]
        metadatas = results.get('metadatas') or [[]]
        distances = results.get('distances') or [[]]

        if not documents or not documents[0]:
            return []

        similar_cases = []
        for i, doc in enumerate(documents[0]):
            similar_cases.append({
                "document": doc,
                "metadata": metadatas[0][i] if metadatas and metadatas[0] else {},
                "distance": distances[0][i] if distances and distances[0] else 0.0
            })

        return similar_cases

    def count(self) -> int:
        return self.collection.count()