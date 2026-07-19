from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta
from typing import Dict, Optional

from flask import Flask, jsonify, render_template, request

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover
    load_dotenv = None

try:
    from groq import Groq
except Exception:  # pragma: no cover
    Groq = None

if load_dotenv is not None:
    load_dotenv()

app = Flask(__name__, template_folder="templates")

plans: Dict[str, dict] = {}
concepts_by_id: Dict[str, dict] = {}
quizzes_by_id: Dict[str, dict] = {}


def get_groq_client() -> Optional[object]:
    if Groq is None:
        return None
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception:
        return None


def parse_json_response(content: str) -> dict:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def build_questions_for_topic(title: str, subject: str, difficulty: str) -> list[dict]:
    difficulty_key = (difficulty or "Intermediate").lower()
    if difficulty_key == "beginner":
        return [
            {
                "prompt": f"What is the simplest idea behind {title} in {subject}?",
                "options": ["A basic concept", "A hidden formula", "A complicated theorem", "An unrelated fact"],
                "correct_answer": "A basic concept",
            },
            {
                "prompt": f"Which example best fits {title}?",
                "options": ["A simple everyday example", "A rare edge case", "A scientific proof", "A random rumor"],
                "correct_answer": "A simple everyday example",
            },
            {
                "prompt": f"Why is {title} useful for beginners?",
                "options": ["It builds a strong foundation", "It creates confusion", "It avoids practice", "It is only for experts"],
                "correct_answer": "It builds a strong foundation",
            },
        ]
    if difficulty_key == "advanced":
        return [
            {
                "prompt": f"How would you evaluate {title} in a real system for {subject}?",
                "options": ["By comparing tradeoffs and constraints", "By ignoring evidence", "By guessing randomly", "By skipping analysis"],
                "correct_answer": "By comparing tradeoffs and constraints",
            },
            {
                "prompt": f"Which statement is most advanced about {title}?",
                "options": ["It requires deeper reasoning and design choices", "It is only about memorizing facts", "It works without context", "It has no practical impact"],
                "correct_answer": "It requires deeper reasoning and design choices",
            },
            {
                "prompt": f"What should a strong answer about {title} include?",
                "options": ["Tradeoffs, reasoning, and examples", "Only a single keyword", "Only a random guess", "Only a title"],
                "correct_answer": "Tradeoffs, reasoning, and examples",
            },
        ]
    return [
        {
            "prompt": f"What is the main takeaway from {title} in {subject}?",
            "options": ["A practical principle", "A random fact", "A historical note", "An unrelated topic"],
            "correct_answer": "A practical principle",
        },
        {
            "prompt": f"Which option best describes {title}?",
            "options": ["Hands-on and actionable", "Purely decorative", "Irrelevant", "Completely optional"],
            "correct_answer": "Hands-on and actionable",
        },
        {
            "prompt": f"Which statement is most relevant to {title}?",
            "options": ["It is useful for real practice", "It is unrelated", "It is purely decorative", "It is optional only"],
            "correct_answer": "It is useful for real practice",
        },
    ]


