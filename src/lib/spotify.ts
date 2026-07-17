const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

export async function getSpotifyAccessToken(): Promise<string | null> {
  if (!clientId || !clientSecret) {
    return null;
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export async function searchSpotifyTracks(query: string, limit = 20) {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return [];
  }

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    tracks?: {
      items?: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { name: string; images?: Array<{ url: string }> };
        duration_ms: number;
        popularity: number;
      }>;
    };
  };

  return data.tracks?.items ?? [];
}
