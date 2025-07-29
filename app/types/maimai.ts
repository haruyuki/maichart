// MaiMai-specific type definitions moved from utils/maimaiSongDbEntry.ts

// Base interface with common song metadata
export interface BaseMaimaiSongEntry {
  sort: string;
  title: string;
  title_kana: string;
  artist: string;
  catcode: string;
  version: string;
  bpm: string;
  image_url: string;
  release: string;
  wiki_url: string;
  intl: string;
  date_added: string;
  date_intl_added: string;
}

// STD-specific chart data
export interface StdChartData {
  lev_bas: string;
  lev_adv: string;
  lev_exp: string;
  lev_mas: string;
  lev_remas: string;
  lev_bas_i: string;
  lev_bas_notes: string;
  lev_bas_notes_tap: string;
  lev_bas_notes_hold: string;
  lev_bas_notes_slide: string;
  lev_bas_notes_break: string;
  lev_adv_i: string;
  lev_adv_notes: string;
  lev_adv_notes_tap: string;
  lev_adv_notes_hold: string;
  lev_adv_notes_slide: string;
  lev_adv_notes_break: string;
  lev_exp_i: string;
  lev_exp_notes: string;
  lev_exp_notes_tap: string;
  lev_exp_notes_hold: string;
  lev_exp_notes_slide: string;
  lev_exp_notes_break: string;
  lev_exp_designer: string;
  lev_mas_i: string;
  lev_mas_notes: string;
  lev_mas_notes_tap: string;
  lev_mas_notes_hold: string;
  lev_mas_notes_slide: string;
  lev_mas_notes_break: string;
  lev_mas_designer: string;
  lev_remas_i: string;
  lev_remas_notes: string;
  lev_remas_notes_tap: string;
  lev_remas_notes_hold: string;
  lev_remas_notes_slide: string;
  lev_remas_notes_break: string;
  lev_remas_designer: string;
}

// DX-specific chart data
export interface DxChartData {
  dx_lev_bas?: string;
  dx_lev_adv?: string;
  dx_lev_exp?: string;
  dx_lev_mas?: string;
  dx_lev_remas?: string;
  dx_lev_bas_notes?: string;
  dx_lev_bas_notes_tap?: string;
  dx_lev_bas_notes_hold?: string;
  dx_lev_bas_notes_slide?: string;
  dx_lev_bas_notes_touch?: string;
  dx_lev_bas_notes_break?: string;
  dx_lev_adv_notes?: string;
  dx_lev_adv_notes_tap?: string;
  dx_lev_adv_notes_hold?: string;
  dx_lev_adv_notes_slide?: string;
  dx_lev_adv_notes_touch?: string;
  dx_lev_adv_notes_break?: string;
  dx_lev_exp_i?: string;
  dx_lev_exp_notes?: string;
  dx_lev_exp_notes_tap?: string;
  dx_lev_exp_notes_hold?: string;
  dx_lev_exp_notes_slide?: string;
  dx_lev_exp_notes_touch?: string;
  dx_lev_exp_notes_break?: string;
  dx_lev_exp_designer?: string;
  dx_lev_mas_i?: string;
  dx_lev_mas_notes?: string;
  dx_lev_mas_notes_tap?: string;
  dx_lev_mas_notes_hold?: string;
  dx_lev_mas_notes_slide?: string;
  dx_lev_mas_notes_touch?: string;
  dx_lev_mas_notes_break?: string;
  dx_lev_mas_designer?: string;
  dx_lev_remas_i: string;
  dx_lev_remas_notes: string;
  dx_lev_remas_notes_tap: string;
  dx_lev_remas_notes_hold: string;
  dx_lev_remas_notes_slide: string;
  dx_lev_remas_notes_touch: string;
  dx_lev_remas_notes_break: string;
  dx_lev_remas_designer: string;
}

// Full combined interface (for backward compatibility)
export interface MaimaiSongDbEntry extends BaseMaimaiSongEntry, StdChartData, DxChartData {}

// Utility types for working with specific chart types
export type StdSongEntry = BaseMaimaiSongEntry & StdChartData;
export type DxSongEntry = BaseMaimaiSongEntry & DxChartData;