def generate_plan_with_groq(subject: str, difficulty: str, exam_date: str) -> Optional[dict]:
    client = get_groq_client()
    if client is None:
        return None

    prompt = f"""
    You are building a smart study coach plan.
    Create a JSON object with exactly six topics for learning {subject} at {difficulty} level for an exam on {exam_date}.
    Each topic should have:
    - title
    - summary
    - video_search_query
    - quiz: a list of 3 questions tailored to {difficulty} difficulty. Every question should have prompt, options (4 strings), and correct_answer.
    Return valid JSON only.
    """

    try:
        response = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=[
                {"role": "system", "content": "You are a helpful study planning assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1800,
        )
        content = response.choices[0].message.content
        if not content:
            return None
        return parse_json_response(content)
    except Exception as exc:  # pragma: no cover
        app.logger.warning("Groq generation failed: %s", exc)
        return None


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/plans")
def create_plan():
    payload = request.get_json(silent=True) or {}
    subject = (payload.get("subject") or "Python").strip() or "Python"
    difficulty = (payload.get("difficulty") or "Intermediate").strip() or "Intermediate"
    exam_date = payload.get("exam_date") or (datetime.utcnow() + timedelta(days=14)).strftime("%Y-%m-%d")
    user_id = payload.get("user_id") or "demo-user"

    plan_id = f"plan-{len(plans) + 1}"
    plan = {
        "id": plan_id,
        "user_id": user_id,
        "subject": subject,
        "difficulty": difficulty,
        "exam_date": exam_date,
        "status": "ready",
        "created_at": datetime.utcnow().isoformat(),
        "concept_ids": [],
        "timeline": [],
        "concepts": [],
        "generation_mode": "fallback",
    }

    groq_payload = generate_plan_with_groq(subject, difficulty, exam_date)
    topics = []
    if isinstance(groq_payload, dict):
        raw_topics = groq_payload.get("topics") or []
        if isinstance(raw_topics, list) and raw_topics:
            topics = raw_topics[:6]
            plan["generation_mode"] = "groq"

    if not topics:
        topic_templates = {
            "Beginner": [
                f"Core ideas of {subject}",
                f"Simple examples in {subject}",
                f"Common mistakes in {subject}",
                f"Practical project flow for {subject}",
                f"Good habits for learning {subject}",
                f"Basic review checklist for {subject}",
            ],
            "Intermediate": [
                f"Core principles of {subject}",
                f"Patterns and tradeoffs in {subject}",
                f"Debugging and troubleshooting {subject}",
                f"Performance considerations for {subject}",
                f"Common misconceptions about {subject}",
                f"Real-world examples of {subject}",
            ],
            "Advanced": [
                f"Architecture of {subject}",
                f"Scalable design in {subject}",
                f"Optimization and reliability for {subject}",
                f"Advanced edge cases in {subject}",
                f"Design tradeoffs in {subject}",
                f"System-level reasoning for {subject}",
            ],
        }
        topics = [{"title": title, "summary": f"A focused explanation of {title} tailored to {difficulty} learners.", "video_search_query": title, "quiz": []} for title in topic_templates.get(difficulty, topic_templates["Intermediate"])]

    for idx, topic in enumerate(topics[:6], start=1):
        title = topic.get("title") or f"Topic {idx}"
        summary = topic.get("summary") or f"A focused explanation of {title} tailored to {difficulty} learners."
        video_query = topic.get("video_search_query") or title
        quiz_data = topic.get("quiz") or []

        concept_id = f"concept-{plan_id}-{idx}"
        concept = {
            "id": concept_id,
            "plan_id": plan_id,
            "title": title,
            "summary": summary,
            "video_url": f"https://example.com/videos/{video_query.lower().replace(' ', '-')}",
            "mastery": round(0.35 + (idx * 0.05), 2),
            "ease_factor": 2.5,
            "interval": 1,
            "repetition_count": 0,
        }
        concepts_by_id[concept_id] = concept
        plan["concept_ids"].append(concept_id)
        plan["concepts"].append({
            "id": concept_id,
            "title": title,
            "summary": summary,
            "video_url": concept["video_url"],
            "mastery": concept["mastery"],
        })

        questions = []
        if quiz_data and isinstance(quiz_data, list):
            for item in quiz_data[:3]:
                if isinstance(item, dict):
                    options = item.get("options") or []
                    questions.append({
                        "prompt": item.get("prompt") or f"What is the main takeaway from {title}?",
                        "options": options if len(options) == 4 else ["A practical principle", "A random fact", "A historical note", "An unrelated topic"],
                        "correct_answer": item.get("correct_answer") or (options[0] if options else "A practical principle"),
                    })
        if not questions:
            questions = build_questions_for_topic(title, subject, difficulty)

        quiz = {
            "id": f"quiz-{concept_id}",
            "concept_id": concept_id,
            "questions": questions,
        }
        quizzes_by_id[quiz["id"]] = quiz

    exam_dt = datetime.strptime(exam_date, "%Y-%m-%d").date()
    today = datetime.utcnow().date()
    intervals = [1, 3, 5, 7]
    for idx, concept_id in enumerate(plan["concept_ids"]):
        interval = intervals[min(idx, len(intervals) - 1)]
        review_dt = today + timedelta(days=interval)
        if review_dt > exam_dt:
            review_dt = exam_dt - timedelta(days=1)
        plan["timeline"].append({
            "id": f"session-{plan_id}-{idx}",
            "plan_id": plan_id,
            "concept_id": concept_id,
            "scheduled_date": review_dt.strftime("%Y-%m-%d"),
            "status": "pending",
            "interval_days": interval,
        })

    plan["timeline"].sort(key=lambda item: item["scheduled_date"])
    plans[plan_id] = plan

    return jsonify({
        "plan_id": plan_id,
        "subject": subject,
        "difficulty": difficulty,
        "exam_date": exam_date,
        "status": "ready",
        "timeline": plan["timeline"],
        "concepts": plan["concepts"],
        "generation_mode": plan["generation_mode"],
    })


@app.get("/plans/<plan_id>")
def get_plan(plan_id: str):
    plan = plans.get(plan_id)
    if not plan:
        return jsonify({"error": "Plan not found"}), 404
    return jsonify(plan)


@app.get("/plans/<plan_id>/timeline")
def get_timeline(plan_id: str):
    plan = plans.get(plan_id)
    if not plan:
        return jsonify({"error": "Plan not found"}), 404
    return jsonify({"plan_id": plan_id, "timeline": plan.get("timeline", [])})


@app.get("/quiz/<concept_id>")
def get_quiz(concept_id: str):
    concept = concepts_by_id.get(concept_id)
    if not concept:
        return jsonify({"error": "Concept not found"}), 404

    quiz_id = f"quiz-{concept_id}"
    quiz = quizzes_by_id.get(quiz_id)
    if not quiz:
        quiz = {
            "id": quiz_id,
            "concept_id": concept_id,
            "questions": [
                {
                    "prompt": f"What is the main takeaway from {concept['title']}?",
                    "options": ["A practical principle", "A random fact", "A historical note", "An unrelated topic"],
                    "correct_answer": "A practical principle",
                }
            ],
        }
        quizzes_by_id[quiz_id] = quiz

    return jsonify({"concept": concept, "quiz": quiz})


@app.post("/quiz/<quiz_id>/submit")
def submit_quiz(quiz_id: str):
    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers", [])
    quiz = quizzes_by_id.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    score = 0
    for idx, question in enumerate(quiz["questions"]):
        user_answer = answers[idx] if idx < len(answers) else None
        if user_answer == question["correct_answer"]:
            score += 1

    concept_id = quiz["concept_id"]
    concept = concepts_by_id[concept_id]
    accuracy = round(score / max(1, len(quiz["questions"])), 2)

    concept["mastery"] = round(min(1.0, max(0.1, concept["mastery"] * 0.65 + accuracy * 0.35)), 2)
    concept["repetition_count"] += 1

    if accuracy >= 0.8:
        concept["interval"] = max(2, concept["interval"] + 2)
        concept["ease_factor"] = round(min(3.5, concept["ease_factor"] + 0.1), 2)
    else:
        concept["interval"] = max(1, concept["interval"] // 2)
        concept["ease_factor"] = round(max(1.3, concept["ease_factor"] - 0.1), 2)

    for plan in plans.values():
        if concept_id in plan.get("concept_ids", []):
            for session in plan.get("timeline", []):
                if session["concept_id"] == concept_id and session["status"] != "done":
                    session["status"] = "done"
                    session["completed_at"] = datetime.utcnow().isoformat()
                    break
            break

    return jsonify({
        "score": score,
        "total": len(quiz["questions"]),
        "accuracy": accuracy,
        "concept_mastery": concept["mastery"],
        "next_interval_days": concept["interval"],
        "feedback": "Great work!" if accuracy >= 0.8 else "A quick review will help this topic stick.",
    })


@app.get("/dashboard/<user_id>")
def get_dashboard(user_id: str):
    user_plans = [plan for plan in plans.values() if plan.get("user_id") == user_id]
    if not user_plans:
        return jsonify({"user_id": user_id, "streak": 0, "mastery": 0.0, "concepts": []})

    all_concepts = []
    completed_sessions = 0
    total_sessions = 0
    for plan in user_plans:
        for session in plan.get("timeline", []):
            total_sessions += 1
            if session.get("status") == "done":
                completed_sessions += 1
        for concept_id in plan.get("concept_ids", []):
            concept = concepts_by_id.get(concept_id)
            if concept:
                all_concepts.append({
                    "id": concept["id"],
                    "title": concept["title"],
                    "mastery": concept["mastery"],
                })

    overall_mastery = round(sum(item["mastery"] for item in all_concepts) / len(all_concepts), 2) if all_concepts else 0.0
    streak = min(7, max(0, completed_sessions))
    return jsonify({
        "user_id": user_id,
        "streak": streak,
        "mastery": overall_mastery,
        "completion": round(completed_sessions / total_sessions, 2) if total_sessions else 0.0,
        "concepts": all_concepts,
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
