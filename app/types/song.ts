// Song-related type definitions

export interface InputSongData {
  sheetId: string;
  achievementRate: number;
}

export interface Song {
  songName: string;
  chartType: number; // 0 for STD, 1 for DX
  difficulty: number; // 0:easy, 1:advanced, 2:expert, 3:master, 4:remaster
  achievement: number;
  level?: number;
  version?: number; // Add version for matching
}

export interface SongWithRating extends Song {
  dxRating: number;
  version: number;
}
