'use client';

import {useEffect, useState} from 'react';
import {MaimaiSongDbEntry, SongWithRating} from '../types';
import {ExportButton} from './ExportButton';

interface RatingGridProps {
  newSongs: SongWithRating[];
  oldSongs: SongWithRating[];
  songDb: MaimaiSongDbEntry[] | null;
}

export default function RatingGrid({ newSongs, oldSongs, songDb }: RatingGridProps) {
  const [coverArtMap, setCoverArtMap] = useState<Record<string, string>>({});

  // Build cover art map from songDb
  useEffect(() => {
    if (!songDb) return;

    const map: Record<string, string> = {};
    songDb.forEach((entry: MaimaiSongDbEntry) => {
      if (entry.title && entry.image_url) {
        const key = entry.title.trim().toLowerCase();
        map[key] = `https://otoge-db.net/maimai/jacket/${entry.image_url}`;
      }
    });

    setCoverArtMap(map);
  }, [songDb]);

  // Calculate totals for display
  const totalNewDxRating = newSongs.slice(0, 15).reduce((sum, song) => sum + song.dxRating, 0);
  const totalOldDxRating = oldSongs.slice(0, 35).reduce((sum, song) => sum + song.dxRating, 0);
  const totalDxRating = totalNewDxRating + totalOldDxRating;

  // Always show the ExportButton if we have data
  const hasData = newSongs.length > 0 || oldSongs.length > 0;

  if (!hasData) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-2xl">🎵 No data to display 🎵</div>
          <div className="mt-4 text-sm">Upload your song data to generate a rating chart</div>
        </div>
      </div>
    );
  }

  return (
    <div className="maimai-rating-container flex w-full flex-col items-center p-8">
      {/* Header with totals */}
      <div className="maimai-header mb-8 rounded-xl bg-white/90 p-6 text-center shadow-lg backdrop-blur-sm">
        <h2 className="mb-4 text-4xl font-black text-gray-800">
          🎵 maimai DX Rating Chart 🎵
        </h2>
        <div className="maimai-total-rating mb-4 text-3xl font-black text-blue-600">
          <div className="maimai-text-outline">Total: {totalDxRating.toLocaleString()}</div>
        </div>
        <div className="flex justify-center gap-8 text-xl font-bold">
          <div className="maimai-text-outline">🌟 New: {totalNewDxRating.toLocaleString()}</div>
          <div className="maimai-text-outline">📀 Old: {totalOldDxRating.toLocaleString()}</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-8 text-center">
        <p className="text-lg text-gray-700 mb-2">
          📊 Your rating data is ready!
        </p>
        <p className="text-sm text-gray-600">
          Your rating chart will generate automatically below
        </p>
      </div>

      {/* Client-side Export Button */}
      <ExportButton
        newSongs={newSongs}
        oldSongs={oldSongs}
        coverArtMap={coverArtMap}
      />
    </div>
  );
}
