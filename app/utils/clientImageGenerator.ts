'use client';

import { SongWithRating } from '@/app/types';
import { getDifficultyColor } from '@/app/utils/dxRating';

// Cache for commonly used strings and styles
const FONTS = {
  headerTitle: 'bold 32px Arial, sans-serif',
  headerSubtitle: 'bold 24px Arial, sans-serif',
  headerInfo: '20px Arial, sans-serif',
  sectionTitle: 'bold 28px Arial, sans-serif',
  itemIndex: 'bold 16px Arial, sans-serif',
  itemChartType: 'bold 13px Arial, sans-serif',
  itemSongName: '14px Arial, sans-serif',
  itemAchievement: '13px Arial, sans-serif',
  itemRating: 'bold 25px Arial, sans-serif',
  itemLevel: 'bold 18px Arial, sans-serif',
  itemDxRating: 'bold 40px Arial, sans-serif',
  placeholder: 'bold 16px Arial, sans-serif'
} as const;

const COLORS = {
  white: '#fff',
  black: '#000',
  chartTypeDX: '#ff6b35',
  chartTypeSTD: '#4a90e2',
  lightGray: '#ccc',
  yellow: '#ffc107',
  blue: '#82caff',
  placeholderText: 'rgba(255,255,255,0.7)',
  placeholderBorder: 'rgba(255,255,255,0.3)',
  itemBorder: 'rgba(255,255,255,0.5)',
  overlay: 'rgba(0, 0, 0, 0.6)'
} as const;

// Helper function to get achievement rating with memoization
const achievementRatingCache = new Map<number, string>();
const getAchievementRating = (achievement: number): string => {
  const rounded = Math.floor(achievement * 100) / 100; // Round to 2 decimal places for caching
  if (achievementRatingCache.has(rounded)) {
    return achievementRatingCache.get(rounded)!;
  }

  let rating: string;
  if (achievement >= 100.5) rating = 'SSS+';
  else if (achievement >= 100) rating = 'SSS';
  else if (achievement >= 99.5) rating = 'SS+';
  else if (achievement >= 99) rating = 'SS';
  else if (achievement >= 98) rating = 'S+';
  else if (achievement >= 97) rating = 'S';
  else if (achievement >= 94) rating = 'AAA';
  else if (achievement >= 90) rating = 'AA';
  else if (achievement >= 80) rating = 'A';
  else rating = 'B';

  achievementRatingCache.set(rounded, rating);
  return rating;
};

// Helper function to load an image with timeout
const loadImage = (url: string, timeout = 10000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${url}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
};

// Batch load all images concurrently
const batchLoadImages = async (
  songs: SongWithRating[],
  coverArtMap: Record<string, string>,
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, HTMLImageElement>> => {
  const imageCache = new Map<string, HTMLImageElement>();
  const uniqueUrls = new Set<string>();

  // Collect all unique URLs
  songs.forEach(song => {
    if (song.songName !== 'NO DATA') {
      const url = coverArtMap[song.songName.trim().toLowerCase()];
      if (url && !imageCache.has(url)) {
        uniqueUrls.add(url);
      }
    }
  });

  const urls = Array.from(uniqueUrls);
  if (urls.length === 0) return imageCache;

  let loaded = 0;
  const loadPromises = urls.map(async (url) => {
    try {
      const image = await loadImage(url);
      imageCache.set(url, image);
      loaded++;
      onProgress?.(loaded, urls.length);
    } catch (e) {
      console.warn(`Failed to load cover art from ${url}:`, e);
      loaded++;
      onProgress?.(loaded, urls.length);
    }
  });

  await Promise.all(loadPromises);
  return imageCache;
};

// Optimized text truncation with caching
const truncationCache = new Map<string, string>();
const getTruncatedText = (text: string, maxLength: number = 20): string => {
  const key = `${text}_${maxLength}`;
  if (truncationCache.has(key)) {
    return truncationCache.get(key)!;
  }

  const result = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  truncationCache.set(key, result);
  return result;
};

// Pre-create reusable path for rounded rectangles
const createRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 12
): void => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

// Cache for gradients
const gradientCache = new Map<string, CanvasGradient>();
const getPlaceholderGradient = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): CanvasGradient => {
  const key = `placeholder_${width}_${height}`;
  if (gradientCache.has(key)) {
    return gradientCache.get(key)!;
  }

  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0.05)');
  gradientCache.set(key, gradient);
  return gradient;
};

