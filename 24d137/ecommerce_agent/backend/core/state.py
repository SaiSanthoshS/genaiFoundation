from typing import Dict, Any, List

class AgentContext:
    """Shared context dictionary passed through each agent in the pipeline."""
    def __init__(self, query: str):
        self.original_query: str = query
        self.search_results: List[Dict[str, Any]] = []
        self.viable: bool = False
        self.ranked_results: List[Dict[str, Any]] = []
        self.flags: Dict[str, Any] = {}
        self.alternative_results: List[Dict[str, Any]] = []
        self.explanation: str = ""
        self.coupon_applied: bool = False
        self.winning_store: Dict[str, Any] = {}
        self.status: str = "success"
        self.message: str = ""
        self.identified_product: str = ""
        self.constraints: Dict[str, Any] = {}
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "original_query": self.original_query,
            "search_results": self.search_results,
            "viable": self.viable,
            "ranked_results": self.ranked_results,
            "flags": self.flags,
            "alternative_results": self.alternative_results,
            "explanation": self.explanation,
            "coupon_applied": self.coupon_applied,
            "winning_store": self.winning_store,
            "status": self.status,
            "message": self.message,
            "identified_product": self.identified_product,
            "constraints": self.constraints
        }
