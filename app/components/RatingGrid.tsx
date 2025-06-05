"use client";

import { useEffect, useState, useRef } from "react";
import type { Song } from "../page";
import { GridItem } from "./GridItem";
import { getDxRating } from "../utils/dxRating";
import type { MaimaiSongDbEntry } from "../utils/maimaiSongDbEntry";

interface RatingGridProps {
  newSongs: Song[];
  oldSongs: Song[];
  songDb: MaimaiSongDbEntry[];
}

// Generate placeholder for missing songs
const createPlaceholderSong = (): Song => ({
  songName: "NO DATA",
  achievement: 0,
  difficulty: -1, // Special flag for placeholder
  level: undefined,
  chartType: 0,
});

export default function RatingGrid({ newSongs, oldSongs, songDb }: RatingGridProps) {
  const [coverArtMap, setCoverArtMap] = useState<Record<string, string>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  // Build cover art map from songDb
  useEffect(() => {
    if (!songDb) return;
    const map: Record<string, string> = {};
    songDb.forEach((entry: MaimaiSongDbEntry) => {
      if (entry.title && entry.image_url) {
        map[entry.title.trim().toLowerCase()] = `https://otoge-db.net/maimai/jacket/${entry.image_url}`;
      }
    });
    setCoverArtMap(map);
  }, [songDb]);

  // Prepare arrays with placeholders if needed
  const preparedNewSongs = [...newSongs];
  const preparedOldSongs = [...oldSongs];

  // Fill new songs with placeholders if needed
  while (preparedNewSongs.length < 15) {
    preparedNewSongs.push(createPlaceholderSong());
  }

  // Fill old songs with placeholders if needed
  while (preparedOldSongs.length < 35) {
    preparedOldSongs.push(createPlaceholderSong());
  }

  // Calculate total DX rating for new and old songs (ignore placeholders)
  const totalNewDxRating = preparedNewSongs
    .filter(song => song.songName !== "NO DATA")
    .reduce((sum, song) => sum + getDxRating(song.level, song.achievement), 0);
  const totalOldDxRating = preparedOldSongs
    .filter(song => song.songName !== "NO DATA")
    .reduce((sum, song) => sum + getDxRating(song.level, song.achievement), 0);
  const totalDxRating = totalNewDxRating + totalOldDxRating;

  return (
    <div className="flex flex-col items-center mt-8">
      {/* Total DX Rating Section */}
      <div className="mb-6 w-full flex flex-col items-center">
        <div className="text-2xl font-bold text-gray-800">Total DX Rating</div>
        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 select-text">
          {totalDxRating.toLocaleString()}
        </div>
      </div>

      {/* Grid Container - add ref for html2canvas */}
      <div ref={gridRef} className="mb-4 relative border border-gray-700 bg-white p-4 rounded-xl">
        {/* NEW CHARTS header with orange gradient */}
        <div className="flex items-center mb-4">
          <div className="h-1 flex-grow bg-gradient-to-r from-orange-300 to-orange-600"></div>
          <div className="mx-4 text-center font-bold text-xl" style={{
            background: 'linear-gradient(to bottom, #FF9800, #F57C00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            NEW CHARTS (15 songs)
          </div>
          <div className="h-1 flex-grow bg-gradient-to-r from-orange-600 to-orange-300"></div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {preparedNewSongs.slice(0, 15).map((song, idx) => (
            <GridItem
              key={`new-${idx}`}
              song={song}
              index={idx}
              chartType="DX"
              coverArtUrl={song.songName !== "NO DATA" ? coverArtMap[song.songName.trim().toLowerCase()] : undefined}
            />
          ))}
        </div>

        {/* OLD CHARTS header with blue gradient */}
        <div className="flex items-center mb-4">
          <div className="h-1 flex-grow bg-gradient-to-r from-blue-300 to-blue-700"></div>
          <div className="mx-4 text-center font-bold text-xl" style={{
            background: 'linear-gradient(to bottom, #1E88E5, #1A237E)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            OLD CHARTS (35 songs)
          </div>
          <div className="h-1 flex-grow bg-gradient-to-r from-blue-700 to-blue-300"></div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {preparedOldSongs.slice(0, 35).map((song, idx) => (
            <GridItem
              key={`old-${idx}`}
              song={song}
              index={idx}
              chartType="STD"
              coverArtUrl={song.songName !== "NO DATA" ? coverArtMap[song.songName.trim().toLowerCase()] : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
