"use client";

import Image from "next/image";
import { Track } from "@/lib/types";
import { formatTrackDuration } from "@/lib/spotify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TrackListProps {
  tracks: Track[];
  highlightYears?: Set<number>;
}

export function TrackList({ tracks, highlightYears }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        표시할 트랙이 없습니다
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>제목</TableHead>
            <TableHead className="hidden md:table-cell">아티스트</TableHead>
            <TableHead className="hidden lg:table-cell">앨범</TableHead>
            <TableHead className="w-20 text-center">연도</TableHead>
            <TableHead className="w-16 text-right hidden sm:table-cell">
              시간
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track, index) => {
            const isHighlighted =
              highlightYears && highlightYears.has(track.releaseYear);

            return (
              <TableRow
                key={`${track.id}-${index}`}
                className={isHighlighted ? "bg-primary/5" : undefined}
              >
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-muted hidden sm:block">
                      {track.album.images?.[0]?.url ? (
                        <Image
                          src={track.album.images[track.album.images.length - 1]?.url || track.album.images[0].url}
                          alt={track.album.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium truncate block hover:underline"
                      >
                        {track.name}
                      </a>
                      <p className="text-sm text-muted-foreground truncate md:hidden">
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="truncate block max-w-[200px]">
                    {track.artists.map((a) => a.name).join(", ")}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="truncate block max-w-[200px]">
                    {track.album.name}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={isHighlighted ? "default" : "secondary"}
                    className="font-mono"
                  >
                    {track.releaseYear}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                  {formatTrackDuration(track.durationMs)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
