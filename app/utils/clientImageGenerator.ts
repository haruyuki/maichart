'use client';

import { SongWithRating } from '@/app/types';
import { getDifficultyColor } from '@/app/utils/dxRating';

// Helper function to ensure fonts are loaded before canvas rendering
const loadFonts = async (): Promise<void> => {
  // Check if FontFace API is available
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      // Load Roboto font weights that match your Next.js config
      await Promise.all([
        document.fonts.load('400 16px Roboto'),
        document.fonts.load('700 16px Roboto'),
      ]);

      // Wait a bit for fonts to be fully available
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Failed to load Roboto fonts, falling back to system fonts:', error);
    }
  }
};

// Cache for commonly used strings and styles
const FONTS = {
  headerTitle: 'bold 32px Roboto, Arial, sans-serif',
  headerSubtitle: 'bold 24px Roboto, Arial, sans-serif',
  headerInfo: '20px Roboto, Arial, sans-serif',
  sectionTitle: 'bold 28px Roboto, Arial, sans-serif',
  itemIndex: 'bold 16px Roboto, Arial, sans-serif',
  itemChartType: 'bold 13px Roboto, Arial, sans-serif',
  itemSongName: '14px Roboto, Arial, sans-serif',
  itemAchievement: '13px Roboto, Arial, sans-serif',
  itemRating: 'bold 25px Roboto, Arial, sans-serif',
  itemLevel: 'bold 18px Roboto, Arial, sans-serif',
  itemDxRating: 'bold 40px Roboto, Arial, sans-serif',
  placeholder: 'bold 16px Roboto, Arial, sans-serif',
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
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

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
  onProgress?: (loaded: number, total: number) => void,
): Promise<Map<string, HTMLImageElement>> => {
  const imageCache = new Map<string, HTMLImageElement>();
  const uniqueUrls = new Set<string>();

  // Collect all unique URLs
  songs.forEach((song) => {
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

// Optimized text truncation with canvas measurement
const truncationCache = new Map<string, string>();
const getTruncatedText = (
  text: string,
  maxWidth?: number,
  ctx?: CanvasRenderingContext2D,
): string => {
  // If no canvas context or maxWidth provided, use simple character-based truncation
  if (!ctx || !maxWidth) {
    const maxLength = 20;
    const key = `${text}_${maxLength}`;
    if (truncationCache.has(key)) {
      return truncationCache.get(key)!;
    }
    const result = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    truncationCache.set(key, result);
    return result;
  }

  // Use canvas text measurement for accurate truncation
  const key = `${text}_${maxWidth}_${ctx.font}`;
  if (truncationCache.has(key)) {
    return truncationCache.get(key)!;
  }

  const textWidth = ctx.measureText(text).width;
  if (textWidth <= maxWidth) {
    truncationCache.set(key, text);
    return text;
  }

  // Binary search for the best fit
  let start = 0;
  let end = text.length;
  let result = text;

  while (start < end) {
    const mid = Math.floor((start + end + 1) / 2);
    const truncated = text.substring(0, mid) + '...';
    const width = ctx.measureText(truncated).width;

    if (width <= maxWidth) {
      result = truncated;
      start = mid;
    } else {
      end = mid - 1;
    }
  }

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
  radius: number = 12,
): void => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
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
  const paddingX = 8;
  const paddingY = 0;

  // Create a rounded rectangle path
  createRoundedRectPath(ctx, x, y, width, height);

  if (isPlaceholder) {
    // Placeholder background
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
  } else {
    // Save the current state and clip to rounded rectangle for all content
    ctx.save();
    ctx.clip();

    // Draw cover art background if available
    if (coverArtImage) {
      // Calculate scaling and positioning for "cover" behavior
      const imageAspect = coverArtImage.width / coverArtImage.height;
      const containerAspect = width / height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imageAspect > containerAspect) {
        // Image is wider than container - scale by height
        drawHeight = height;
        drawWidth = height * imageAspect;
        drawX = x - (drawWidth - width) / 2; // Center horizontally
        drawY = y;
      } else {
        // Image is taller than container - scale by width
        drawWidth = width;
        drawHeight = width / imageAspect;
        drawX = x;
        drawY = y - (drawHeight - height) / 2; // Center vertically
      }

      // Draw blurred cover art
      ctx.filter = 'blur(2px)';
      ctx.drawImage(coverArtImage, drawX, drawY, drawWidth, drawHeight);

      // Draw dark overlay
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y, width, height);
    }

    // Draw difficulty triangle (top-right corner) - now clipped to rounded rectangle
    const triangleSize = 55;
    ctx.fillStyle = getDifficultyColor(song.difficulty);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x + width - triangleSize, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + triangleSize * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Restore the context (removes clipping)
    ctx.restore();

    // Recreate the path for the border
    createRoundedRectPath(ctx, x, y, width, height);
  }

  // Draw border
  ctx.strokeStyle = isPlaceholder ? COLORS.placeholderBorder : getDifficultyColor(song.difficulty);
  ctx.lineWidth = 3;
  ctx.stroke();

  if (isPlaceholder) {
    // Draw placeholder content centered
    ctx.fillStyle = COLORS.placeholderText;
    ctx.font = FONTS.placeholder;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❌', x + width / 2, y + height / 2 - 10);
    ctx.fillText('NO DATA', x + width / 2, y + height / 2 + 15);
    return;
  }

  const textColor = coverArtImage ? COLORS.white : COLORS.black;

  // TOP SECTION - Index, Song Name, Chart Type
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';

  // Draw index (top-left)
  ctx.font = FONTS.itemIndex;
  ctx.textAlign = 'left';
  ctx.fillText(`#${index + 1}`, x + paddingX, y + paddingY + 4);

  // Draw song name (below index, left-aligned, truncated)
  ctx.font = FONTS.itemSongName;
  ctx.textAlign = 'left';
  const maxSongNameWidth = width - paddingX * 2 - 20; // Leave space for triangle
  const truncatedName = getTruncatedText(song.songName, maxSongNameWidth, ctx);
  ctx.fillText(truncatedName, x + paddingX, y + paddingY + 24);

  // Draw chart type (below song name, left-aligned)
  ctx.font = FONTS.itemChartType;
  ctx.textAlign = 'left';
  ctx.fillText(chartType, x + paddingX, y + paddingY + 44);

  // BOTTOM SECTION - Achievement & Rating (left), Level & DX Rating (right)
  ctx.textBaseline = 'bottom';

  // Bottom-left: Achievement and Rating
  ctx.textAlign = 'left';

  // Achievement percentage
  ctx.fillStyle = textColor;
  ctx.font = FONTS.itemAchievement;
  ctx.fillText(song.achievement.toFixed(4), x + paddingX, y + height - paddingY - 25);

  // Achievement rating
  ctx.fillStyle = COLORS.white;
  ctx.font = FONTS.itemRating;
  ctx.fillText(getAchievementRating(song.achievement), x + paddingX, y + height - paddingY);

  // Bottom-right: Level and DX Rating
  ctx.textAlign = 'right';

  // Level
  ctx.fillStyle = textColor;
  ctx.font = FONTS.itemLevel;
  const levelText = song.level !== undefined ? song.level.toString() : '-';
  ctx.fillText(levelText, x + width - paddingX, y + height - paddingY - 40);

  // DX Rating
  ctx.fillStyle = COLORS.white;
  ctx.font = FONTS.itemDxRating;
  ctx.fillText(song.dxRating.toString(), x + width - paddingX, y + height - paddingY);
};

