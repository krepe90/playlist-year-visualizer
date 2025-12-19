import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { fetchPlaylist, extractPlaylistId } from "@/lib/spotify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlistId = extractPlaylistId(id);

    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid playlist ID or URL" },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let accessToken: string | undefined;

    if (session) {
      const tokenResult = await auth.api.getAccessToken({
        body: { providerId: "spotify" },
        headers: await headers(),
      });
      accessToken = tokenResult?.accessToken;
    }

    const playlistData = await fetchPlaylist(playlistId, accessToken);

    return NextResponse.json(playlistData);
  } catch (error) {
    if (error instanceof Error) {
      // Expected errors - return clean responses without logging stacktrace
      if (error.message === "Playlist not found") {
        return NextResponse.json(
          { error: "플레이리스트를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      if (error.message.includes("private")) {
        return NextResponse.json(
          { error: "이 플레이리스트를 보려면 로그인이 필요합니다" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "플레이리스트를 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}
