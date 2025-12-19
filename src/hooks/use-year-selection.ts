"use client";

import { useState, useCallback, useMemo } from "react";
import { Selection, Track, YearStats } from "@/lib/types";

export function useYearSelection(tracks: Track[], yearStats: YearStats[]) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const handleYearClick = useCallback(
    (year: number) => {
      setSelection((prev) => {
        // No current selection - start new selection
        if (!prev) {
          return { start: year, end: null };
        }

        // Already have a complete range - clear and start new
        if (prev.end !== null) {
          return { start: year, end: null };
        }

        // Have single selection - complete the range
        if (prev.start !== year) {
          return {
            start: Math.min(prev.start, year),
            end: Math.max(prev.start, year),
          };
        }

        // Clicked same year again - clear selection
        return null;
      });
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const selectedYears = useMemo(() => {
    if (!selection) return new Set<number>();

    const years = new Set<number>();
    const start = selection.start;
    const end = selection.end ?? selection.start;

    for (let year = start; year <= end; year++) {
      years.add(year);
    }
    return years;
  }, [selection]);

  const filteredTracks = useMemo(() => {
    if (!selection) return tracks;

    return tracks.filter((track) => selectedYears.has(track.releaseYear));
  }, [tracks, selection, selectedYears]);

  return {
    selection,
    setSelection,
    handleYearClick,
    clearSelection,
    selectedYears,
    filteredTracks,
  };
}
