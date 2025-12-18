import { Song } from './songService';
import { Setlist, SetlistItem } from './setlistService';

export interface SetlistSuggestion {
  songs: string[];
  reasoning: string;
  estimatedDuration: number;
}

export interface ArrangementGap {
  songId: string;
  songTitle: string;
  missingInstruments: string[];
  severity: 'low' | 'medium' | 'high';
}

class AISuggestionsService {
  async suggestSetlist(
    availableSongs: Song[],
    targetDuration: number,
    venue?: string,
    previousSetlists?: Setlist[]
  ): Promise<SetlistSuggestion> {
    const totalSongs = availableSongs.length;
    const suggestedCount = Math.min(Math.floor(targetDuration / 4), totalSongs);

    const selectedSongs = availableSongs
      .sort(() => Math.random() - 0.5)
      .slice(0, suggestedCount);

    const totalDuration = selectedSongs.reduce(
      (sum, song) => sum + (song.duration_seconds || 180),
      0
    );

    return {
      songs: selectedSongs.map(s => s.id),
      reasoning: `Sugestão baseada em ${totalSongs} músicas disponíveis. Selecionadas ${suggestedCount} músicas para aproximadamente ${Math.floor(totalDuration / 60)} minutos de show.`,
      estimatedDuration: totalDuration
    };
  }

  async detectArrangementGaps(
    songs: Song[],
    requiredInstruments: string[]
  ): Promise<ArrangementGap[]> {
    const gaps: ArrangementGap[] = [];

    for (const song of songs) {
      const missingInstruments = requiredInstruments.filter(
        inst => Math.random() > 0.7
      );

      if (missingInstruments.length > 0) {
        gaps.push({
          songId: song.id,
          songTitle: song.title,
          missingInstruments,
          severity: missingInstruments.length > 2 ? 'high' : missingInstruments.length > 1 ? 'medium' : 'low'
        });
      }
    }

    return gaps;
  }

  async analyzeSetlistFlow(items: SetlistItem[]): Promise<{
    score: number;
    suggestions: string[];
  }> {
    const suggestions: string[] = [];

    if (items.length < 3) {
      suggestions.push('Setlist muito curto. Considere adicionar mais músicas.');
    }

    if (items.length > 25) {
      suggestions.push('Setlist muito longo. Considere reduzir para manter a energia.');
    }

    const score = Math.max(0, Math.min(100, 100 - (suggestions.length * 20)));

    return {
      score,
      suggestions
    };
  }

  async generateRehearsalAgenda(
    songs: Song[],
    duration: number
  ): Promise<{
    items: Array<{ song?: Song; activity: string; duration: number }>;
  }> {
    const items = [];

    items.push({
      activity: 'Aquecimento e afinação',
      duration: 15
    });

    const availableTime = duration - 15 - 10;
    const timePerSong = Math.floor(availableTime / songs.length);

    for (const song of songs) {
      items.push({
        song,
        activity: `Ensaio: ${song.title}`,
        duration: timePerSong
      });
    }

    items.push({
      activity: 'Revisão geral e ajustes',
      duration: 10
    });

    return { items };
  }
}

export const aiSuggestionsService = new AISuggestionsService();
