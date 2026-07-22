const { THEMES } = require("./books");

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

function buildPrompt(title, authorGuess) {
  return `Classify the book titled "${title}"${authorGuess ? " by " + authorGuess : ""} using ONLY theme labels from this exact list:
${THEMES.map((t) => "- " + t).join("\n")}

Respond with ONLY a raw JSON object, no markdown fences, no commentary, in exactly this shape:
{"themes":["Theme A","Theme B"],"pages":123,"author":"Author Name"}

Rules: themes must be 1 to 3 exact strings copied from the list above. pages should be your best real-world estimate of the book's page count as an integer. author should be the real author's full name if you know it, otherwise "${authorGuess || "Unknown"}". If you are not confident this is a real book, still make a reasonable guess using the closest fitting themes.`;
}

function fallbackMetadata(authorGuess) {
  return {
    themes: ["Family Drama"],
    pages: 320,
    author: authorGuess || "Unknown",
    estimated: true
  };
}

async function fetchBookMetadata(title, authorGuess) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY is not set — using fallback metadata for:", title);
    return fallbackMetadata(authorGuess);
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        messages: [{ role: "user", content: buildPrompt(title, authorGuess) }]
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Anthropic API responded ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((c) => c.type === "text");
    if (!textBlock) throw new Error("No text block in Anthropic response");

    const clean = textBlock.text
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(clean);
    const validThemes = (parsed.themes || []).filter((t) => THEMES.includes(t));

    return {
      themes: validThemes.length ? validThemes.slice(0, 3) : ["Family Drama"],
      pages: Number.isFinite(parsed.pages) ? parsed.pages : 320,
      author: parsed.author || authorGuess || "Unknown",
      estimated: false
    };
  } catch (e) {
    console.error("fetchBookMetadata failed, using fallback:", e.message);
    return fallbackMetadata(authorGuess);
  }
}

module.exports = { fetchBookMetadata };
