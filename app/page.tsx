'use client';

import { useState, useEffect } from 'react';
import RatingGrid from './components/RatingGrid';
import type { MaimaiSongDbEntry, SongWithRating } from './types';
import { processSongData, categorizeAndSortSongs } from './utils/songProcessor';
import JsonInput from './components/JsonInput';

export default function Home() {
  const [, setJsonInput] = useState<string>('');
  const [parsedSongs, setParsedSongs] = useState<{
    newSongs: SongWithRating[];
    oldSongs: SongWithRating[];
  }>({
    newSongs: [],
    oldSongs: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [songDb, setSongDb] = useState<MaimaiSongDbEntry[] | null>(null);
  // FIX: Move dragActive state to top-level
  const [dragActive, setDragActive] = useState(false);

  // Fetch song DB once on mount
  useEffect(() => {
    fetch('https://otoge-db.net/maimai/data/music-ex-intl.json')
      .then((res) => res.json())
      .then((db: MaimaiSongDbEntry[]) => setSongDb(db));
  }, []);

  // Shared file processing function
  const handleFileUpload = (file: File | undefined) => {
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setJsonInput(ev.target?.result as string);
        try {
          const inputSongs = JSON.parse(ev.target?.result as string);
          if (!Array.isArray(inputSongs)) {
            setError('Input must be a JSON array');
            return;
          }
          if (!songDb) {
            setError('Song database not loaded yet. Please wait and try again.');
            return;
          }
          const songsWithVersion = processSongData(inputSongs, songDb);
          const categorizedSongs = categorizeAndSortSongs(songsWithVersion);
          setParsedSongs(categorizedSongs);
          setError(null);
        } catch (err) {
          setError('Invalid JSON format or sheetId structure');
        }
      };
      reader.readAsText(file);
    } else {
      setError('Please upload a valid JSON file.');
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 font-[family-name:var(--font-sans)]">
      <main className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="maimai-title mb-4">🎵 MaiMai Rating Calculator 🎵</h1>
          <p className="maimai-subtitle">Track your achievements and calculate your rating!</p>
        </header>

        <JsonInput
          handleFileUpload={handleFileUpload}
          dragActive={dragActive}
          setDragActive={setDragActive}
          error={error}
        />

        {/* Results Section */}
        {songDb && (parsedSongs.newSongs.length > 0 || parsedSongs.oldSongs.length > 0) && (
          <div className="maimai-panel">
            <h2 className="maimai-text-outline mb-6 text-center text-2xl">
              🏆 Your Rating Results 🏆
            </h2>
            <RatingGrid
              newSongs={parsedSongs.newSongs}
              oldSongs={parsedSongs.oldSongs}
              songDb={songDb}
            />
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-sm">
        <div className="maimai-panel inline-block">
          <p className="maimai-text-outline">🎮 Inspired by SEGA MaiMai DX 🎮</p>
          <p className="mt-1 text-xs text-white">All rights reserved to their respective owners.</p>
        </div>
      </footer>
    </div>
  );
}
