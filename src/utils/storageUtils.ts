import { TranscriptLine, Theme } from '../types';

const KEYS = {
  HISTORY: 'sussurro_history',
  THEME: 'sussurro_theme',
  CACHE_ENABLED: 'sussurro_cache_enabled',
};

export const storageUtils = {
  getTranscripts: (): TranscriptLine[] => {
    try {
      const isEnabled = storageUtils.isCacheEnabled();
      if (!isEnabled) return [];
      const data = localStorage.getItem(KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },
  saveTranscripts: (transcripts: TranscriptLine[]) => {
    if (storageUtils.isCacheEnabled()) {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(transcripts));
    }
  },
  clearTranscripts: () => {
    localStorage.removeItem(KEYS.HISTORY);
  },
  getTheme: (): Theme => {
    return (localStorage.getItem(KEYS.THEME) as Theme) || 'dark';
  },
  setTheme: (theme: Theme) => {
    localStorage.setItem(KEYS.THEME, theme);
  },
  isCacheEnabled: (): boolean => {
    const val = localStorage.getItem(KEYS.CACHE_ENABLED);
    return val === null ? true : val === 'true';
  },
  setCacheEnabled: (enabled: boolean) => {
    localStorage.setItem(KEYS.CACHE_ENABLED, String(enabled));
    if (!enabled) {
      storageUtils.clearTranscripts();
    }
  }
};
