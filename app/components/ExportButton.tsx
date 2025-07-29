'use client';

import React, { useState } from 'react';
import { SongWithRating } from '@/app/types';
import { generateRatingChart } from '@/app/utils/clientImageGenerator';

interface ExportButtonProps {
  newSongs: SongWithRating[];
  oldSongs: SongWithRating[];
  coverArtMap: Record<string, string>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  newSongs,
  oldSongs,
  coverArtMap,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log('🎵 Starting client-side export...');
      console.log('📊 Props received:', {
        newSongs: newSongs?.length ?? 'undefined',
        oldSongs: oldSongs?.length ?? 'undefined',
        coverArtMap: coverArtMap ? Object.keys(coverArtMap).length : 'undefined'
      });

      // Defensive checks for props
      const safeNewSongs = newSongs || [];
      const safeOldSongs = oldSongs || [];
      const safeCoverArtMap = coverArtMap || {};

      // Generate the image using client-side canvas
      const dataUrl = await generateRatingChart(safeNewSongs, safeOldSongs, safeCoverArtMap);

      // Create download link
      const link = document.createElement('a');
      link.download = `maimai-dx-rating-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Export completed successfully');

    } catch (err) {
      console.error('❌ Export failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200
          ${isGenerating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating Image...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            📷 Export Rating Chart
          </div>
        )}
      </button>

      {error && (
        <div className="text-red-500 text-sm max-w-md text-center">
          <p className="font-semibold">Export Failed:</p>
          <p>{error}</p>
        </div>
      )}

      {!isGenerating && !error && (
        <p className="text-gray-600 text-sm text-center max-w-md">
          Click to generate and download your rating chart as a PNG image
        </p>
      )}
    </div>
  );
};
