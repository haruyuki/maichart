// DX Rating calculation helpers for MaiMai

export function getRatingThreshold(achievement: number): number {
  const thresholds = [100.5, 100, 99.5, 99, 98, 97, 94, 90, 80];
  for (const t of thresholds) {
    if (achievement >= t) return t;
  }
  return 0;
}

export function getAchievementFactor(achievement: number): number {
  if (achievement >= 100.5) return 0.224;
  if (achievement >= 100) return 0.216;
  if (achievement >= 99.5) return 0.211;
  if (achievement >= 99) return 0.208;
  if (achievement >= 98) return 0.203;
  if (achievement >= 97) return 0.2;
  if (achievement >= 94) return 0.168;
  if (achievement >= 90) return 0.152;
  if (achievement >= 80) return 0.136;
  return 0;
}

export function getDxRating(level: number | undefined, achievement: number): number {
  if (!level) return 0;
  const flooredAchv = Math.min(achievement, 100.5);
  const factor = getAchievementFactor(flooredAchv);
  return Math.floor(Math.abs(level) * flooredAchv * factor);
}

export function getDifficultyColor(difficulty: number): string {
  switch (difficulty) {
    case 4: // Remaster
      return '#e1beff'; // bright purple
    case 3: // Master
      return '#c002f0'; // purple
    case 2: // Expert
      return '#ff008a'; // red
    case 1: // Advanced
      return '#ffb400'; // orange
    case 0: // Basic
      return '#81d955'; // green
    default:
      return '#1477e6'; // blue
  }
}
