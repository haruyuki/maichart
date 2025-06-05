import React from "react";
import { getDxRating, getDifficultyColor } from "../utils/dxRating";
import {Song} from "@/app/page";

// Font size constants for easy adjustment
const FONT_SIZE_INDEX = 16;
const FONT_SIZE_SONG_NAME = 14;
const FONT_SIZE_CHART_TYPE = 13;
const FONT_SIZE_ACHIEVEMENT = 13;
const FONT_SIZE_ACHIEVEMENT_RATING = 25;
const FONT_SIZE_LEVEL = 18;
const FONT_SIZE_DX_RATING = 40;

interface GridItemProps {
  song: Song;
  index: number;
  chartType: string;
  coverArtUrl?: string;
}

const getAchievementRating = (achievement: number): string => {
  if (achievement >= 100.5) return "SSS+";
  if (achievement >= 100) return "SSS";
  if (achievement >= 99.5) return "SS+";
  if (achievement >= 99) return "SS";
  if (achievement >= 98) return "S+";
  if (achievement >= 97) return "S";
  if (achievement >= 94) return "AAA";
  if (achievement >= 90) return "AA";
  if (achievement >= 80) return "A";
  return "B";
};

export const GridItem: React.FC<GridItemProps> = ({
  song,
  index,
  chartType,
  coverArtUrl,
}) => {
  // Padding and sizing
  const paddingX = 8;
  const paddingY = 0;

  // Check if this is a placeholder song
  const isPlaceholder = song.difficulty === -1;

  // Provide a fallback for getDifficultyColor if not passed
  const difficultyColor = isPlaceholder ? "#646464" : getDifficultyColor(song.difficulty);

  if (isPlaceholder) {
    // Render placeholder for NO DATA
    return (
      <div
        className="relative rounded-md overflow-hidden shadow-lg border border-white/40 flex items-center justify-center"
        style={{
          width: 200,
          height: 150,
          background: "#646464",
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div
          className="text-white font-bold text-xl"
          style={{ fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}
        >
          NO DATA
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-md overflow-hidden shadow-lg border border-white/40"
      style={{
        width: 200,
        height: 150,
        background: difficultyColor,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Cover art as background, with blur and dark overlay */}
      {coverArtUrl && (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `url('${coverArtUrl}') center center/cover no-repeat`,
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute inset-0 z-10"
            style={{
              background: 'rgba(0,0,0,0.4)',
            }}
          />
        </>
      )}
      {/* Difficulty triangle */}
      <svg
        className="absolute right-0 top-0 z-20"
        width={60}
        height={60}
      >
        <polygon
          points="60,0 22,0 60,38"
          fill={difficultyColor}
          fillOpacity={0.85}
        />
      </svg>
      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col justify-between z-30"
        style={{ color: 'white', fontFamily: 'var(--font-roboto), Roboto, sans-serif' }}
      >
        <div style={{ padding: `${paddingY}px ${paddingX}px 0 ${paddingX}px` }}>
          <div style={{ fontWeight: 100, fontSize: FONT_SIZE_INDEX }}>{`#${index + 1}`}</div>
          <div
            style={{
              fontSize: FONT_SIZE_SONG_NAME,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180,
            }}
            title={song.songName}
          >
            {song.songName}
          </div>
          <div style={{ fontWeight: 100, fontSize: FONT_SIZE_CHART_TYPE }}>{chartType}</div>
        </div>
        <div className="flex justify-between items-end" style={{ padding: `0 ${paddingX}px ${paddingY}px ${paddingX}px`, position: 'relative' }}>
          <div>
            <div style={{ fontWeight: 100, fontSize: FONT_SIZE_ACHIEVEMENT }}>{song.achievement.toFixed(4)}</div>
            <div style={{ fontWeight: 500, fontSize: FONT_SIZE_ACHIEVEMENT_RATING, lineHeight: 1 }}>{getAchievementRating(song.achievement)}</div>
          </div>
          <div className="text-right" style={{ position: 'absolute', right: paddingX, bottom: paddingY, lineHeight: 1 }}>
            <div style={{ fontWeight: 500, fontSize: FONT_SIZE_LEVEL }}>{song.level !== undefined ? song.level : '-'}</div>
            <div style={{ fontWeight: 700, fontSize: FONT_SIZE_DX_RATING }}>
              {getDxRating(song.level, song.achievement)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



