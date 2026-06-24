export type PayTier = 'free' | 'one-time' | 'subscription';

export interface PerformerProfile {
  name: string;
  email: string;
  bandName: string;
  facebookUrl?: string;
  cashappTag?: string;
  venmoTag?: string;
  brandBannerText?: string;
  brandBannerUrl?: string;
}

export interface SongSettings {
  fontSize: number; // in pixels or Tailwind classes
  scrollSpeed: number; // pixels per second
  scrollDelay: number; // in seconds
  transpose: number; // semitones (-11 to +11)
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  content: string; // ChordPro format or Plain text
  format: 'chordpro' | 'text';
  genre: string;
  plays: number;
  originalKey: string;
  settings?: SongSettings;
}

export interface RequestItem {
  id: string;
  songId?: string; // empty if custom
  title: string;
  artist: string;
  requesterName: string;
  tipAmount: number;
  requestCount: number;
  isCustom: boolean;
  timestamp: string;
  played: boolean;
}

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
}

export interface ThemeColors {
  bg: string;         // e.g., "#0f172a"
  text: string;       // e.g., "#f8fafc"
  primary: string;    // e.g., "#3b82f6"
  accent: string;     // e.g., "#10b981"
  cardBg: string;     // e.g., "#1e293b"
  mutedText: string;  // e.g., "#94a3b8"
}

export interface AppSettings {
  fontStyle: 'sans' | 'serif' | 'mono';
  defaultFontSize: number;
  defaultScrollDelay: number;
  defaultScrollSpeed: number;
  chordSiteSearchUrl: string; // URL template, e.g., "https://www.ultimate-guitar.com/search.php?value={query}"
  matchFrontBack: boolean;
  backendColors: ThemeColors;
  frontendColors: ThemeColors;
  isDarkMode: boolean;
}

export interface StageSyncState {
  songId: string | null;
  isScrolling: boolean;
  scrollTop: number;
  timestamp: number;
}
