// Extract playlist ID from various URL formats
// This is a pure utility function safe for client-side use
export function extractPlaylistId(input: string): string | null {
  // Direct ID
  if (/^[a-zA-Z0-9]{22}$/.test(input)) {
    return input;
  }

  // URL formats:
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const urlMatch = input.match(
    /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]{22})/
  );
  if (urlMatch) {
    return urlMatch[1];
  }

  return null;
}
