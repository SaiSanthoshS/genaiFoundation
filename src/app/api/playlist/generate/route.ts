import { NextResponse } from "next/server";
import { buildPlaylistForMood } from "@/lib/playlist";
import { getMoodConfig } from "@/lib/mood";
import { generatePlaylistNarrative } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      mood?: string;
      energy?: number;
    };

    const mood = typeof payload.mood === "string" ? payload.mood : "Happy";
    const energy = typeof payload.energy === "number" ? payload.energy : 65;
    const config = getMoodConfig(mood);

    const fallbackPlaylist = buildPlaylistForMood(mood, energy);
    const aiNarrative = await generatePlaylistNarrative(mood, config.tags, fallbackPlaylist.tracks.length);

    return NextResponse.json({
      ...fallbackPlaylist,
      playlistTitle: aiNarrative.title,
      summary: aiNarrative.summary,
      moodTags: config.tags,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to generate a playlist right now." },
      { status: 500 },
    );
  }
}