// Helper function to draw section header
const drawSectionHeader = (
  ctx: CanvasRenderingContext2D,
  title: string,
  canvasWidth: number,
  y: number,
  sectionTitleHeight: number,
): void => {
  ctx.fillStyle = COLORS.black;
  ctx.font = FONTS.sectionTitle;
  ctx.textAlign = 'center';
  ctx.fillText(title, canvasWidth / 2, y + sectionTitleHeight / 2 + 10);
};

// Helper function to draw a songs grid
const drawSongsGrid = (
  ctx: CanvasRenderingContext2D,
  songs: SongWithRating[],
  coverArtMap: Record<string, string>,
  imageCache: Map<string, HTMLImageElement>,
  startY: number,
  canvasWidth: number,
  itemWidth: number,
  itemHeight: number,
  gap: number,
  columns: number,
  maxSongs: number,
): void => {
  const rows = Math.ceil(maxSongs / columns);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < maxSongs) {
        const song = songs[index];
        const x =
          (canvasWidth - (columns * itemWidth + (columns - 1) * gap)) / 2 + col * (itemWidth + gap);
        const y = startY + row * (itemHeight + gap);

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
          console.error(`Error drawing song item ${index} ('${song.songName}'):`, itemError);
        }
      }
    }
  }
};

// Configuration interface for sections
interface SectionConfig {
  title: string;
  songs: SongWithRating[];
  maxSongs: number;
  progressMessage: string;
}

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

  onProgress?.('Loading fonts...');

  // Ensure fonts are loaded before canvas operations
  await loadFonts();

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

  // Configuration for both sections
  const sections: SectionConfig[] = [
    {
      title: '🌟 NEW CHARTS (15 songs) 🌟',
      songs: preparedNewSongs,
      maxSongs: 15,
      progressMessage: 'Drawing new charts...',
    },
    {
      title: '📀 OLD CHARTS (35 songs) 📀',
      songs: preparedOldSongs,
      maxSongs: 35,
      progressMessage: 'Drawing old charts...',
    },
  ];

  let currentY = topMargin + headerHeight;
  const columns = 5;

  // Draw both sections using the same logic
  sections.forEach((section, sectionIndex) => {
    // Add spacing before old charts section
    if (sectionIndex > 0) {
      currentY += sectionSpacing;
    }

    // Draw section header
    drawSectionHeader(ctx, section.title, canvasWidth, currentY, sectionTitleHeight);
    currentY += sectionTitleHeight;

    onProgress?.(section.progressMessage);

    // Draw songs grid
    drawSongsGrid(
      ctx,
      section.songs,
      coverArtMap,
      imageCache,
      currentY,
      canvasWidth,
      itemWidth,
      itemHeight,
      gap,
      columns,
      section.maxSongs,
    );

    // Update currentY for next section
    const rows = Math.ceil(section.maxSongs / columns);
    const gridHeight = rows * itemHeight + (rows - 1) * gap;
    currentY += gridHeight;
  });

  onProgress?.('Finalizing image...');

  // Convert canvas to data URL
  const dataUrl = canvas.toDataURL('image/png');

  onProgress?.('Image generation complete!');

  return dataUrl;
};
