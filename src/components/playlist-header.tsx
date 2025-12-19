"use client";

import Image from "next/image";
import { PlaylistMeta } from "@/lib/types";
import { formatDuration } from "@/lib/spotify";

interface PlaylistHeaderProps {
  playlist: PlaylistMeta;
  totalDurationMs: number;
  trackCount: number;
}

export function PlaylistHeader({
  playlist,
  totalDurationMs,
  trackCount,
}: PlaylistHeaderProps) {
  return (
    <div className="flex gap-4 p-4 bg-gradient-to-b from-muted/50 to-background rounded-lg">
      <div className="flex-shrink-0 w-32 h-32 rounded-md overflow-hidden bg-muted shadow-lg">
        {playlist.images?.[0]?.url ? (
          <Image
            src={playlist.images[0].url}
            alt={playlist.name}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center min-w-0">
        <p className="text-xs uppercase text-muted-foreground font-medium">
          플레이리스트
        </p>
        <h1 className="text-2xl font-bold truncate">{playlist.name}</h1>
        {playlist.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {playlist.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span>{playlist.owner.display_name || "Unknown"}</span>
          <span>·</span>
          <span>{trackCount}곡</span>
          <span>·</span>
          <span>{formatDuration(totalDurationMs)}</span>
        </div>
        <a
          href={playlist.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-sm text-green-500 hover:text-green-400 flex items-center gap-1 w-fit"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Spotify에서 열기
        </a>
      </div>
    </div>
  );
}
