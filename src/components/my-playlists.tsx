"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlaylistMeta } from "@/lib/types";

interface MyPlaylistsProps {
  onSelect: (playlistId: string) => void;
}

export function MyPlaylists({ onSelect }: MyPlaylistsProps) {
  const { data: session } = authClient.useSession();
  const [playlists, setPlaylists] = useState<PlaylistMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchPlaylists = async () => {
      try {
        const res = await fetch("/api/me/playlists");
        const data = await res.json();
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setPlaylists(data.playlists || []);
        }
      } catch {
        if (!cancelled) {
          setError("플레이리스트를 불러오는데 실패했습니다");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    setError(null);
    fetchPlaylists();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 text-center py-4">{error}</div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        내 플레이리스트
      </h2>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="shrink-0 w-35">
                  <CardContent className="p-3">
                    <Skeleton className="w-full aspect-square rounded-md mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : playlists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="shrink-0 w-35 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onSelect(playlist.id)}
                >
                  <CardContent className="p-3">
                    <div className="w-full aspect-square rounded-md overflow-hidden mb-2 bg-muted">
                      {playlist.images?.[0]?.url ? (
                        <Image
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          width={140}
                          height={140}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-muted-foreground"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {playlist.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {playlist.tracks.total}곡
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
