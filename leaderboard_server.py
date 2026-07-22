"""
Prompt Golf Leaderboard Server
Run this on YOUR machine before the class session.

Install:  pip install flask pyngrok
Run:      python leaderboard_server.py
"""

import json
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── In-memory store ──────────────────────────────────────────────────────────
# scores[email][challenge_id] = {score, prompt_tokens, prompt, output}
scores = {}

# ── Challenges ───────────────────────────────────────────────────────────────
# Design principle: naive zero-shot fails. Students must discover the right
# technique (few-shot, CoT, persona, strict format control) through iteration.
CHALLENGES = [
    {
        "id": "q1",
        "number": 1,
        "title": "The Ambiguous Sentiment",
        "concept": "Few-shot prompting — label calibration with ambiguous inputs",
        "description": (
            "A text classifier needs to pick EXACTLY ONE label from: POSITIVE, NEGATIVE, NEUTRAL, MIXED. "
            "The tricky part: the input below contains BOTH a genuine compliment AND a real complaint — "
            "making it MIXED, not POSITIVE or NEGATIVE. "
            "Zero-shot prompts almost always mis-classify it as NEGATIVE because the complaint is more salient. "
            "You need to teach the model the exact definition of MIXED with examples before it sees the input. "
            "Your output must be the single word MIXED and nothing else."
        ),
        "task": (
            "Review: \"The onboarding team was incredibly patient and helpful — "
            "best support experience I've ever had. But the software itself crashes "
            "every time I try to export a PDF, which completely kills my workflow.\""
        ),
        "expected_hint": "MIXED",
        "judge_instruction": (
            "The student was given a review and must classify its sentiment as one of: "
            "POSITIVE, NEGATIVE, NEUTRAL, or MIXED. "
            "The correct answer is MIXED (genuine praise for support + genuine complaint about a crash). "
            "The output must be EXACTLY the single word MIXED and nothing else — "
            "no punctuation, no explanation, no other words. "
            "If the output is anything other than the single word MIXED, answer NO."
        ),
    },
    {
        "id": "q2",
        "number": 2,
        "title": "The Hidden Dependency",
        "concept": "Chain-of-thought — multi-step logic with a dependency trap",
        "description": (
            "A scheduling word problem where the answer changes completely if you miss one constraint. "
            "Three tasks must be completed in sequence — but Task B can only START after BOTH Task A "
            "AND an external approval (which takes 3 days) are done. "
            "Naive models often ignore the approval delay and give 14 instead of the correct 17. "
            "You need to guide the model to identify all dependencies before calculating. "
            "Output only the final integer (number of days), nothing else."
        ),
        "task": (
            "A software release has three sequential tasks: "
            "Task A (coding) takes 5 days. "
            "Task B (QA testing) takes 6 days, but it cannot start until Task A is done "
            "AND a security-compliance approval has been granted — the approval process takes 3 days "
            "and starts on the same day Task A starts. "
            "Task C (deployment) takes 3 days and starts immediately after Task B finishes. "
            "What is the minimum number of days from Day 1 to complete all three tasks?"
        ),
        # Day 1: A starts, approval starts.
        # Day 5: A done. Approval done on Day 3. So B can start Day 6.
        # Day 5: A done. Approval done after 3 days = Day 3+1 = ready Day 4. So Day 6 B starts.
        # Wait: approval takes 3 days starting Day 1 → done end of Day 3. A done end of Day 5.
        # B starts Day 6. B takes 6 days → done end of Day 11. C starts Day 12, takes 3 days → done Day 14.
        # Hmm let me re-check: A=5 days (done end day 5), approval=3 days starting day 1 (done end day 3).
        # B can start day 6 (after A done). B=6 days, done end day 11. C starts day 12, done day 14.
        # So correct answer is 14? Let me recalculate more carefully.
        # A: days 1-5 (5 days). Approval: days 1-3 (3 days, done end of day 3).
        # B prerequisite: A done (end day 5) AND approval done (end day 3). Binding = end day 5.
        # B starts: day 6. B: days 6-11 (6 days, done end day 11).
        # C starts: day 12. C: days 12-14 (3 days, done end day 14).
        # Total = 14 days.
        # The trap: models might add 3 days to A's finish → 5+3+6+3=17. That's wrong.
        # Actually wait, is 17 really wrong? Models might think approval starts after A finishes.
        # Re-reading: "approval process...starts on the same day Task A starts" — so parallel.
        # Answer is 14. The trap is thinking approval is sequential after A.
        "expected_hint": "14",
        "judge_instruction": (
            "The student was given a scheduling problem and must output only the final integer number of days. "
            "Working: Task A takes 5 days (days 1-5). The 3-day approval runs in parallel starting Day 1 "
            "(done end of Day 3). Task B can start Day 6 (after A finishes, since A is the binding constraint). "
            "Task B takes 6 days (days 6-11). Task C takes 3 days (days 12-14). Total = 14 days. "
            "The correct answer is 14. "
            "The output must be EXACTLY the single number 14 and nothing else — "
            "no units, no explanation, no other words. "
            "If the output is anything other than the single number 14, answer NO."
        ),
    },
    {
        "id": "q3",
        "number": 3,
        "title": "The Strict Extractor",
        "concept": "Output format control — multi-field structured extraction with edge-case fields",
        "description": (
            "Extract structured data from a messy incident report and output it in a rigid 5-field format. "
            "Two fields have tricky rules: SEVERITY must be inferred (not stated) from the business impact, "
            "and ROOT_CAUSE must be a single phrase (not a sentence). "
            "Common failures: adding markdown, writing a sentence instead of a phrase for ROOT_CAUSE, "
            "getting SEVERITY wrong, or including any text outside the five lines. "
            "Every field must be exact — one wrong field means the whole answer is wrong."
        ),
        "task": (
            "Incident Report — INC-2047\n"
            "Reported by: Liam Osei (DevOps)\n"
            "At 14:32 UTC the payment processing service became unresponsive. "
            "Root cause identified as a misconfigured database connection pool after a routine config push at 14:15 UTC. "
            "All transactions between 14:32 and 15:08 UTC failed, affecting approximately 4,200 customers. "
            "Revenue impact estimated at $38,000. Service restored at 15:08 UTC after rollback."
        ),
        "expected_hint": (
            "INCIDENT: INC-2047\n"
            "REPORTED_BY: Liam Osei\n"
            "DURATION_MINUTES: 36\n"
            "SEVERITY: CRITICAL\n"
            "ROOT_CAUSE: misconfigured database connection pool"
        ),
        "judge_instruction": (
            "The student was given an incident report and must output exactly five lines:\n"
            "INCIDENT: INC-2047\n"
            "REPORTED_BY: Liam Osei\n"
            "DURATION_MINUTES: 36\n"
            "SEVERITY: CRITICAL\n"
            "ROOT_CAUSE: misconfigured database connection pool\n\n"
            "Check each field: "
            "INCIDENT must be 'INC-2047'. "
            "REPORTED_BY must be 'Liam Osei' (no job title). "
            "DURATION_MINUTES must be 36 (15:08 minus 14:32 = 36 minutes). "
            "SEVERITY must be CRITICAL (4200 customers affected, $38k revenue loss). "
            "ROOT_CAUSE must be 'misconfigured database connection pool' or very close paraphrase — "
            "it must be a short phrase, not a full sentence, and must not include the word 'after'. "
            "If there is any extra text, markdown, bullets, or explanation outside these five lines, answer NO. "
            "Only answer YES if ALL five fields are correct and no extra text is present."
        ),
    },
    {
        "id": "q4",
        "number": 4,
        "title": "The Constraint Juggler",
        "concept": "Multi-constraint prompting — persona + style + content + negative constraints",
        "description": (
            "Write a product pitch that must simultaneously satisfy FIVE hard constraints: "
            "(1) speak as a skeptical CFO (not an enthusiastic marketer), "
            "(2) focus only on cost savings — never mention features or innovation, "
            "(3) use exactly two sentences, "
            "(4) include at least one specific number or percentage, "
            "(5) never use the words 'streamline', 'leverage', or 'solution'. "
            "Naive prompts usually violate at least one constraint — either the tone is too positive, "
            "a banned word sneaks in, or the sentence count is off. "
            "Output only the two-sentence pitch, no extra text."
        ),
        "task": "Write a pitch for an AI-powered expense reporting tool aimed at a Fortune 500 CFO.",
        "expected_hint": (
            "Our finance team cut expense processing costs by 40% in the first quarter after deployment — "
            "with zero additional headcount. "
            "At that rate, the tool pays for itself within six months."
        ),
        "judge_instruction": (
            "The student must write a pitch for an AI expense reporting tool satisfying ALL FIVE constraints: "
            "1) tone is from the perspective of a skeptical CFO or finance professional — not a marketer, "
            "2) focuses on cost savings or ROI only — does NOT mention 'features', 'innovation', or general capabilities, "
            "3) is EXACTLY two sentences (count by terminal punctuation — period, exclamation, question mark), "
            "4) contains at least one specific number or percentage (e.g., '40%', '$200k', '6 months'), "
            "5) does NOT contain any of these words (case-insensitive): 'streamline', 'leverage', 'solution'. "
            "Also: the output must be only the two-sentence pitch — no preamble, no 'Here is:', no extra text. "
            "Answer NO if any single constraint is violated or if there is any text outside the pitch."
        ),
    },
    {
        "id": "q5",
        "number": 5,
        "title": "The Grounded Analyst",
        "concept": "Fact grounding + structured reasoning — no hallucination under ambiguity",
        "description": (
            "Given a short financial data table, answer THREE specific questions and output them in a strict "
            "labeled format. The challenge has two traps: "
            "(1) one question has a 'trick' answer — the data is ambiguous and the honest answer is 'N/A' "
            "because the information is not in the table; models that hallucinate will invent a wrong answer. "
            "(2) the arithmetic for another question requires careful reading — a naive sum gives the wrong result. "
            "Your output must be exactly three labeled lines, no extra text, no invented facts."
        ),
        "task": (
            "Q3 Revenue Summary (USD thousands)\n"
            "| Region       | Q2 Revenue | Q3 Revenue | Q3 Target |\n"
            "|--------------|-----------|-----------|----------|\n"
            "| North America|   4,200   |   4,850   |   4,500  |\n"
            "| Europe       |   3,100   |   2,980   |   3,200  |\n"
            "| Asia-Pacific |   1,800   |   2,310   |   2,100  |\n\n"
            "Answer these three questions:\n"
            "1. Which region MISSED its Q3 target?\n"
            "2. What was the total Q3 revenue across ALL regions (in thousands)?\n"
            "3. What was the company's net profit margin in Q3?"
        ),
        # Q1: Europe (2,980 < 3,200). NA beat target. APAC beat target.
        # Q2: 4,850 + 2,980 + 2,310 = 10,140 (thousands)
        # Q3: Net profit margin is NOT in the table → N/A
        "expected_hint": (
            "MISSED_TARGET: Europe\n"
            "TOTAL_Q3_REVENUE: 10,140\n"
            "NET_PROFIT_MARGIN: N/A"
        ),
        "judge_instruction": (
            "The student was given a revenue table and must answer three questions in exactly this format:\n"
            "MISSED_TARGET: <region>\n"
            "TOTAL_Q3_REVENUE: <number>\n"
            "NET_PROFIT_MARGIN: <value>\n\n"
            "Check each answer: "
            "MISSED_TARGET must be 'Europe' (Q3 revenue 2,980 < target 3,200; other regions beat their targets). "
            "TOTAL_Q3_REVENUE must be 10,140 (4,850 + 2,980 + 2,310 = 10,140 thousands). "
            "NET_PROFIT_MARGIN must be 'N/A' because net profit margin is not provided in the table — "
            "if the student invents a number or percentage, answer NO. "
            "If there is any extra text, explanation, or markdown outside these three lines, answer NO. "
            "Only answer YES if ALL three answers are correct and no extra text is present."
        ),
    },
]

