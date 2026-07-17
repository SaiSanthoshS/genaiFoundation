"use client";

import { FormEvent, useState } from "react";

type PlaylistTrack = {
  title: string;
  artist: string;
  album: string;
  duration: string;
  moodScore: number;
  energy: number;
  valence: number;
  tempo: number;
  previewUrl: string;
};

type PlaylistResponse = {
  playlistTitle: string;
  summary: string;
  moodTags?: string[];
  statistics: {
    averageBpm: number;
    averageEnergy: number;
    averageValence: number;
    durationMinutes: number;
    genres: string[];
  };
  tracks: PlaylistTrack[];
};

const moods = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😢", label: "Sad" },
  { emoji: "⚡", label: "Energetic" },
  { emoji: "😍", label: "Romantic" },
];

export default function Home() {
  const [selectedMood, setSelectedMood] = useState("Happy");
  const [energy, setEnergy] = useState(65);
  const [isLoading, setIsLoading] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/playlist/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, energy }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate the playlist right now.");
      }

      const data = (await response.json()) as PlaylistResponse;
      setPlaylist(data);
      setSavedPlaylistId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!playlist) {
      return;
    }

    try {
      const response = await fetch("/api/playlist/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistTitle: playlist.playlistTitle,
          summary: playlist.summary,
          mood: selectedMood,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save the playlist.");
      }

      const data = (await response.json()) as { savedPlaylistId?: string; playlistTitle?: string };
      setSavedPlaylistId(data.savedPlaylistId ?? null);
      setNotice(`${data.playlistTitle ?? "Playlist"} saved successfully.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save playlist.");
    }
  }

  async function handleRegenerate() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/playlist/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, energy }),
      });

      if (!response.ok) {
        throw new Error("Unable to regenerate the playlist.");
      }

      const data = (await response.json()) as { playlist: PlaylistResponse };
      setPlaylist(data.playlist);
      setSavedPlaylistId(null);
      setNotice("Playlist regenerated with a new emotional curve.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport() {
    if (!playlist) {
      return;
    }

    const payload = {
      title: playlist.playlistTitle,
      summary: playlist.summary,
      tracks: playlist.tracks,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${playlist.playlistTitle.toLowerCase().replace(/\s+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Playlist exported as JSON.");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937,_#020617_60%)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">AI Music Mood Playlist Generator</p>
              <h1 className="mt-2 text-4xl font-semibold">Mood-first playlist generation</h1>
            </div>
            <div className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">
              Advanced Module aligned MVP
            </div>
          </div>

          <form onSubmit={handleGenerate} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">Choose a mood</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setSelectedMood(mood.label)}
                    className={`rounded-2xl border px-4 py-3 text-center transition ${
                      selectedMood === mood.label
                        ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                        : "border-white/10 bg-slate-900/60 text-slate-100 hover:border-white/30"
                    }`}
                  >
                    <div className="text-2xl">{mood.emoji}</div>
                    <div className="mt-1 text-sm font-medium">{mood.label}</div>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium text-slate-200">
                Energy intensity: <span className="text-cyan-300">{energy}</span>
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={energy}
                onChange={(event) => setEnergy(Number(event.target.value))}
                className="w-full accent-cyan-400"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Generating playlist..." : "Generate Playlist"}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={!playlist || isLoading}
                  className="rounded-full border border-white/15 bg-slate-900/60 px-5 py-3 font-semibold text-white transition hover:border-cyan-300"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!playlist || isLoading}
                  className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!playlist || isLoading}
                  className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-5 py-3 font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20"
                >
                  Export JSON
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Live pipeline</div>
              <div className="space-y-2 text-sm text-slate-200">
                <div>Searching tracks...</div>
                <div>Analyzing audio features...</div>
                <div>Building emotional arc...</div>
                <div>Optimizing transitions...</div>
              </div>
            </div>
          </form>
        </section>

        {error ? (
          <section className="mb-8 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-red-100">
            {error}
          </section>
        ) : null}

        {notice ? (
          <section className="mb-8 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-emerald-100">
            {notice}
          </section>
        ) : null}

        {playlist ? (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-sm text-slate-400">Playlist</div>
                <div className="mt-2 text-xl font-semibold">{playlist.playlistTitle}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-sm text-slate-400">Average BPM</div>
                <div className="mt-2 text-xl font-semibold">{playlist.statistics.averageBpm}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-sm text-slate-400">Energy</div>
                <div className="mt-2 text-xl font-semibold">{playlist.statistics.averageEnergy}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-sm text-slate-400">Duration</div>
                <div className="mt-2 text-xl font-semibold">{playlist.statistics.durationMinutes} min</div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Playlist preview</h2>
                  <p className="text-slate-300">{playlist.summary}</p>
                  {playlist.moodTags ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {playlist.moodTags.map((tag) => (
                        <span key={tag} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100">
                  {playlist.tracks.length} tracks
                </div>
              </div>

              {savedPlaylistId ? (
                <div className="mb-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                  Saved playlist id: {savedPlaylistId}
                </div>
              ) : null}

              <div className="grid gap-3">
                {playlist.tracks.slice(0, 10).map((track, index) => (
                  <div
                    key={`${track.title}-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm text-cyan-300">#{index + 1}</div>
                      <div className="text-lg font-semibold">{track.title}</div>
                      <div className="text-slate-300">{track.artist} · {track.album}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                      <span>{track.duration}</span>
                      <span>Tempo {track.tempo} BPM</span>
                      <span>Mood score {track.moodScore}</span>
                      <a
                        href={track.previewUrl}
                        className="rounded-full border border-cyan-400/40 px-3 py-1 text-cyan-100 hover:bg-cyan-400/10"
                      >
                        Preview
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
