import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      playlistTitle?: string;
      summary?: string;
      mood?: string;
    };

    return NextResponse.json({
      ok: true,
      savedPlaylistId: `playlist_${Date.now()}`,
      playlistTitle: payload.playlistTitle ?? "Saved Mood Playlist",
      summary: payload.summary ?? "Playlist saved successfully.",
      mood: payload.mood ?? "Happy",
    });
  } catch {
    return NextResponse.json({ error: "Unable to save the playlist right now." }, { status: 500 });
  }
}
