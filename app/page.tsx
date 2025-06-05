"use client";

import { useState, useEffect } from "react";
import RatingGrid from "./components/RatingGrid";
import { getDxRating } from "./utils/dxRating";
import type { MaimaiSongDbEntry } from "./utils/maimaiSongDbEntry";

const LATEST_VERSION = 25000;

export interface Song {
  songName: string;
  chartType: number; // 0 for STD, 1 for DX
  difficulty: number; // 0:easy, 1:advanced, 2:expert, 3:master, 4:remaster
  achievement: number;
  genre?: string;
  level?: number;
  version?: number; // Add version for matching
}

export default function Home() {
  const [jsonInput, setJsonInput] = useState<string>("");
  const [parsedSongs, setParsedSongs] = useState<{ newSongs: Song[]; oldSongs: Song[] }>({
    newSongs: [],
    oldSongs: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [songDb, setSongDb] = useState<MaimaiSongDbEntry[] | null>(null);

  // Fetch song DB once on mount
  useEffect(() => {
    fetch("https://otoge-db.net/maimai/data/music-ex-intl.json")
      .then(res => res.json())
      .then((db: MaimaiSongDbEntry[]) => setSongDb(db));
  }, []);

  const handleJsonSubmit = async () => {
    try {
      // Parse the JSON input
      const songs = JSON.parse(jsonInput) as Song[];
      if (!Array.isArray(songs)) {
        setError("Input must be a JSON array");
        return;
      }
      if (!songDb) {
        setError("Song database not loaded yet. Please wait and try again.");
        return;
      }
      // Map title to version
      const versionMap: Record<string, number> = {};
      songDb.forEach((entry: MaimaiSongDbEntry) => {
        if (entry.title && entry.version) {
          versionMap[entry.title.trim().toLowerCase()] = Number(entry.version);
        }
      });
      // Attach the version and dxRating to user songs
      const songsWithVersion = songs.map((song) => {
        const version = versionMap[song.songName.trim().toLowerCase()] ?? 0;
        const dxRating = getDxRating(song.level, song.achievement);
        return { ...song, version, dxRating };
      });
      // Sort helper: dxRating desc, then achievement desc
      const sortSongs = (a: Song & { dxRating: number; version: number }, b: Song & { dxRating: number; version: number }) => {
        if (b.dxRating !== a.dxRating) return b.dxRating - a.dxRating;
        return b.achievement - a.achievement;
      };
      // Split by version and sort
      const newSongs = songsWithVersion
        .filter((song) => song.version >= LATEST_VERSION)
        .sort(sortSongs)
        .slice(0, 15);
      const oldSongs = songsWithVersion
        .filter((song) => song.version < LATEST_VERSION)
        .sort(sortSongs)
        .slice(0, 35);
      setParsedSongs({ newSongs, oldSongs });
      setError(null);
    } catch (err) {
      setError("Invalid JSON format");
      console.error(err);
    }
  };
  return (
    // Applied MaiMai theme classes and adjusted layout
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-sans)] bg-maimai-dark-bg text-maimai-light-text">
      <main className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          {/* You can add a MaiMai logo here if you have one */}
          <h1 className="text-5xl font-bold text-maimai-pink animate-pulse">
            MaiMai Achievement Tracker
          </h1>
        </header>

        {/* Input Section */}
        <div className="mb-12 p-6 bg-opacity-20 bg-maimai-blue rounded-lg shadow-xl">
          <label className="block mb-3 text-xl font-medium text-maimai-yellow">
            Input Your Song Achievements JSON:
          </label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            // Applied MaiMai input style
            className="w-full h-48 p-4 maimai-input font-mono text-sm resize-y focus:ring-2 focus:ring-maimai-pink outline-none"
            placeholder='Get JSON Data from https://myjian.github.io/mai-tools/rating-calculator/. Select Export as JSON (all records) and paste here.'
          />
          {error && <p className="text-red-400 mt-3 text-sm">Error: {error}</p>}
          <button
            onClick={handleJsonSubmit}
            // Applied MaiMai button style
            className="mt-6 maimai-button"
          >
            Parse and Display Scores
          </button>
        </div>

        {/* Results Section - RatingGrid will be styled separately if needed */}
        { songDb && (parsedSongs.newSongs.length > 0 || parsedSongs.oldSongs.length > 0) &&
          <RatingGrid newSongs={parsedSongs.newSongs} oldSongs={parsedSongs.oldSongs} songDb={songDb} />
        }

        {/* Placeholder for additional MaiMai themed elements */}
        {/* Example: <div className="mt-10 p-4 border-2 border-maimai-yellow rounded-md text-center">More MaiMai content here!</div> */}

      </main>

      <footer className="text-center mt-16 text-sm text-maimai-light-pink">
        <p>Inspired by SEGA MaiMai Universe. All rights reserved to their respective owners.</p>
      </footer>
    </div>
  );
}
