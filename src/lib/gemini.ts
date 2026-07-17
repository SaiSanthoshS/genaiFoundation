export async function generatePlaylistNarrative(mood: string, tags: string[], trackCount: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      title: `${mood} Pulse`,
      summary: `A ${mood.toLowerCase()}-shaped playlist built from ${tags.join(", ")} cues and emotional arc planning.`,
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Create a concise playlist title and description for a ${mood} mood playlist using these tags: ${tags.join(", ")}. Keep it under 2 sentences. The playlist has ${trackCount} tracks.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Gemini unavailable");
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const [titleLine, ...descLines] = text.split("\n").filter(Boolean);

    return {
      title: titleLine?.replace(/^Title:\s*/i, "") || `${mood} Pulse`,
      summary: descLines.join(" ").replace(/^Description:\s*/i, "") || `A ${mood.toLowerCase()} playlist with ${trackCount} carefully sequenced tracks.`,
    };
  } catch {
    return {
      title: `${mood} Pulse`,
      summary: `A ${mood.toLowerCase()} playlist generated via the AI mood engine with ${trackCount} tracks.`,
    };
  }
}
