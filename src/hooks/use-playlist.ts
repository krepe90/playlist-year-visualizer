"use client";

import { useState, useCallback } from "react";
import { PlaylistData } from "@/lib/types";
import { extractPlaylistId } from "@/lib/playlist-utils";

interface UsePlaylistReturn {
  playlistData: PlaylistData | null;
  isLoading: boolean;
  error: string | null;
  fetchPlaylist: (input: string) => Promise<void>;
  clearPlaylist: () => void;
}

export function usePlaylist(): UsePlaylistReturn {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = useCallback(async (input: string) => {
    const playlistId = extractPlaylistId(input);

    if (!playlistId) {
      setError("올바른 Spotify 플레이리스트 URL을 입력해주세요");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlaylistData(null);

    try {
      const response = await fetch(`/api/playlist/${playlistId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "플레이리스트를 불러오는데 실패했습니다");
      }

      setPlaylistData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPlaylist = useCallback(() => {
    setPlaylistData(null);
    setError(null);
  }, []);

  return {
    playlistData,
    isLoading,
    error,
    fetchPlaylist,
    clearPlaylist,
  };
}
