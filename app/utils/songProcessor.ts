// Song parsing and database utilities

import type {
  InputSongData,
  Song,
  SongWithRating,
  MaimaiSongDbEntry,
  StdChartData,
  DxChartData,
} from '../types';
import { getDxRating } from './dxRating';
import { DIFFICULTY_MAP, LATEST_VERSION, SONG_LIMITS } from '../constants';

// Helper function to parse sheetId
export const parseSheetId = (
  sheetId: string,
): { songName: string; chartType: number; difficulty: number } => {
  const parts = sheetId.split('__');
  if (parts.length !== 5) {
    throw new Error(`Invalid sheetId format: ${sheetId}`);
  }

  const songName = parts[0];
  const chartTypeStr = parts[2]; // dx or std
  const difficultyStr = parts[4]; // easy, advanced, expert, master, remaster

  // Convert chartType
  const chartType = chartTypeStr === 'dx' ? 1 : 0;

  // Convert difficulty
  const difficulty = DIFFICULTY_MAP[difficultyStr];
  if (difficulty === undefined) {
    throw new Error(`Unknown difficulty: ${difficultyStr}`);
  }

  return { songName, chartType, difficulty };
};

// Helper function to get level from song database
export const getLevelFromDb = (
  songName: string,
  chartType: number,
  difficulty: number,
  songDb: MaimaiSongDbEntry[],
): number => {
  const song = songDb.find(
    (entry) => entry.title.trim().toLowerCase() === songName.trim().toLowerCase(),
  );
  if (!song) return 0;

  let levelStr: string;

  if (chartType === 1) {
    // DX charts - use dx_lev_* fields
    const dxLevelFieldPairs: Array<[keyof DxChartData, keyof DxChartData]> = [
      ['dx_lev_bas', 'dx_lev_bas'], // basic (no _i version)
      ['dx_lev_adv', 'dx_lev_adv'], // advanced (no _i version)
      ['dx_lev_exp_i', 'dx_lev_exp'], // expert
      ['dx_lev_mas_i', 'dx_lev_mas'], // master
      ['dx_lev_remas_i', 'dx_lev_remas'], // remaster
    ];

    const [primaryField, fallbackField] = dxLevelFieldPairs[difficulty];

    levelStr = (song[primaryField] as string) || '';
    if (!levelStr || levelStr.trim() === '') {
      levelStr = (song[fallbackField] as string) || '';
    }
  } else {
    // STD charts - use lev_* fields
    const stdLevelFieldPairs: Array<[keyof StdChartData, keyof StdChartData]> = [
      ['lev_bas_i', 'lev_bas'], // basic
      ['lev_adv_i', 'lev_adv'], // advanced
      ['lev_exp_i', 'lev_exp'], // expert
      ['lev_mas_i', 'lev_mas'], // master
      ['lev_remas_i', 'lev_remas'], // remaster (no _i version for STD remaster)
    ];

    const [primaryField, fallbackField] = stdLevelFieldPairs[difficulty];

    levelStr = (song[primaryField] as string) || '';
    if (!levelStr || levelStr.trim() === '') {
      levelStr = (song[fallbackField] as string) || '';
    }
  }

  return levelStr ? parseFloat(levelStr) : 0;
};

// Create version map from song database
export const createVersionMap = (songDb: MaimaiSongDbEntry[]): Record<string, number> => {
  const versionMap: Record<string, number> = {};
  songDb.forEach((entry: MaimaiSongDbEntry) => {
    if (entry.title && entry.version) {
      versionMap[entry.title.trim().toLowerCase()] = Number(entry.version);
    }
  });
  return versionMap;
};

// Convert InputSongData to Song format with levels and versions
export const processSongData = (
  inputSongs: InputSongData[],
  songDb: MaimaiSongDbEntry[],
): SongWithRating[] => {
  const versionMap = createVersionMap(songDb);

  // Convert InputSongData to Song format
  const songs: Song[] = inputSongs.map((inputSong) => {
    const { songName, chartType, difficulty } = parseSheetId(inputSong.sheetId);
    const level = getLevelFromDb(songName, chartType, difficulty, songDb);

    return {
      songName,
      chartType,
      difficulty,
      achievement: inputSong.achievementRate,
      level,
    };
  });

  // Attach the version and dxRating to user songs
  return songs.map((song) => {
    const version = versionMap[song.songName.trim().toLowerCase()] ?? 0;
    const dxRating = getDxRating(song.level, song.achievement);
    return { ...song, version, dxRating };
  });
};

// Sort helper: dxRating desc, then achievement desc
export const sortSongs = (a: SongWithRating, b: SongWithRating) => {
  if (b.dxRating !== a.dxRating) return b.dxRating - a.dxRating;
  return b.achievement - a.achievement;
};

// Split and sort songs by version
export const categorizeAndSortSongs = (
  songsWithVersion: SongWithRating[],
): { newSongs: SongWithRating[]; oldSongs: SongWithRating[] } => {
  const newSongs = songsWithVersion
    .filter((song) => song.version >= LATEST_VERSION)
    .sort(sortSongs)
    .slice(0, SONG_LIMITS.NEW_SONGS);

  const oldSongs = songsWithVersion
    .filter((song) => song.version < LATEST_VERSION)
    .sort(sortSongs)
    .slice(0, SONG_LIMITS.OLD_SONGS);

  return { newSongs, oldSongs };
};
