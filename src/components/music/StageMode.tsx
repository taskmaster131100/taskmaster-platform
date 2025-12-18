import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, ZoomIn, ZoomOut, X, Wifi, WifiOff, Download } from 'lucide-react';
import { setlistService, SetlistItem } from '../../services/music/setlistService';
import { songService, Song } from '../../services/music/songService';
import { stageModeService, StageSettings, defaultStageSettings } from '../../services/music/stageModeService';

interface StageModeProps {
  setlistId: string;
  onExit: () => void;
}

export function StageMode({ setlistId, onExit }: StageModeProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [songs, setSongs] = useState<Map<string, Song>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [settings, setSettings] = useState<StageSettings>(defaultStageSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCached, setIsCached] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSetlist();
    checkCache();

    stageModeService.onOnline(() => setIsOnline(true));
    stageModeService.onOffline(() => setIsOnline(false));

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [setlistId]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, items.length]);

  const loadSetlist = async () => {
    try {
      setLoading(true);

      const cachedSetlist = await stageModeService.getCachedSetlist(setlistId);

      if (cachedSetlist && !navigator.onLine) {
        setItems(cachedSetlist.items);
        const songMap = new Map<string, Song>();
        for (const item of cachedSetlist.items) {
          const cachedSong = await stageModeService.getCachedSong(item.song_id);
          if (cachedSong) {
            songMap.set(item.song_id, cachedSong);
          }
        }
        setSongs(songMap);
        setIsCached(true);
      } else {
        const itemsData = await setlistService.getItems(setlistId);
        setItems(itemsData);

        const songMap = new Map<string, Song>();
        for (const item of itemsData) {
          const song = await songService.getById(item.song_id);
          if (song) {
            songMap.set(item.song_id, song);
            await stageModeService.cacheSong(song.id, song);
          }
        }
        setSongs(songMap);
      }
    } catch (error) {
      console.error('Error loading setlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCache = async () => {
    const cached = await stageModeService.getCachedSetlist(setlistId);
    setIsCached(!!cached);
  };

  const handleDownloadForOffline = async () => {
    try {
      const itemsData = await setlistService.getItems(setlistId);
      const setlistData = await setlistService.getById(setlistId);

      if (setlistData) {
        await stageModeService.preloadSetlist(setlistId, setlistData, itemsData);
        alert('Setlist baixado para uso offline!');
        setIsCached(true);
      }
    } catch (error) {
      console.error('Error downloading for offline:', error);
      alert('Erro ao baixar para offline');
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleZoomIn = () => {
    const sizes: StageSettings['fontSize'][] = ['small', 'medium', 'large', 'xlarge'];
    const currentIdx = sizes.indexOf(settings.fontSize);
    if (currentIdx < sizes.length - 1) {
      setSettings({ ...settings, fontSize: sizes[currentIdx + 1] });
    }
  };

  const handleZoomOut = () => {
    const sizes: StageSettings['fontSize'][] = ['small', 'medium', 'large', 'xlarge'];
    const currentIdx = sizes.indexOf(settings.fontSize);
    if (currentIdx > 0) {
      setSettings({ ...settings, fontSize: sizes[currentIdx - 1] });
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-2xl';
      case 'medium': return 'text-3xl';
      case 'large': return 'text-4xl';
      case 'xlarge': return 'text-5xl';
      default: return 'text-4xl';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando modo palco...</p>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const currentSong = currentItem ? songs.get(currentItem.song_id) : null;

  return (
    <div className={`fixed inset-0 z-50 ${settings.darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="h-full flex flex-col">
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          settings.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-4">
            <span className={`text-xl font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentIndex + 1} / {items.length}
            </span>
            {!isOnline && (
              <span className="flex items-center gap-2 text-yellow-500 text-sm">
                <WifiOff className="w-5 h-5" />
                Modo Offline
              </span>
            )}
            {isOnline && !isCached && (
              <button
                onClick={handleDownloadForOffline}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Baixar para Offline
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className={`p-2 rounded hover:bg-opacity-20 ${
                settings.darkMode ? 'text-white hover:bg-white' : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={handleZoomIn}
              className={`p-2 rounded hover:bg-opacity-20 ${
                settings.darkMode ? 'text-white hover:bg-white' : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded hover:bg-opacity-20 ${
                settings.darkMode ? 'text-white hover:bg-white' : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Settings className="w-6 h-6" />
            </button>
            <button
              onClick={onExit}
              className={`p-2 rounded hover:bg-opacity-20 ${
                settings.darkMode ? 'text-white hover:bg-white' : 'text-gray-700 hover:bg-gray-300'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {currentSong && (
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className={`max-w-4xl mx-auto ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
              <h1 className={`font-bold mb-2 ${getFontSizeClass()}`}>
                {currentSong.title}
              </h1>
              {currentSong.artist_name && (
                <p className={`${settings.darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 text-2xl`}>
                  {currentSong.artist_name}
                </p>
              )}

              <div className="flex items-center gap-6 mb-8 text-xl">
                {currentSong.original_key && (
                  <span className={settings.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Tom: <strong>{currentSong.original_key}</strong>
                  </span>
                )}
                {currentSong.bpm && (
                  <span className={settings.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    BPM: <strong>{currentSong.bpm}</strong>
                  </span>
                )}
                {currentSong.time_signature && (
                  <span className={settings.darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Compasso: <strong>{currentSong.time_signature}</strong>
                  </span>
                )}
              </div>

              {settings.showChords && currentSong.chords && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Cifras</h2>
                  <pre className={`font-mono whitespace-pre-wrap ${getFontSizeClass()}`}>
                    {currentSong.chords}
                  </pre>
                </div>
              )}

              {settings.showLyrics && currentSong.lyrics && (
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Letra</h2>
                  <pre className={`whitespace-pre-wrap leading-relaxed ${getFontSizeClass()}`}>
                    {currentSong.lyrics}
                  </pre>
                </div>
              )}

              {currentItem.notes && (
                <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                  <p className="text-yellow-900 text-xl">
                    <strong>Observação:</strong> {currentItem.notes}
                  </p>
                </div>
              )}

              {currentItem.cues && (
                <div className="mt-4 p-4 bg-blue-100 border-l-4 border-blue-500 rounded">
                  <p className="text-blue-900 text-xl">
                    <strong>Cues:</strong> {currentItem.cues}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          settings.darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              settings.darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
            Anterior
          </button>

          <span className={`text-lg ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Use as setas ← → ou espaço para navegar
          </span>

          <button
            onClick={handleNext}
            disabled={currentIndex === items.length - 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              settings.darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Próxima
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute top-20 right-6 bg-white rounded-lg shadow-xl p-6 w-80 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Configurações</h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Modo Escuro</span>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                className="w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Mostrar Cifras</span>
              <input
                type="checkbox"
                checked={settings.showChords}
                onChange={(e) => setSettings({ ...settings, showChords: e.target.checked })}
                className="w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Mostrar Letra</span>
              <input
                type="checkbox"
                checked={settings.showLyrics}
                onChange={(e) => setSettings({ ...settings, showLyrics: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
