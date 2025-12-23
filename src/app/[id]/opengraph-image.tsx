import { ImageResponse } from "@vercel/og";
import { calculateHistogramBars, formatDurationForOG } from "@/lib/og-utils";
import { YearStats, Track, PlaylistMeta, SpotifyImage } from "@/lib/types";

export const runtime = "edge";
export const alt = "플레이리스트 연도 분포";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const revalidate = 3600; // 1 hour cache

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

interface SpotifyTrackItem {
  track: {
    id: string;
    duration_ms: number;
    album: {
      release_date: string;
    };
  } | null;
}

interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: { id: string; display_name: string | null };
  public: boolean | null;
  tracks: {
    total: number;
    items: SpotifyTrackItem[];
    next: string | null;
  };
}

interface SpotifyTracksResponse {
  items: SpotifyTrackItem[];
  next: string | null;
}

// Token cache with expiry
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getClientCredentialsToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 300000) {
    return tokenCache.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store", // Token requests should not be cached by Next.js
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data: SpotifyTokenResponse = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

interface PlaylistDataForOG {
  meta: PlaylistMeta;
  yearStats: YearStats[];
  trackCount: number;
  totalDurationMs: number;
}

async function fetchPlaylistForOG(playlistId: string): Promise<PlaylistDataForOG> {
  const token = await getClientCredentialsToken();

  const metaResponse = await fetch(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!metaResponse.ok) {
    throw new Error(`Failed to fetch playlist: ${metaResponse.status}`);
  }

  const playlist: SpotifyPlaylistResponse = await metaResponse.json();

  // Parse tracks and calculate stats
  const yearMap = new Map<number, number>();
  let totalDurationMs = 0;
  let trackCount = 0;

  const processItems = (items: SpotifyTrackItem[]) => {
    for (const item of items) {
      if (!item.track?.id) continue;
      const year = parseInt(item.track.album.release_date.split("-")[0], 10);
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
      totalDurationMs += item.track.duration_ms;
      trackCount++;
    }
  };

  if (playlist.tracks?.items) {
    processItems(playlist.tracks.items);
  }

  // Fetch remaining tracks in parallel
  const totalTracks = playlist.tracks?.total || 0;
  const initialOffset = playlist.tracks?.items?.length || 0;
  const limit = 100;

  if (initialOffset < totalTracks) {
    const offsets: number[] = [];
    for (let offset = initialOffset; offset < totalTracks; offset += limit) {
      offsets.push(offset);
    }

    const fetchPromises = offsets.map(async (offset) => {
      const tracksResponse = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 3600 }, // Cache for 1 hour
        }
      );

      if (!tracksResponse.ok) return null;
      const tracksData: SpotifyTracksResponse = await tracksResponse.json();
      return tracksData.items || [];
    });

    const results = await Promise.all(fetchPromises);
    for (const items of results) {
      if (items) processItems(items);
    }
  }

  const yearStats: YearStats[] = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count, tracks: [] as Track[] }))
    .sort((a, b) => a.year - b.year);

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
    tracks: { total: totalTracks },
    external_urls: { spotify: `https://open.spotify.com/playlist/${playlist.id}` },
  };

  return { meta, yearStats, trackCount, totalDurationMs };
}

function FallbackImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ display: "flex", fontSize: 80, marginBottom: 20 }}>🎵</div>
      <div
        style={{
          display: "flex",
          fontSize: 48,
          fontWeight: 700,
          color: "#1DB954",
        }}
      >
        Playlist Year Visualizer
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#666666",
          marginTop: 16,
        }}
      >
        플레이리스트 연도별 시각화
      </div>
    </div>
  );
}

// Module-level font cache for edge worker reuse
let cachedFont: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const response = await fetch(`${baseUrl}/fonts/Pretendard-SemiBold.otf`);
  cachedFont = await response.arrayBuffer();
  return cachedFont;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const fontData = await loadFont();

  try {
    const { meta, yearStats, trackCount, totalDurationMs } = await fetchPlaylistForOG(id);
    const bars = calculateHistogramBars(yearStats, 1000, 240);

    const playlistImageUrl = meta.images?.[0]?.url;
    const ownerName = meta.owner.display_name || "Unknown";
    const publicStatus = meta.public === true ? "공개" : meta.public === false ? "비공개" : "";
    const duration = formatDurationForOG(totalDurationMs);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            padding: "48px 60px",
            fontFamily: "Pretendard",
          }}
        >
          {/* Top: Playlist Info */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: "32px",
              padding: "24px",
              backgroundColor: "#F9FAFB",
              borderRadius: "16px",
              position: "relative",
            }}
          >
            {/* Branding - Top Right */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: "16px",
                right: "20px",
                fontSize: 14,
                color: "#9CA3AF",
                fontWeight: 500,
              }}
            >
              Playlist Year Visualizer
            </div>
            {/* Playlist Image */}
            {playlistImageUrl ? (
              <img
                src={playlistImageUrl}
                alt=""
                width={140}
                height={140}
                style={{
                  borderRadius: "8px",
                  objectFit: "cover",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  backgroundColor: "#E5E7EB",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                }}
              >
                🎵
              </div>
            )}

            {/* Text Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                flex: 1,
                maxWidth: "900px",
              }}
            >
              {/* Public/Private Label */}
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {publicStatus} 플레이리스트
              </div>

              {/* Playlist Name */}
              <div
                style={{
                  display: "flex",
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#000000",
                  lineHeight: 1.2,
                  marginTop: 4,
                }}
              >
                {meta.name}
              </div>

              {/* Description */}
              {meta.description && (
                <div
                  style={{
                    fontSize: 18,
                    color: "#6B7280",
                    marginTop: 8,
                    display: "flex",
                  }}
                >
                  {meta.description.length > 80
                    ? meta.description.slice(0, 80) + "..."
                    : meta.description}
                </div>
              )}

              {/* Owner · Tracks · Duration */}
              <div
                style={{
                  fontSize: 18,
                  color: "#6B7280",
                  marginTop: 12,
                  display: "flex",
                  gap: "8px",
                }}
              >
                <span>{ownerName}</span>
                <span>·</span>
                <span>{trackCount}곡</span>
                <span>·</span>
                <span>{duration}</span>
              </div>
            </div>
          </div>

          {/* Middle: Histogram */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Bars */}
            <svg width="1000" height="240" viewBox="0 0 1000 240">
              {bars.map((bar, i) => (
                <rect
                  key={i}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  fill="#1DB954"
                  rx={Math.min(4, bar.width / 2)}
                />
              ))}
            </svg>
            {/* X-axis Labels */}
            <div
              style={{
                display: "flex",
                width: 1000,
                paddingLeft: 20,
                paddingRight: 20,
                marginTop: 8,
              }}
            >
              {bars.map((bar, i) => (
                <div
                  key={i}
                  style={{
                    width: bar.width + (i < bars.length - 1 ? 4 : 0),
                    fontSize: 14,
                    color: "#666666",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {bar.showLabel ? `'${String(bar.year).slice(2)}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
        fonts: [
          {
            name: "Pretendard",
            data: fontData,
            style: "normal",
            weight: 600,
          },
        ],
      }
    );
  } catch (error) {
    console.error("[OG Image Error]", { playlistId: id, error });

    return new ImageResponse(<FallbackImage />, {
      ...size,
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60", // Shorter cache for errors
      },
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 600,
        },
      ],
    });
  }
}