// Helper function to draw a grid item - optimized version
const drawGridItem = (
  ctx: CanvasRenderingContext2D,
  song: SongWithRating,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number,
  chartType: string,
  coverArtImage?: HTMLImageElement,
) => {
  const isPlaceholder = song.difficulty === -1;

  // Draw background
  if (coverArtImage) {
    // Draw the image, clipped to the rounded rect
    ctx.save();
    createRoundedRectPath(ctx, x, y, width, height);
    ctx.clip();
    ctx.drawImage(coverArtImage, x, y, width, height);
    ctx.restore();

    // Add a dark overlay for text readability
    ctx.fillStyle = COLORS.overlay;
    createRoundedRectPath(ctx, x, y, width, height);
    ctx.fill();
  } else if (isPlaceholder) {
    // Gradient background for placeholder
    ctx.fillStyle = getPlaceholderGradient(ctx, x, y, width, height);
    createRoundedRectPath(ctx, x, y, width, height);
    ctx.fill();
  } else {
    // Difficulty color background
    ctx.fillStyle = getDifficultyColor(song.difficulty);
    createRoundedRectPath(ctx, x, y, width, height);
    ctx.fill();
  }

  // Draw border
  ctx.strokeStyle = isPlaceholder ? COLORS.placeholderBorder : COLORS.itemBorder;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (isPlaceholder) {
    // Draw placeholder content
    ctx.fillStyle = COLORS.placeholderText;
    ctx.font = FONTS.placeholder;
    ctx.textAlign = 'center';
    ctx.fillText('NO DATA', x + width / 2, y + height / 2);
    return;
  }

  const textColor = coverArtImage ? COLORS.white : COLORS.black;

  // Draw index (top-left)
  ctx.fillStyle = textColor;
  ctx.font = FONTS.itemIndex;
  ctx.textAlign = 'left';
  ctx.fillText((index + 1).toString(), x + 8, y + 20);

  // Draw chart type (top-right)
  ctx.fillStyle = chartType === 'DX' ? COLORS.chartTypeDX : COLORS.chartTypeSTD;
  ctx.font = FONTS.itemChartType;
  ctx.textAlign = 'right';
  ctx.fillText(chartType, x + width - 8, y + 18);

  // Draw song name (truncated)
  ctx.fillStyle = textColor;
  ctx.font = FONTS.itemSongName;
  ctx.textAlign = 'center';
  const truncatedName = getTruncatedText(song.songName);
  ctx.fillText(truncatedName, x + width / 2, y + 45);

  // Draw achievement percentage
  ctx.fillStyle = COLORS.lightGray;
  ctx.font = FONTS.itemAchievement;
  ctx.fillText(`${song.achievement.toFixed(2)}%`, x + width / 2, y + 65);

  // Draw achievement rating
  ctx.fillStyle = COLORS.yellow;
  ctx.font = FONTS.itemRating;
  ctx.fillText(getAchievementRating(song.achievement), x + width / 2, y + 90);

  // Draw level
  if (song.level !== undefined) {
    ctx.fillStyle = textColor;
    ctx.font = FONTS.itemLevel;
    ctx.fillText(`Lv.${song.level}`, x + width / 2, y + 110);
  }

  // Draw DX rating (bottom)
  ctx.fillStyle = COLORS.blue;
  ctx.font = FONTS.itemDxRating;
  ctx.fillText(song.dxRating.toString(), x + width / 2, y + height - 10);
};