CHALLENGE_MAP = {c["id"]: c for c in CHALLENGES}

# ── HTML leaderboard ─────────────────────────────────────────────────────────
LEADERBOARD_HTML = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="5">
  <title>Prompt Golf Leaderboard</title>
  <style>
    body {{ font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px; }}
    h1 {{ color: #38bdf8; margin-bottom: 4px; }}
    .subtitle {{ color: #94a3b8; margin-bottom: 24px; font-size: 14px; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th {{ background: #1e293b; color: #38bdf8; padding: 10px 16px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }}
    td {{ padding: 10px 16px; border-bottom: 1px solid #1e293b; font-size: 14px; }}
    tr:hover td {{ background: #1e293b; }}
    .rank {{ font-weight: bold; width: 40px; }}
    .total {{ font-weight: bold; color: #38bdf8; }}
    .zero {{ color: #475569; }}
    .score-cell {{ font-family: monospace; }}
    .empty {{ background: #0f172a; }}
    .footer {{ margin-top: 16px; color: #475569; font-size: 12px; }}
  </style>
</head>
<body>
  <h1>Prompt Golf Leaderboard</h1>
  <p class="subtitle">Score = 1000 / prompt_tokens (correct answer only) &nbsp;|&nbsp; Auto-refreshes every 5s</p>
  <table>
    <thead>
      <tr>
        <th class="rank">#</th>
        <th>Student</th>
        <th>Total</th>
        {challenge_headers}
      </tr>
    </thead>
    <tbody>
      {rows}
    </tbody>
  </table>
  <p class="footer">Last updated: {timestamp} &nbsp;|&nbsp; {student_count} student(s) competing</p>
</body>
</html>"""


def build_leaderboard_data():
    rows = []
    for email, challenges in scores.items():
        total = round(sum(v["score"] for v in challenges.values()), 2)
        rows.append({"email": email, "total": total, "challenges": challenges})
    rows.sort(key=lambda r: r["total"], reverse=True)
    return rows


def render_leaderboard():
    import datetime
    rows_data = build_leaderboard_data()
    medals = ["1st", "2nd", "3rd"]

    challenge_headers = "".join(
        f'<th>Q{c["number"]}: {c["title"]}</th>' for c in CHALLENGES
    )

    row_html = ""
    for i, row in enumerate(rows_data):
        rank = medals[i] if i < 3 else str(i + 1)
        cells = ""
        for c in CHALLENGES:
            entry = row["challenges"].get(c["id"])
            if entry:
                cells += f'<td class="score-cell">{entry["score"]}<br><span style="color:#64748b;font-size:11px">{entry["prompt_tokens"]} tokens</span></td>'
            else:
                cells += '<td class="zero">—</td>'
        row_html += f"""
        <tr>
          <td class="rank">{rank}</td>
          <td>{row['email']}</td>
          <td class="total">{row['total']}</td>
          {cells}
        </tr>"""

    if not row_html:
        colspan = 3 + len(CHALLENGES)
        row_html = f'<tr><td colspan="{colspan}" style="text-align:center;color:#475569;padding:40px">No submissions yet — waiting for students...</td></tr>'

    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    return LEADERBOARD_HTML.format(
        challenge_headers=challenge_headers,
        rows=row_html,
        timestamp=timestamp,
        student_count=len(scores),
    )


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def leaderboard():
    return render_leaderboard()


@app.route("/challenges")
def get_challenges():
    # Return challenges without expected_hint (keep answer server-side)
    # but include judge_instruction so the notebook can run the judge locally
    public = [
        {k: v for k, v in c.items() if k != "expected_hint"}
        for c in CHALLENGES
    ]
    return jsonify(public)


@app.route("/submit", methods=["POST"])
def submit():
    data = request.get_json(force=True)
    email = data.get("email", "").strip().lower()
    challenge_id = data.get("challenge_id", "").strip()
    score = float(data.get("score", 0))
    prompt_tokens = int(data.get("prompt_tokens", 0))
    prompt = data.get("prompt", "")
    output = data.get("output", "")

    if not email or challenge_id not in CHALLENGE_MAP:
        return jsonify({"error": "invalid email or challenge_id"}), 400

    if email not in scores:
        scores[email] = {}

    existing = scores[email].get(challenge_id, {})
    if score > existing.get("score", -1):
        scores[email][challenge_id] = {
            "score": score,
            "prompt_tokens": prompt_tokens,
            "prompt": prompt,
            "output": output,
        }
        improved = True
    else:
        improved = False

    rows = build_leaderboard_data()
    rank = next((i + 1 for i, r in enumerate(rows) if r["email"] == email), None)

    return jsonify({
        "status": "ok",
        "improved": improved,
        "best_score": scores[email][challenge_id]["score"],
        "rank": rank,
        "total_students": len(scores),
    })


@app.route("/leaderboard_json")
def leaderboard_json():
    return jsonify(build_leaderboard_data())


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import threading

    def start_ngrok():
        try:
            from pyngrok import ngrok
            import urllib.request, json as _json
            tunnel = ngrok.connect(5000)
            public_url = tunnel.public_url
            print(f"\n  ✅ Share this URL with students:\n")
            print(f"  >>> {public_url} <<<\n")
        except ImportError:
            print("\n  pyngrok not installed — run: pip install pyngrok")
            print("  Or manually: ngrok http 5000 in a separate terminal\n")
        except Exception as e:
            # pyngrok API port conflict — read URL directly from ngrok agent API
            for port in (4040, 4041, 4042):
                try:
                    import urllib.request, json as _json
                    data = _json.loads(urllib.request.urlopen(f"http://localhost:{port}/api/tunnels", timeout=3).read())
                    for t in data.get("tunnels", []):
                        if str(t.get("config", {}).get("addr", "")).endswith("5000"):
                            print(f"\n  ✅ Share this URL with students:\n")
                            print(f"  >>> {t['public_url']} <<<\n")
                            return
                except Exception:
                    continue
            print(f"\n  ngrok error: {e}")
            print("  Run ngrok manually: ngrok http 5000\n")

    print("\n" + "=" * 60)
    print("  Prompt Golf Leaderboard Server")
    print("=" * 60)
    print("  Open your leaderboard at: http://localhost:5000")
    print("  Waiting for ngrok URL...\n")

    threading.Thread(target=start_ngrok, daemon=True).start()

    app.run(host="0.0.0.0", port=5000, debug=False)
