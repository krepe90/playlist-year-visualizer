import { YearStats } from "./types";

export interface HistogramBar {
  x: number;
  y: number;
  width: number;
  height: number;
  year: number;
  showLabel: boolean;
}

export function calculateHistogramBars(
  yearStats: YearStats[],
  width: number = 1000,
  height: number = 240
): HistogramBar[] {
  if (yearStats.length === 0) return [];

  const padding = { top: 10, right: 20, bottom: 10, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...yearStats.map((s) => s.count));
  const barCount = yearStats.length;
  const barGap = Math.max(2, Math.min(4, Math.floor(chartWidth / barCount / 10)));
  const barWidth = Math.max(
    4,
    (chartWidth - (barCount - 1) * barGap) / barCount
  );

  return yearStats.map((stat, index) => {
    const barHeight = (stat.count / maxCount) * chartHeight;
    const x = padding.left + index * (barWidth + barGap);
    const y = height - padding.bottom - barHeight;

    // Show label for every 10 years, or first/last if few bars
    const showLabel =
      barCount <= 10 || stat.year % 10 === 0 || index === 0 || index === barCount - 1;

    return {
      x,
      y,
      width: barWidth,
      height: barHeight,
      year: stat.year,
      showLabel,
    };
  });
}

export function formatDurationForOG(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}
