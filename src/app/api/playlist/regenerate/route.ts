import { NextResponse } from "next/server";
import { buildPlaylistForMood } from "@/lib/playlist";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      mood?: string;
      energy?: number;
    };

    const mood = typeof payload.mood === "string" ? payload.mood : "Happy";
    const energy = typeof payload.energy === "number" ? payload.energy : 70;

    return NextResponse.json({
      regenerated: true,
      playlist: buildPlaylistForMood(mood, energy),
    });
  } catch {
    return NextResponse.json({ error: "Unable to regenerate the playlist right now." }, { status: 500 });
  }
}