export const generateRatingChart = async (
  newSongs: SongWithRating[],
  oldSongs: SongWithRating[],
  coverArtMap: Record<string, string>,
  onProgress?: (status: string) => void,
): Promise<string> => {
  // Defensive checks for undefined inputs
  if (!newSongs) newSongs = [];
  if (!oldSongs) oldSongs = [];
  if (!coverArtMap) coverArtMap = {};

  onProgress?.('Setting up canvas...');

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

  onProgress?.('Creating canvas...');

  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Prepare songs with placeholders
  const preparedNewSongs = [...newSongs.slice(0, 15)];
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

  const preparedOldSongs = [...oldSongs.slice(0, 35)];
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

  // Batch load all images
  onProgress?.('Loading cover art images...');
  const allSongs = [...preparedNewSongs, ...preparedOldSongs];
  const imageCache = await batchLoadImages(allSongs, coverArtMap, (loaded, total) => {
    onProgress?.(`Loading images... ${loaded}/${total}`);
  });

  onProgress?.('Drawing background...');

  // Background gradient (cached)
  const backgroundGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  backgroundGradient.addColorStop(0, '#667eea');
  backgroundGradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate totals
  const totalNewDxRating = newSongs.slice(0, 15).reduce((sum, song) => sum + song.dxRating, 0);
  const totalOldDxRating = oldSongs.slice(0, 35).reduce((sum, song) => sum + song.dxRating, 0);
  const totalDxRating = totalNewDxRating + totalOldDxRating;

  onProgress?.('Drawing header...');

  // Draw header
  ctx.fillStyle = COLORS.white;
  ctx.font = FONTS.headerTitle;
  ctx.textAlign = 'center';
  ctx.fillText('🎵 maimai DX Rating Chart 🎵', canvasWidth / 2, 50);

  // Draw totals
  ctx.font = FONTS.headerSubtitle;
  ctx.fillText(`Total: ${totalDxRating.toLocaleString()}`, canvasWidth / 2, 90);

  ctx.font = FONTS.headerInfo;
  ctx.fillText(`⭐ New: ${totalNewDxRating.toLocaleString()}`, canvasWidth / 2 - 150, 120);
  ctx.fillText(`📀 Old: ${totalOldDxRating.toLocaleString()}`, canvasWidth / 2 + 150, 120);

  // Draw NEW CHARTS section
  let currentY = topMargin + headerHeight;
  ctx.fillStyle = COLORS.black;
  ctx.font = FONTS.sectionTitle;
  ctx.textAlign = 'center';
  ctx.fillText(
    '🌟 NEW CHARTS (15 songs) 🌟',
    canvasWidth / 2,
    currentY + sectionTitleHeight / 2 + 10,
  );
  currentY += sectionTitleHeight;

  onProgress?.('Drawing new charts...');

  // Draw new songs grid (5 columns, 3 rows)
  for (let row = 0; row < newSongsRows; row++) {
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      if (index < 15) {
        const song = preparedNewSongs[index];
        const x = (canvasWidth - (5 * itemWidth + 4 * gap)) / 2 + col * (itemWidth + gap);
        const y = currentY + row * (itemHeight + gap);

        const coverArtUrl = coverArtMap[song.songName.trim().toLowerCase()];
        const coverArtImage = coverArtUrl ? imageCache.get(coverArtUrl) : undefined;

        try {
          drawGridItem(
            ctx,
            song,
            x,
            y,
            itemWidth,
            itemHeight,
            index,
            song.chartType === 1 ? 'DX' : 'STD',
            coverArtImage,
          );
        } catch (itemError) {
          console.error(`Error drawing new song item ${index} ('${song.songName}'):`, itemError);
        }
      }
    }
  }
  currentY += newSongsGridHeight;

  // Draw OLD CHARTS section
  currentY += sectionSpacing;
  ctx.fillStyle = COLORS.black;
  ctx.font = FONTS.sectionTitle;
  ctx.textAlign = 'center';
  ctx.fillText(
    '📀 OLD CHARTS (35 songs) 📀',
    canvasWidth / 2,
    currentY + sectionTitleHeight / 2 + 10,
  );
  currentY += sectionTitleHeight;

  onProgress?.('Drawing old charts...');

  // Draw old songs grid (5 columns, 7 rows)
  for (let row = 0; row < oldSongsRows; row++) {
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      if (index < 35) {
        const song = preparedOldSongs[index];
        const x = (canvasWidth - (5 * itemWidth + 4 * gap)) / 2 + col * (itemWidth + gap);
        const y = currentY + row * (itemHeight + gap);

        const coverArtUrl = coverArtMap[song.songName.trim().toLowerCase()];
        const coverArtImage = coverArtUrl ? imageCache.get(coverArtUrl) : undefined;

        try {
          drawGridItem(
            ctx,
            song,
            x,
            y,
            itemWidth,
            itemHeight,
            index,
            song.chartType === 1 ? 'DX' : 'STD',
            coverArtImage,
          );
        } catch (itemError) {
          console.error(`Error drawing old song item ${index} ('${song.songName}'):`, itemError);
        }
      }
    }
  }

  onProgress?.('Finalizing image...');

  // Convert canvas to data URL
  const dataUrl = canvas.toDataURL('image/png');

  onProgress?.('Image generation complete!');

  return dataUrl;
};
