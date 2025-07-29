'use server';

import {NextRequest, NextResponse} from 'next/server';
import {CanvasRenderingContext2D, Image} from 'skia-canvas';
import {SongWithRating} from '@/app/types';
import {getDifficultyColor} from '@/app/utils/dxRating';
import path from 'path';

// Helper function to get safe font string with fallbacks
const getSafeFont = (size: string, weight: string = '', fontFamily: string = 'Noto Sans'): string => {
  // Use generic fallbacks that don't require system font libraries
  const fallbacks = 'Arial, Helvetica, sans-serif';
  const weightPrefix = weight ? `${weight} ` : '';
  return `${weightPrefix}${size} "${fontFamily}", ${fallbacks}`;
};

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
  coverArtImage?: Image
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
    ctx.font = getSafeFont('16px', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText('NO DATA', x + width / 2, y + height / 2);
    return;
  }

  const textColor = coverArtImage ? '#fff' : '#000';

  // Draw index (top-left)
  ctx.fillStyle = textColor;
  ctx.font = getSafeFont('16px', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText((index + 1).toString(), x + 8, y + 20);

  // Draw chart type (top-right)
  ctx.fillStyle = chartType === 'DX' ? '#ff6b35' : '#4a90e2';
  ctx.font = getSafeFont('13px', 'bold');
  ctx.textAlign = 'right';
  ctx.fillText(chartType, x + width - 8, y + 18);

  // Draw song name (truncated)
  ctx.fillStyle = textColor;
  ctx.font = getSafeFont('14px');
  ctx.textAlign = 'center';
  const truncatedName = song.songName.length > 20 ? song.songName.substring(0, 20) + '...' : song.songName;
  ctx.fillText(truncatedName, x + width / 2, y + 45);

  // Draw achievement percentage
  ctx.fillStyle = '#ccc';
  ctx.font = getSafeFont('13px');
  ctx.fillText(`${song.achievement.toFixed(2)}%`, x + width / 2, y + 65);

  // Draw achievement rating
  ctx.fillStyle = '#ffc107';
  ctx.font = getSafeFont('25px', 'bold');
  ctx.fillText(getAchievementRating(song.achievement), x + width / 2, y + 90);

  // Draw level
  if (song.level !== undefined) {
    ctx.fillStyle = textColor;
    ctx.font = getSafeFont('18px', 'bold');
    ctx.fillText(`Lv.${song.level}`, x + width / 2, y + 110);
  }

  // Draw DX rating (bottom)
  ctx.fillStyle = '#82caff';
  ctx.font = getSafeFont('40px', 'bold');
  ctx.fillText(song.dxRating.toString(), x + width / 2, y + height - 10);
};

export async function POST(request: NextRequest) {
  console.log('🎵 Starting image generation...');

  try {
    console.log('📝 Parsing request body...');
    const body = await request.json();
    const { newSongs, oldSongs, coverArtMap }: {
      newSongs: SongWithRating[],
      oldSongs: SongWithRating[],
      coverArtMap: Record<string, string>
    } = body;

    console.log(`📊 Received data: ${newSongs.length} new songs, ${oldSongs.length} old songs`);

    // With the new next.config.ts, a standard import will now work.
    const { Canvas, Image, FontLibrary } = await import('skia-canvas');

    // Register the font by providing the file path with error handling
    const fontPath = path.join(process.cwd(), 'app', 'assets', 'NotoSans-Regular.ttf');
    console.log(`🔤 Attempting to load font from: ${fontPath}`);

    try {
      // Check if font file exists
      const fs = await import('fs');
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font file not found at: ${fontPath}`);
      }

      // eslint-disable-next-line react-hooks/rules-of-hooks
      FontLibrary.use("Noto Sans", fontPath);
      console.log('✅ Font registered successfully');

      // Verify font is available
      const availableFonts = FontLibrary.families;
      console.log('📝 Available font families:', availableFonts);

      if (!availableFonts.includes('Noto Sans')) {
        console.warn('⚠️ Noto Sans not found in available fonts, will use fallback');
      }
    } catch (fontError) {
      console.error('❌ Font loading error:', fontError);
      console.log('🔄 Continuing with system fallback fonts...');
    }

    // Cache for loaded images
    const imageCache = new Map<string, Image>();
    const loadCoverArt = async (url: string): Promise<Image | undefined> => {
      if (!url) return undefined;
      if (imageCache.has(url)) {
        return imageCache.get(url);
      }
      try {
        const absoluteUrl = new URL(url, request.url).href;
        const response = await fetch(absoluteUrl, { next: { revalidate: 3600 } }); // Revalidate images every hour
        if (!response.ok) {
          console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          return undefined;
        }
        const buffer = await response.arrayBuffer();
        const image = new Image();
        image.src = Buffer.from(buffer);
        await image.decode();
        imageCache.set(url, image);
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

    console.log('🎨 Creating canvas...');
    const canvas = new Canvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
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
    ctx.font = getSafeFont('32px', 'bold');
    ctx.textAlign = 'center';
    ctx.fillText('🎵 maimai DX Rating Chart 🎵', canvasWidth / 2, 50);

    // Draw totals
    ctx.font = getSafeFont('24px', 'bold');
    ctx.fillText(`Total: ${totalDxRating.toLocaleString()}`, canvasWidth / 2, 90);

    ctx.font = getSafeFont('20px');
    ctx.fillText(`⭐ New: ${totalNewDxRating.toLocaleString()}`, canvasWidth / 2 - 150, 120);
    ctx.fillText(`📀 Old: ${totalOldDxRating.toLocaleString()}`, canvasWidth / 2 + 150, 120);
    console.log('✅ Header drawn');

    // Grid settings
    // Draw NEW CHARTS section
    let currentY = topMargin + headerHeight;
    console.log('🌟 Drawing NEW CHARTS section...');
    ctx.fillStyle = '#000';
    ctx.font = getSafeFont('28px', 'bold');
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
          const coverArtImage = await loadCoverArt(coverArtUrl);

          try {
            drawGridItem(ctx, song, x, y, itemWidth, itemHeight, index, song.chartType === 1 ? 'DX' : 'STD', coverArtImage);
          } catch (itemError) {
            console.error(`❌ Error drawing new song item ${index} ('${song.songName}'):`, itemError);
            // Do not re-throw; allow the rest of the grid to be drawn
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
    ctx.font = getSafeFont('28px', 'bold');
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
            // Do not re-throw; allow the rest of the grid to be drawn
          }
        }
      }
    }
    console.log('✅ OLD CHARTS grid drawn');

    // Convert canvas to PNG buffer
    console.log('🖼️ Converting canvas to PNG buffer...');
    const buffer = await canvas.toBuffer('png');
    console.log(`✅ PNG buffer created successfully (${buffer.length} bytes)`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Error generating rating image:', error);

    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json({
      error: 'Failed to generate image',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}
