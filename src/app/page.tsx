"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { PlaylistInput } from "@/components/playlist-input";
import { MyPlaylists } from "@/components/my-playlists";
import { PlaylistHeader } from "@/components/playlist-header";
import { YearHistogram } from "@/components/year-histogram";
import { TrackList } from "@/components/track-list";
import { CreatePlaylistModal } from "@/components/create-playlist-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { usePlaylist } from "@/hooks/use-playlist";
import { useYearSelection } from "@/hooks/use-year-selection";

export default function Home() {
  const { data: session } = authClient.useSession();
  const { playlistData, isLoading, error, fetchPlaylist } = usePlaylist();
  const {
    selection,
    handleYearClick,
    clearSelection,
    selectedYears,
    filteredTracks,
  } = useYearSelection(
    playlistData?.tracks || [],
    playlistData?.yearStats || []
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlaylistSelect = (playlistId: string) => {
    fetchPlaylist(playlistId);
    clearSelection();
  };

  const handleCreateSuccess = (url: string) => {
    toast.success("플레이리스트가 생성되었습니다!", {
      action: {
        label: "Spotify에서 열기",
        onClick: () => window.open(url, "_blank"),
      },
    });
  };

  const canCreatePlaylist =
    session && selection && filteredTracks.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8">
          {/* URL Input Section */}
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-3xl font-bold mb-2">
              플레이리스트 연도 분석
            </h1>
            <p className="text-muted-foreground mb-6">
              Spotify 플레이리스트 URL을 입력하여 연도별 분포를 확인하세요
            </p>
            <PlaylistInput onSubmit={handlePlaylistSelect} isLoading={isLoading} />
          </div>

          {/* My Playlists Section (logged in only) */}
          {session && !playlistData && (
            <MyPlaylists onSelect={handlePlaylistSelect} />
          )}

          {/* Error Message */}
          {error && (
            <Card className="w-full max-w-2xl border-red-200 bg-red-50">
              <CardContent className="py-4 text-center text-red-600">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="w-full max-w-4xl">
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Spinner className="h-8 w-8 text-green-500" />
                  <p className="text-muted-foreground">
                    플레이리스트를 분석하고 있습니다...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Playlist Results */}
          {playlistData && !isLoading && (
            <div className="w-full max-w-4xl space-y-6">
              {/* Playlist Header */}
              <PlaylistHeader
                playlist={playlistData.meta}
                totalDurationMs={playlistData.totalDurationMs}
                trackCount={playlistData.tracks.length}
              />

              {/* Year Histogram */}
              <Card>
                <CardContent className="pt-6">
                  <YearHistogram
                    yearStats={playlistData.yearStats}
                    selection={selection}
                    onYearClick={handleYearClick}
                    onClearSelection={clearSelection}
                  />

                  {/* Create Playlist Button */}
                  {canCreatePlaylist && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        새 플레이리스트 생성 ({filteredTracks.length}곡)
                      </Button>
                    </div>
                  )}

                  {!session && selection && (
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      새 플레이리스트를 생성하려면 로그인하세요
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Track List */}
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold mb-4">
                    트랙 목록
                    {selection && (
                      <span className="text-muted-foreground font-normal ml-2">
                        ({filteredTracks.length}곡 선택됨)
                      </span>
                    )}
                  </h2>
                  <TrackList
                    tracks={selection ? filteredTracks : playlistData.tracks}
                    highlightYears={selection ? selectedYears : undefined}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Create Playlist Modal */}
      {playlistData && selection && (
        <CreatePlaylistModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          originalName={playlistData.meta.name}
          selection={selection}
          tracks={filteredTracks}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
