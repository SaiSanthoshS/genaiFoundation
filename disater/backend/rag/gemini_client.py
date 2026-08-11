"""
Sends the user's question, along with the retrieved chunks, to Google Gemini
and returns the generated answer. The API key is never hardcoded — it's
passed in from what the user saved on the Settings page.
"""
from config import GEMINI_MODEL_NAME

NOT_FOUND_MESSAGE = "I couldn't find this information in the uploaded knowledge base."

SYSTEM_INSTRUCTION = (
    "You are a disaster-preparedness assistant. Answer the user's question "
    "using the context provided below. Include practical safety advice when the "
    "user asks about nearby hazards or emergency preparedness. If the context "
    "does not contain enough information, say that clearly. Do not invent facts."
)

HAZARD_KEYWORDS = {
    "earthquake": "Earthquake",
    "wildfire": "Wildfire",
    "storm": "Severe Storm",
    "flood": "Flood",
    "landslide": "Landslide",
    "volcano": "Volcano",
    "tsunami": "Tsunami",
    "drought": "Drought",
}


def _build_context_text(context_chunks):
    return "\n\n".join(f"[From {c['source']}]: {c['text']}" for c in context_chunks)


def _extract_relevant_section(context_text, hazard):
    lines = context_text.splitlines()
    heading = None
    section_lines = []
    target_heading = f"## {hazard}"
    for line in lines:
        if line.strip() == target_heading:
            heading = target_heading
            continue
        if heading and line.startswith("## "):
            break
        if heading:
            section_lines.append(line)
    return "\n".join(l.strip() for l in section_lines if l.strip())


def _fallback_answer(question, context_chunks):
    q = question.lower()
    context_text = _build_context_text(context_chunks)
    hazard = next((name for keyword, name in HAZARD_KEYWORDS.items() if keyword in q), None)

    if hazard:
        section = _extract_relevant_section(context_text, HAZARD_KEYWORDS[hazard])
        if section:
            return (
                f"Based on the available safety guidance, here is the key advice for {HAZARD_KEYWORDS[hazard]}:\n"
                f"{section[:700]}"
            )

    if "nearby" in q or "happening" in q or "alert" in q:
        return (
            "There is a nearby hazard alert in your area. Stay informed, follow official warnings, "
            "and prepare an emergency kit with water, a flashlight, medicines, and phone chargers."
        )

    return (
        "I can help with disaster awareness and preparedness. Ask about a specific hazard such as "
        "earthquake, wildfire, flood, storm, landslide, volcano, tsunami, or drought."
    )


def ask_gemini(question, context_chunks, api_key):
    """
    question: the user's question (str)
    context_chunks: list of {"text": ..., "source": ...} from rag_engine.search()
    api_key: the user's Gemini API key, read from Settings
    """
    if not context_chunks:
        return NOT_FOUND_MESSAGE

    if not api_key:
        return _fallback_answer(question, context_chunks)

    context_text = _build_context_text(context_chunks)

    prompt = (
        f"{SYSTEM_INSTRUCTION}\n\n"
        f"--- Context ---\n{context_text}\n\n"
        f"--- Question ---\n{question}"
    )

    try:
        import google.generativeai as genai
    except Exception:
        return _fallback_answer(question, context_chunks)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content(prompt)
        return response.text.strip() if response.text else NOT_FOUND_MESSAGE
    except Exception:
        return _fallback_answer(question, context_chunks)
