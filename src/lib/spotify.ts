import {
  PlaylistData,
  PlaylistMeta,
  SpotifyPlaylistResponse,
  SpotifyTrackItem,
  SpotifyTracksResponse,
  SpotifyUserPlaylistsResponse,
  Track,
  YearStats,
} from "./types";
export { extractPlaylistId } from "./playlist-utils";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Client Credentials token for public API access
let clientCredentialsToken: { token: string; expiresAt: number } | null = null;

async function getClientCredentialsToken(): Promise<string> {
  if (
    clientCredentialsToken &&
    clientCredentialsToken.expiresAt > Date.now() + 60000
  ) {
    return clientCredentialsToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();
  clientCredentialsToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return clientCredentialsToken.token;
}

// Parse raw Spotify track item to our Track type
function parseTrack(item: SpotifyTrackItem): Track | null {
  if (!item.track || !item.track.id) {
    return null; // Skip local files or unavailable tracks
  }

  const releaseDate = item.track.album.release_date;
  const releaseYear = parseInt(releaseDate.split("-")[0], 10);

  return {
    id: item.track.id,
    name: item.track.name,
    uri: item.track.uri,
    durationMs: item.track.duration_ms,
    previewUrl: item.track.preview_url,
    external_urls: item.track.external_urls,
    artists: item.track.artists.map((a) => ({ id: a.id, name: a.name })),
    album: {
      id: item.track.album.id,
      name: item.track.album.name,
      images: item.track.album.images,
      releaseDate: item.track.album.release_date,
      releaseDatePrecision: item.track.album.release_date_precision,
    },
    releaseYear,
  };
}

// Calculate year statistics from tracks
function calculateYearStats(tracks: Track[]): YearStats[] {
  const yearMap = new Map<number, Track[]>();

  for (const track of tracks) {
    const existing = yearMap.get(track.releaseYear) || [];
    existing.push(track);
    yearMap.set(track.releaseYear, existing);
  }

  const stats: YearStats[] = [];
  for (const [year, yearTracks] of yearMap) {
    stats.push({
      year,
      count: yearTracks.length,
      tracks: yearTracks,
    });
  }

  return stats.sort((a, b) => a.year - b.year);
}

// Fetch playlist with all tracks (handles pagination)
export async function fetchPlaylist(
  playlistId: string,
  accessToken?: string
): Promise<PlaylistData> {
  const token = accessToken || (await getClientCredentialsToken());

  // Fetch playlist metadata first (without tracks to get basic info)
  const metaResponse = await fetch(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!metaResponse.ok) {
    if (metaResponse.status === 404) {
      throw new Error("Playlist not found");
    }
    if (metaResponse.status === 401 || metaResponse.status === 403) {
      throw new Error("Cannot access this playlist. It may be private.");
    }
    throw new Error(`Failed to fetch playlist: ${metaResponse.status}`);
  }

  const playlist: SpotifyPlaylistResponse = await metaResponse.json();

  // Parse initial tracks from the playlist response
  const tracks: Track[] = [];
  if (playlist.tracks?.items) {
    for (const item of playlist.tracks.items) {
      const track = parseTrack(item);
      if (track) {
        tracks.push(track);
      }
    }
  }

  // Fetch remaining tracks using offset-based pagination
  const totalTracks = playlist.tracks?.total || 0;
  const limit = 100;
  let offset = tracks.length;

  while (offset < totalTracks) {
    const tracksResponse = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      break;
    }

    const tracksData: SpotifyTracksResponse = await tracksResponse.json();

    if (!tracksData.items || !Array.isArray(tracksData.items)) {
      break;
    }

    for (const item of tracksData.items) {
      const track = parseTrack(item);
      if (track) {
        tracks.push(track);
      }
    }

    offset += tracksData.items.length;

    // Safety check to prevent infinite loop
    if (tracksData.items.length === 0) {
      break;
    }
  }

  const meta: PlaylistMeta = {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    images: playlist.images,
    owner: {
      id: playlist.owner.id,
      display_name: playlist.owner.display_name,
    },
    public: playlist.public,
    tracks: {
      total: totalTracks,
    },
    external_urls: playlist.external_urls,
  };

  const yearStats = calculateYearStats(tracks);
  const totalDurationMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  return {
    meta,
    tracks,
    yearStats,
    totalDurationMs,
  };
}

// Fetch user's playlists
export async function fetchUserPlaylists(
  accessToken: string
): Promise<PlaylistMeta[]> {
  const playlists: PlaylistMeta[] = [];
  let url: string | null = `${SPOTIFY_API_BASE}/me/playlists?limit=50`;

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch playlists");
    }

    const data: SpotifyUserPlaylistsResponse = await response.json();
    playlists.push(...data.items);
    url = data.next;
  }

  return playlists;
}

// Create a new playlist
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description: string,
  trackUris: string[]
): Promise<{ id: string; external_urls: { spotify: string } }> {
  // Create the playlist
  const createResponse = await fetch(
    `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        public: true,
      }),
    }
  );

  if (!createResponse.ok) {
    throw new Error("Failed to create playlist");
  }

  const newPlaylist = await createResponse.json();

  // Add tracks in batches of 100
  for (let i = 0; i < trackUris.length; i += 100) {
    const batch = trackUris.slice(i, i + 100);
    const addResponse = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${newPlaylist.id}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: batch,
        }),
      }
    );

    if (!addResponse.ok) {
      throw new Error("Failed to add tracks to playlist");
    }
  }

  return {
    id: newPlaylist.id,
    external_urls: newPlaylist.external_urls,
  };
}

// Format duration from milliseconds to human readable
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

// Format track duration (mm:ss)
export function formatTrackDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
