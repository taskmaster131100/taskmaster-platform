import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MusicCacheDB extends DBSchema {
  songs: {
    key: string;
    value: {
      id: string;
      data: any;
      version: number;
      cachedAt: number;
    };
  };
  setlists: {
    key: string;
    value: {
      id: string;
      data: any;
      items: any[];
      version: number;
      cachedAt: number;
    };
  };
}

class StageModeService {
  private db: IDBPDatabase<MusicCacheDB> | null = null;
  private readonly DB_NAME = 'tm_music_cache';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<MusicCacheDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('setlists')) {
          db.createObjectStore('setlists', { keyPath: 'id' });
        }
      },
    });
  }

  async cacheSong(id: string, data: any, version: number = 1): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('songs', {
      id,
      data,
      version,
      cachedAt: Date.now(),
    });
  }

  async getCachedSong(id: string): Promise<any | null> {
    await this.init();
    if (!this.db) return null;

    const cached = await this.db.get('songs', id);
    if (!cached) return null;

    return cached.data;
  }

  async cacheSetlist(id: string, data: any, items: any[], version: number = 1): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('setlists', {
      id,
      data,
      items,
      version,
      cachedAt: Date.now(),
    });
  }

  async getCachedSetlist(id: string): Promise<{ data: any; items: any[] } | null> {
    await this.init();
    if (!this.db) return null;

    const cached = await this.db.get('setlists', id);
    if (!cached) return null;

    return {
      data: cached.data,
      items: cached.items,
    };
  }

  async preloadSetlist(setlistId: string, setlistData: any, items: any[]): Promise<void> {
    await this.cacheSetlist(setlistId, setlistData, items);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnline(callback: () => void): void {
    window.addEventListener('online', callback);
  }

  onOffline(callback: () => void): void {
    window.addEventListener('offline', callback);
  }
}

export const stageModeService = new StageModeService();

export interface StageSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  darkMode: boolean;
  autoScroll: boolean;
  scrollSpeed: number;
  showChords: boolean;
  showLyrics: boolean;
  transpose: number;
  metronome: boolean;
  bpm?: number;
}

export const defaultStageSettings: StageSettings = {
  fontSize: 'large',
  darkMode: true,
  autoScroll: false,
  scrollSpeed: 1,
  showChords: true,
  showLyrics: true,
  transpose: 0,
  metronome: false,
};
