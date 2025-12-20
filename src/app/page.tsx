"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/header";
import { PlaylistInput } from "@/components/playlist-input";
import { MyPlaylists } from "@/components/my-playlists";
import { extractPlaylistId } from "@/lib/playlist-utils";

export default function Home() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handlePlaylistSelect = (input: string) => {
    const playlistId = extractPlaylistId(input);
    if (playlistId) {
      router.push(`/${playlistId}`);
    }
  };

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
            <PlaylistInput onSubmit={handlePlaylistSelect} />
          </div>

          {/* My Playlists Section (logged in only) */}
          {session && <MyPlaylists onSelect={handlePlaylistSelect} />}
        </div>
      </main>
    </div>
  );
}
