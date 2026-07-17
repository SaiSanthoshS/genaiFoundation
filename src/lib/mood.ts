export type MoodConfig = {
  tags: string[];
  title: string;
  summary: string;
  artists: string[];
};

export const moodConfigs: Record<string, MoodConfig> = {
  Happy: {
    tags: ["happy", "summer", "dance", "pop", "feel good"],
    title: "Sunrise Pop Lift",
    summary: "A bright, feel-good set of upbeat tracks with a warm emotional rise.",
    artists: ["Ariana Grande", "Dua Lipa", "Doja Cat", "Kygo", "The Weeknd"],
  },
  Calm: {
    tags: ["calm", "chill", "ambient", "soft", "lofi"],
    title: "Quiet Harbor",
    summary: "A gentle, low-pressure flow designed to reduce intensity and restore balance.",
    artists: ["Joji", "Breez", "M83", "Lorn", "Nils Frahm"],
  },
  Sad: {
    tags: ["sad", "indie", "soft rock", "melancholy", "acoustic"],
    title: "Afterglow Blues",
    summary: "A reflective arc with tender vocals and a slow cinematic decline.",
    artists: ["Sabrina Carpenter", "The 1975", "Adele", "Bon Iver", "Lorde"],
  },
  Energetic: {
    tags: ["energetic", "electro", "club", "driving", "intense"],
    title: "Voltage Rush",
    summary: "A fast-moving, high-impact set that keeps momentum high from start to finish.",
    artists: ["David Guetta", "Tiesto", "The Chainsmokers", "Rihanna", "Calvin Harris"],
  },
  Romantic: {
    tags: ["romantic", "soul", "love", "warm", "smooth"],
    title: "Velvet Evening",
    summary: "A slow-burn, intimate mix crafted for candlelight and connection.",
    artists: ["SZA", "Bruno Mars", "H.E.R.", "Ed Sheeran", "Alicia Keys"],
  },
};

export function getMoodConfig(mood: string): MoodConfig {
  return moodConfigs[mood] ?? moodConfigs.Happy;
}
