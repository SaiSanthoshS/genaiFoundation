import { getMoodConfig } from "@/lib/mood";

export type PlaylistTrack = {
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

export type PlaylistResponse = {
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

const trackNames = [
  "Golden Hour",
  "Glow Tide",
  "Neon Bloom",
  "Soft Signal",
  "Midnight Run",
  "Blue Echo",
  "Sunset Loop",
  "Moonlit Street",
  "Velvet Floor",
  "Starlight Step",
  "Cloudline",
  "Signal Bloom",
  "Bright Harbor",
  "Aftertaste",
  "Calm Static",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function buildPlaylistForMood(mood: string, energyTarget = 65): PlaylistResponse {
  const normalizedMood = mood.trim() || "Happy";
  const config = getMoodConfig(normalizedMood);
  const baseEnergy = clamp(energyTarget / 100, 0.2, 1);

  const tracks = Array.from({ length: 30 }, (_, index) => {
    const arcStep = index < 6 ? 0.15 : index < 18 ? 0.3 : index < 25 ? 0.45 : 0.2;
    const energyValue = clamp(baseEnergy * (0.5 + arcStep) + (index % 4) * 0.04, 0.2, 0.98);
    const valenceBase = index < 6 ? 0.76 : index < 18 ? 0.64 : index < 25 ? 0.8 : 0.58;
    const valenceValue = clamp(valenceBase + (index % 3) * 0.03, 0.2, 0.94);
    const tempoValue = clamp(
      88 + Math.round(index * 1.7) + Math.round(baseEnergy * 24) + (index < 6 ? 0 : index < 18 ? 3 : index < 25 ? 5 : -2),
      74,
      172,
    );

    const durationSeconds = 120 + (index % 5) * 18 + (index % 2 === 0 ? 6 : 0);
    const artist = config.artists[index % config.artists.length];
    const title = `${trackNames[index % trackNames.length]} ${index + 1}`;

    return {
      title,
      artist,
      album: `${config.title} Session`,
      duration: formatDuration(durationSeconds),
      moodScore: clamp(Math.round(89 - Math.abs(index - 15) * 0.8 + (energyTarget > 70 ? 3 : 0)), 71, 98),
      energy: Number(energyValue.toFixed(2)),
      valence: Number(valenceValue.toFixed(2)),
      tempo: tempoValue,
      previewUrl: `https://example.com/preview/${index + 1}`,
    };
  });

  const averageBpm = Math.round(tracks.reduce((sum, track) => sum + track.tempo, 0) / tracks.length);
  const averageEnergy = Number((tracks.reduce((sum, track) => sum + track.energy, 0) / tracks.length).toFixed(2));
  const averageValence = Number((tracks.reduce((sum, track) => sum + track.valence, 0) / tracks.length).toFixed(2));
  const durationMinutes = Math.round(tracks.length * 3.1);

  return {
    playlistTitle: config.title,
    summary: config.summary,
    moodTags: config.tags,
    statistics: {
      averageBpm,
      averageEnergy,
      averageValence,
      durationMinutes,
      genres: config.tags,
    },
    tracks,
  };
}
