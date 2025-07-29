'use client';

import Image from 'next/image';
import {useEffect, useRef, useState} from 'react';
import {MaimaiSongDbEntry, SongWithRating} from '../types';
import ExportButton from './ExportButton';

interface RatingGridProps {
  newSongs: SongWithRating[];
  oldSongs: SongWithRating[];
  songDb: MaimaiSongDbEntry[] | null;
}

export default function RatingGrid({ newSongs, oldSongs, songDb }: RatingGridProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverArtMap, setCoverArtMap] = useState<Record<string, string>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  // Build cover art map from songDb
  useEffect(() => {
    if (!songDb) return;
    const map: Record<string, string> = {};
    songDb.forEach((entry: MaimaiSongDbEntry) => {
      if (entry.title && entry.image_url) {
        // The proxy is no longer needed, use the direct URL
        map[entry.title.trim().toLowerCase()] = `https://otoge-db.net/maimai/jacket/${entry.image_url}`;
      }
    });
    setCoverArtMap(map);
  }, [songDb]);

  // Generate image when songs data changes
  useEffect(() => {
    const generateImage = async () => {
      // Wait for cover art map to be ready
      if (!newSongs.length && !oldSongs.length || Object.keys(coverArtMap).length === 0) {
        return;
      }

      console.log('🎵 Starting image generation request...');
      console.log(`📊 Data to send: ${newSongs.length} new songs, ${oldSongs.length} old songs`);

      setIsGenerating(true);
      setError(null);

      try {
        console.log('📡 Sending POST request to /api/generate-rating-image...');
        const response = await fetch('/api/generate-rating-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newSongs,
            oldSongs,
            coverArtMap, // Send the cover art map
          }),
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          // Try to get error details from response
          let errorDetails: string;
          try {
            const errorData = await response.json();
            console.error('❌ Server error details:', errorData);
            errorDetails = errorData.details || errorData.error || `HTTP ${response.status}`;
          } catch (parseError) {
            console.error('❌ Could not parse error response:', parseError);
            errorDetails = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(`Server error: ${errorDetails}`);
        }

        console.log('📦 Converting response to blob...');
        const blob = await response.blob();
        console.log(`📦 Blob created: ${blob.size} bytes, type: ${blob.type}`);

        console.log('🔗 Creating object URL...');
        const url = URL.createObjectURL(blob);
        console.log('✅ Image URL created successfully:', url);

        setImageUrl(url);
        console.log('🎉 Image generation completed successfully!');
      } catch (err) {
        console.error('❌ Error in generateImage:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Error details:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : 'No stack trace',
        });
        setError(`Failed to generate rating chart image: ${errorMessage}`);
      } finally {
        setIsGenerating(false);
      }
    };

    generateImage();

    // Cleanup previous image URL
    return () => {
      if (imageUrl) {
        console.log('🧹 Cleaning up previous image URL');
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [newSongs, oldSongs, coverArtMap]);

  // Calculate totals for display
  const totalNewDxRating = newSongs.slice(0, 15).reduce((sum, song) => sum + song.dxRating, 0);
  const totalOldDxRating = oldSongs.slice(0, 35).reduce((sum, song) => sum + song.dxRating, 0);
  const totalDxRating = totalNewDxRating + totalOldDxRating;

  const exportAsImage = () => {
    if (!imageUrl) return;

    // Create download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'maimai-rating-chart.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isGenerating) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl">🎵 Generating Rating Chart... 🎵</div>
          <div className="animate-spin text-4xl">⭐</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center text-red-600">
          <div className="mb-4 text-2xl">❌ Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-2xl">🎵 No data to display 🎵</div>
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

      {/* Generated Image */}
      <div className="relative w-full" ref={gridRef}>
        <Image
          src={imageUrl}
          alt="maimai DX Rating Chart"
          className="mx-auto max-w-full rounded-lg shadow-lg"
          width={1200}
          height={2000}
        />
      </div>

      <ExportButton onClick={exportAsImage} />
    </div>
  );
}
