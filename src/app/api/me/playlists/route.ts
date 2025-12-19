import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { fetchUserPlaylists } from "@/lib/spotify";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const tokenResult = await auth.api.getAccessToken({
      body: { providerId: "spotify" },
      headers: await headers(),
    });

    if (!tokenResult?.accessToken) {
      return NextResponse.json(
        { error: "Spotify 액세스 토큰을 가져올 수 없습니다" },
        { status: 401 }
      );
    }

    const playlists = await fetchUserPlaylists(tokenResult.accessToken);

    return NextResponse.json({ playlists });
  } catch {
    return NextResponse.json(
      { error: "플레이리스트를 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}
