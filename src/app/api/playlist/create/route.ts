import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createPlaylist } from "@/lib/spotify";

export async function POST(request: NextRequest) {
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

    // Get the Spotify user ID from the account
    const accounts = await auth.api.listUserAccounts({
      headers: await headers(),
    });

    const spotifyAccount = accounts?.find(
      (account) => account.providerId === "spotify"
    );

    if (!spotifyAccount) {
      return NextResponse.json(
        { error: "Spotify 계정을 찾을 수 없습니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, trackUris } = body;

    if (!name || !trackUris || !Array.isArray(trackUris) || trackUris.length === 0) {
      return NextResponse.json(
        { error: "플레이리스트 이름과 트랙이 필요합니다" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      return NextResponse.json(
        { error: "플레이리스트 이름은 1~100자 사이여야 합니다" },
        { status: 400 }
      );
    }

    const result = await createPlaylist(
      tokenResult.accessToken,
      spotifyAccount.accountId,
      trimmedName,
      description || "",
      trackUris
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "플레이리스트 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
