// Playlist metadata from Spotify API
export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
}

export interface PlaylistMeta {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: SpotifyUser;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

// Processed track information
export interface Track {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
    releaseDate: string;
    releaseDatePrecision: "year" | "month" | "day";
  };
  releaseYear: number;
  durationMs: number;
  previewUrl: string | null;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

// Year statistics for histogram
export interface YearStats {
  year: number;
  count: number;
  tracks: Track[];
}

// Selection state for year range
export interface Selection {
  start: number;
  end: number | null;
}

// Spotify API raw responses
export interface SpotifyTrackItem {
  track: {
    id: string;
    name: string;
    uri: string;
    duration_ms: number;
    preview_url: string | null;
    external_urls: {
      spotify: string;
    };
    artists: {
      id: string;
      name: string;
    }[];
    album: {
      id: string;
      name: string;
      images: SpotifyImage[];
      release_date: string;
      release_date_precision: "year" | "month" | "day";
    };
  } | null;
  added_at: string;
}

export interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: SpotifyUser;
  tracks: {
    total: number;
    items: SpotifyTrackItem[];
    next: string | null;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyTracksResponse {
  items: SpotifyTrackItem[];
  next: string | null;
  total: number;
}

export interface SpotifyUserPlaylistsResponse {
  items: PlaylistMeta[];
  next: string | null;
  total: number;
}

// Processed playlist data for the client
export interface PlaylistData {
  meta: PlaylistMeta;
  tracks: Track[];
  yearStats: YearStats[];
  totalDurationMs: number;
}
