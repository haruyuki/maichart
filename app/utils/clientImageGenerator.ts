'use client';

import { SongWithRating } from '@/app/types';
import { getDifficultyColor } from '@/app/utils/dxRating';

// Helper function to get achievement rating
const getAchievementRating = (achievement: number): string => {
  if (achievement >= 100.5) return 'SSS+';
  if (achievement >= 100) return 'SSS';
  if (achievement >= 99.5) return 'SS+';
  if (achievement >= 99) return 'SS';
  if (achievement >= 98) return 'S+';
  if (achievement >= 97) return 'S';
  if (achievement >= 94) return 'AAA';
  if (achievement >= 90) return 'AA';
  if (achievement >= 80) return 'A';
  return 'B';
};

// Helper function to load an image
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Helper function to draw a grid item
const drawGridItem = (
  ctx: CanvasRenderingContext2D,
  song: SongWithRating,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number,
  chartType: string,
  coverArtImage?: HTMLImageElement
) => {
  const isPlaceholder = song.difficulty === -1;

  // Draw background
  if (coverArtImage) {
    // Draw the image, clipped to the rounded rect
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.clip();
    ctx.drawImage(coverArtImage, x, y, width, height);
    ctx.restore();

    // Add a dark overlay for text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();

  } else if (isPlaceholder) {
    // Gradient background for placeholder
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();
  } else {
    // Difficulty color background
    ctx.fillStyle = getDifficultyColor(song.difficulty);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();
  }

  // Draw border
  ctx.strokeStyle = isPlaceholder ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  if (isPlaceholder) {
    // Draw placeholder content
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO DATA', x + width / 2, y + height / 2);
    return;
  }

  const textColor = coverArtImage ? '#fff' : '#000';

  // Draw index (top-left)
  ctx.fillStyle = textColor;
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((index + 1).toString(), x + 8, y + 20);

  // Draw chart type (top-right)
  ctx.fillStyle = chartType === 'DX' ? '#ff6b35' : '#4a90e2';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(chartType, x + width - 8, y + 18);

  // Draw song name (truncated)
  ctx.fillStyle = textColor;
  ctx.font = '14px Arial, sans-serif';
  ctx.textAlign = 'center';
  const truncatedName = song.songName.length > 20 ? song.songName.substring(0, 20) + '...' : song.songName;
  ctx.fillText(truncatedName, x + width / 2, y + 45);

  // Draw achievement percentage
  ctx.fillStyle = '#ccc';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(`${song.achievement.toFixed(2)}%`, x + width / 2, y + 65);

  // Draw achievement rating
  ctx.fillStyle = '#ffc107';
  ctx.font = 'bold 25px Arial, sans-serif';
  ctx.fillText(getAchievementRating(song.achievement), x + width / 2, y + 90);

  // Draw level
  if (song.level !== undefined) {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`Lv.${song.level}`, x + width / 2, y + 110);
  }

  // Draw DX rating (bottom)
  ctx.fillStyle = '#82caff';
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText(song.dxRating.toString(), x + width / 2, y + height - 10);
};

