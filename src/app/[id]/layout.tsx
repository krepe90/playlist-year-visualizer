import type { Metadata } from "next";
import { fetchPlaylist, formatDuration } from "@/lib/spotify";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const playlistData = await fetchPlaylist(id);
    const { meta, tracks, totalDurationMs } = playlistData;

    const publicStatus =
      meta.public === true ? "공개" : meta.public === false ? "비공개" : "";
    const ownerName = meta.owner.display_name || "Unknown";
    const description = [publicStatus, ownerName, `${tracks.length}곡`, formatDuration(totalDurationMs)]
      .filter(Boolean)
      .join(" · ");

    const title = `${meta.name} - Playlist Year Visualizer`;

    return {
      title,
      description,
      openGraph: {
        title: meta.name,
        description,
        type: "website",
        siteName: "Playlist Year Visualizer",
      },
      twitter: {
        card: "summary_large_image",
        title: meta.name,
        description,
      },
    };
  } catch {
    return {
      title: "Playlist Year Visualizer",
      description: "플레이리스트의 연도별 트랙 분포를 시각화합니다",
    };
  }
}

export default function PlaylistLayout({ children }: Props) {
  return children;
}
