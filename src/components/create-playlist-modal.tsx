"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Track, Selection } from "@/lib/types";

interface CreatePlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalName: string;
  selection: Selection;
  tracks: Track[];
  onSuccess: (playlistUrl: string) => void;
}

export function CreatePlaylistModal({
  open,
  onOpenChange,
  originalName,
  selection,
  tracks,
  onSuccess,
}: CreatePlaylistModalProps) {
  const { data: session } = authClient.useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultName = `${originalName} (${selection.start}${selection.end && selection.end !== selection.start ? `-${selection.end}` : ""})`;
  const [name, setName] = useState(defaultName);

  const handleCreate = async () => {
    if (!session) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/playlist/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: `${originalName}에서 ${selection.start}${selection.end && selection.end !== selection.start ? `-${selection.end}` : ""}년 트랙을 추출한 플레이리스트`,
          trackUris: tracks.map((t) => t.uri),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "플레이리스트 생성에 실패했습니다");
      }

      onSuccess(data.external_urls.spotify);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 플레이리스트 생성</DialogTitle>
          <DialogDescription>
            {tracks.length}곡을 포함한 새로운 플레이리스트를 만듭니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            플레이리스트 이름
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="플레이리스트 이름을 입력하세요"
          />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="bg-green-500 hover:bg-green-600"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Spinner />
                생성 중...
              </span>
            ) : (
              "생성하기"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
