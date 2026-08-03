"""
LangGraph Workflow — orchestrates the full career copilot pipeline.

Pipeline:
  parse_resume → ats_analysis → search_jobs → match_jobs
                                                  ↓
                              cover_letter ← top_match → tailor_resume
                                                  ↓
                                          interview_prep → career_advice
"""

from langgraph.graph import StateGraph, END

from agents.state import CareerCopilotState
from agents.nodes import (
    parse_resume_node,
    ats_analysis_node,
    search_jobs_node,
    match_jobs_node,
    generate_cover_letter_node,
    tailor_resume_node,
    interview_prep_node,
    career_advice_node,
)


def _should_continue_after_match(state: CareerCopilotState) -> str:
    """Decide whether to continue to cover letter generation."""
    if state.get("top_match"):
        return "generate_cover_letter"
    return END


def build_career_graph() -> StateGraph:
    """
    Build the LangGraph state graph for the full career copilot pipeline.

    Returns a compiled graph ready to invoke.
    """
    graph = StateGraph(CareerCopilotState)

    # ── Add nodes ────────────────────────────────────────────────────────
    graph.add_node("parse_resume", parse_resume_node)
    graph.add_node("ats_analysis", ats_analysis_node)
    graph.add_node("search_jobs", search_jobs_node)
    graph.add_node("match_jobs", match_jobs_node)
    graph.add_node("generate_cover_letter", generate_cover_letter_node)
    graph.add_node("tailor_resume", tailor_resume_node)
    graph.add_node("interview_prep", interview_prep_node)
    graph.add_node("career_advice", career_advice_node)

    # ── Define edges (linear pipeline with conditional branch) ───────────
    graph.set_entry_point("parse_resume")

    graph.add_edge("parse_resume", "ats_analysis")
    graph.add_edge("ats_analysis", "search_jobs")
    graph.add_edge("search_jobs", "match_jobs")

    # After matching, conditionally proceed to cover letter
    graph.add_conditional_edges(
        "match_jobs",
        _should_continue_after_match,
        {
            "generate_cover_letter": "generate_cover_letter",
            END: END,
        },
    )

    graph.add_edge("generate_cover_letter", "tailor_resume")
    graph.add_edge("tailor_resume", "interview_prep")
    graph.add_edge("interview_prep", "career_advice")
    graph.add_edge("career_advice", END)

    return graph.compile()


# ── Convenience runner ───────────────────────────────────────────────────────

def run_full_pipeline(
    resume_text: str,
    job_query: str = "software engineer",
    user_id: str = "",
) -> CareerCopilotState:
    """
    Run the full career copilot pipeline.

    Args:
        resume_text: Raw text from the resume
        job_query: What kind of jobs to search for
        user_id: Current user's ID

    Returns:
        Final state with all results
    """
    graph = build_career_graph()

    initial_state: CareerCopilotState = {
        "user_id": user_id,
        "resume_text": resume_text,
        "job_query": job_query,
        "errors": [],
        "current_step": "started",
    }

    final_state = graph.invoke(initial_state)
    return final_state
