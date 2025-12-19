"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Playlist Year Visualizer</span>
        </div>

        <div>
          {isPending ? (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-md" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user?.image || undefined} />
                <AvatarFallback>
                  {session.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline">
                {session.user?.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => authClient.signOut()}
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                authClient.signIn.social({
                  provider: "spotify",
                  callbackURL: "/",
                })
              }
              className="bg-green-500 hover:bg-green-600"
            >
              Spotify 로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