export const generateRatingChart = async (
  newSongs: SongWithRating[],
  oldSongs: SongWithRating[],
  coverArtMap: Record<string, string>
): Promise<string> => {
  console.log('🎵 Starting client-side image generation...');

  // Defensive checks for undefined inputs
  if (!newSongs) {
    console.warn('⚠️ newSongs is undefined, using empty array');
    newSongs = [];
  }
  if (!oldSongs) {
    console.warn('⚠️ oldSongs is undefined, using empty array');
    oldSongs = [];
  }
  if (!coverArtMap) {
    console.warn('⚠️ coverArtMap is undefined, using empty object');
    coverArtMap = {};
  }

  console.log(`📊 Received data: ${newSongs.length} new songs, ${oldSongs.length} old songs`);
  console.log(`🗺️ Cover art map has ${Object.keys(coverArtMap).length} entries`);

  // Log some sample songs and their lookup attempts
  if (newSongs.length > 0) {
    console.log('🎵 Sample new songs for matching:');
    newSongs.slice(0, 3).forEach((song, i) => {
      const lookupKey = song.songName.trim().toLowerCase();
      const found = coverArtMap[lookupKey];
      console.log(`  ${i+1}. "${song.songName}" -> "${lookupKey}" -> ${found ? 'FOUND' : 'NOT FOUND'}`);
    });
  }

  if (oldSongs.length > 0) {
    console.log('🎵 Sample old songs for matching:');
    oldSongs.slice(0, 3).forEach((song, i) => {
      const lookupKey = song.songName.trim().toLowerCase();
      const found = coverArtMap[lookupKey];
      console.log(`  ${i+1}. "${song.songName}" -> "${lookupKey}" -> ${found ? 'FOUND' : 'NOT FOUND'}`);
    });
  }

  // Cache for loaded images
  const imageCache = new Map<string, HTMLImageElement>();
  const loadCoverArt = async (url: string): Promise<HTMLImageElement | undefined> => {
    if (!url) {
      console.log('⚠️ No cover art URL provided');
      return undefined;
    }
    if (imageCache.has(url)) {
      console.log(`📦 Using cached image for: ${url}`);
      return imageCache.get(url);
    }
    try {
      console.log(`🔄 Loading cover art from: ${url}`);
      const image = await loadImage(url);
      imageCache.set(url, image);
      console.log(`✅ Successfully loaded: ${url}`);
      return image;
    } catch (e) {
      console.error(`❌ Failed to load cover art from ${url}`, e);
      return undefined;
    }
  };

  // --- DYNAMIC CANVAS SIZING ---
  const itemWidth = 200;
  const itemHeight = 150;
  const gap = 20;
  const topMargin = 50;
  const headerHeight = 90;
  const sectionTitleHeight = 60;
  const sectionSpacing = 40;
  const bottomPadding = 50;

  const newSongsRows = 3;
  const oldSongsRows = 7;

  const newSongsGridHeight = newSongsRows * itemHeight + (newSongsRows - 1) * gap;
  const oldSongsGridHeight = oldSongsRows * itemHeight + (oldSongsRows - 1) * gap;

  const canvasWidth = 1200;
  const canvasHeight =
    topMargin +
    headerHeight +
    sectionTitleHeight +
    newSongsGridHeight +
    sectionSpacing +
    sectionTitleHeight +
    oldSongsGridHeight +
    bottomPadding;

  console.log(`🎨 Calculated canvas dimensions: ${canvasWidth}x${canvasHeight}`);

  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  console.log('✅ Canvas created successfully');

  // Background
  console.log('🎨 Drawing background...');
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  console.log('✅ Background drawn');

  // Calculate totals
  console.log('🧮 Calculating totals...');
  const totalNewDxRating = newSongs.slice(0, 15).reduce((sum, song) => sum + song.dxRating, 0);
  const totalOldDxRating = oldSongs.slice(0, 35).reduce((sum, song) => sum + song.dxRating, 0);
  const totalDxRating = totalNewDxRating + totalOldDxRating;
  console.log(`📊 Totals calculated: New=${totalNewDxRating}, Old=${totalOldDxRating}, Total=${totalDxRating}`);

  // Draw header
  console.log('✏️ Drawing header...');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎵 maimai DX Rating Chart 🎵', canvasWidth / 2, 50);

  // Draw totals
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(`Total: ${totalDxRating.toLocaleString()}`, canvasWidth / 2, 90);

  ctx.font = '20px Arial, sans-serif';
  ctx.fillText(`⭐ New: ${totalNewDxRating.toLocaleString()}`, canvasWidth / 2 - 150, 120);
  ctx.fillText(`📀 Old: ${totalOldDxRating.toLocaleString()}`, canvasWidth / 2 + 150, 120);
  console.log('✅ Header drawn');

  // Draw NEW CHARTS section
  let currentY = topMargin + headerHeight;
  console.log('🌟 Drawing NEW CHARTS section...');
  ctx.fillStyle = '#000';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌟 NEW CHARTS (15 songs) 🌟', canvasWidth / 2, currentY + sectionTitleHeight / 2 + 10);
  currentY += sectionTitleHeight;

  // Prepare new songs with placeholders
  const preparedNewSongs = [...newSongs];
  while (preparedNewSongs.length < 15) {
    preparedNewSongs.push({
      songName: 'NO DATA',
      achievement: 0,
      difficulty: -1,
      level: undefined,
      chartType: 0,
      dxRating: 0,
      version: 0,
    });
  }
  console.log(`📝 Prepared ${preparedNewSongs.length} new songs (with placeholders)`);

  // Draw new songs grid (5 columns, 3 rows)
  for (let row = 0; row < newSongsRows; row++) {
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      if (index < 15) {
        const song = preparedNewSongs[index];
        const x = (canvasWidth - (5 * itemWidth + 4 * gap)) / 2 + col * (itemWidth + gap);
        const y = currentY + row * (itemHeight + gap);

        const coverArtUrl = coverArtMap[song.songName.trim().toLowerCase()];
        console.log(`🎨 Song: "${song.songName}" -> URL: ${coverArtUrl || 'NOT FOUND'}`);
        const coverArtImage = await loadCoverArt(coverArtUrl);

        try {
          drawGridItem(ctx, song, x, y, itemWidth, itemHeight, index, song.chartType === 1 ? 'DX' : 'STD', coverArtImage);
        } catch (itemError) {
          console.error(`❌ Error drawing new song item ${index} ('${song.songName}'):`, itemError);
          // Continue with the rest of the grid
        }
      }
    }
  }
  currentY += newSongsGridHeight;
  console.log('✅ NEW CHARTS grid drawn');

  // Draw OLD CHARTS section
  currentY += sectionSpacing;
  console.log('📀 Drawing OLD CHARTS section...');
  ctx.fillStyle = '#000';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📀 OLD CHARTS (35 songs) 📀', canvasWidth / 2, currentY + sectionTitleHeight / 2 + 10);
  currentY += sectionTitleHeight;

  // Prepare old songs with placeholders
  const preparedOldSongs = [...oldSongs];
  while (preparedOldSongs.length < 35) {
    preparedOldSongs.push({
      songName: 'NO DATA',
      achievement: 0,
      difficulty: -1,
      level: undefined,
      chartType: 0,
      dxRating: 0,
      version: 0,
    });
  }
  console.log(`📝 Prepared ${preparedOldSongs.length} old songs (with placeholders)`);

  // Draw old songs grid (5 columns, 7 rows)
  for (let row = 0; row < oldSongsRows; row++) {
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      if (index < 35) {
        const song = preparedOldSongs[index];
        const x = (canvasWidth - (5 * itemWidth + 4 * gap)) / 2 + col * (itemWidth + gap);
        const y = currentY + row * (itemHeight + gap);

        const coverArtUrl = coverArtMap[song.songName.trim().toLowerCase()];
        const coverArtImage = await loadCoverArt(coverArtUrl);

        try {
          drawGridItem(ctx, song, x, y, itemWidth, itemHeight, index, song.chartType === 1 ? 'DX' : 'STD', coverArtImage);
        } catch (itemError) {
          console.error(`❌ Error drawing old song item ${index} ('${song.songName}'):`, itemError);
          // Continue with the rest of the grid
        }
      }
    }
  }
  console.log('✅ OLD CHARTS grid drawn');

  // Convert canvas to data URL
  console.log('🖼️ Converting canvas to data URL...');
  const dataUrl = canvas.toDataURL('image/png');
  console.log(`✅ PNG data URL created successfully`);

  return dataUrl;
};
