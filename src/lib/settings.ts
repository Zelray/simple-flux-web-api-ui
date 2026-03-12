// Settings storage and defaults

export interface AppSettings {
  paths: {
    saved_images: string;
    saved_videos: string;
    saved_training: string;
    saved_loras: string;
  };
  autoSave: boolean;
  thumbnailSize: 'small' | 'medium' | 'large';
}

const SETTINGS_KEY = 'fal-ai-settings';

export const DEFAULT_SETTINGS: AppSettings = {
  paths: {
    saved_images: './output/images',
    saved_videos: './output/videos',
    saved_training: './output/training',
    saved_loras: './loras',
  },
  autoSave: true,
  thumbnailSize: 'medium',
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return getSettings()[key];
}
