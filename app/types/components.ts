// Component-related type definitions

import { Song } from './song';
import { MaimaiSongDbEntry } from './maimai';

// GridItem component props
export interface GridItemProps {
  song: Song;
  index: number;
  chartType: string;
  coverArtUrl?: string;
}

// RatingGrid component props
export interface RatingGridProps {
  newSongs: Song[];
  oldSongs: Song[];
  songDb: MaimaiSongDbEntry[];
}
