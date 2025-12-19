"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { YearStats, Selection } from "@/lib/types";

interface YearHistogramProps {
  yearStats: YearStats[];
  selection: Selection | null;
  onYearClick: (year: number) => void;
  onClearSelection: () => void;
}

export function YearHistogram({
  yearStats,
  selection,
  onYearClick,
  onClearSelection,
}: YearHistogramProps) {
  const chartData = useMemo(() => {
    if (yearStats.length === 0) return [];

    const minYear = yearStats[0].year;
    const maxYear = yearStats[yearStats.length - 1].year;
    const yearMap = new Map(yearStats.map((s) => [s.year, s.count]));

    const data = [];
    for (let year = minYear; year <= maxYear; year++) {
      data.push({
        year,
        count: yearMap.get(year) || 0,
      });
    }
    return data;
  }, [yearStats]);

  const isYearSelected = (year: number) => {
    if (!selection) return false;
    if (selection.end === null) {
      return year === selection.start;
    }
    return year >= selection.start && year <= selection.end;
  };

  const selectedCount = useMemo(() => {
    if (!selection) return 0;
    return yearStats
      .filter((s) => isYearSelected(s.year))
      .reduce((sum, s) => sum + s.count, 0);
  }, [selection, yearStats]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (data: any) => {
    const payload = data?.payload || data;
    if (!payload || payload.count === 0) {
      onClearSelection();
      return;
    }
    onYearClick(payload.year);
  };

  return (
    <div className="w-full">
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <XAxis
              dataKey="year"
              tickFormatter={(year) => `'${String(year).slice(2)}`}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} width={30} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-md px-3 py-2 shadow-md">
                      <p className="font-semibold">{data.year}년</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count}곡
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data) => handleClick(data)}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.year}
                  fill={
                    isYearSelected(entry.year)
                      ? "hsl(var(--primary))"
                      : entry.count > 0
                        ? "hsl(142.1 76.2% 36.3%)"
                        : "hsl(var(--muted))"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 px-4">
        <div className="text-sm text-muted-foreground">
          {selection ? (
            <>
              선택:{" "}
              <span className="font-medium text-foreground">
                {selection.start}
                {selection.end && selection.end !== selection.start
                  ? ` - ${selection.end}`
                  : ""}
              </span>{" "}
              ({selectedCount}곡)
            </>
          ) : (
            "연도별 막대를 클릭하여 필터링하세요"
          )}
        </div>
        {selection && (
          <button
            onClick={onClearSelection}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            선택 초기화
          </button>
        )}
      </div>
    </div>
  );
}
