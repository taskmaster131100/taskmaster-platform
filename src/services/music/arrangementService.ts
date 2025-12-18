import { supabase } from '../../lib/supabase';

export interface Arrangement {
  id: string;
  song_id: string;
  arranger_id?: string;
  version: number;
  title: string;
  description?: string;
  notes?: string;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'archived';
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  is_current: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Part {
  id: string;
  arrangement_id: string;
  instrument: string;
  transpose_semitones: number;
  clef: 'treble' | 'bass' | 'alto' | 'tenor';
  url_pdf?: string;
  url_musicxml?: string;
  url_midi?: string;
  version: number;
  notes?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SongAsset {
  id: string;
  song_id: string;
  type: 'pdf' | 'musicxml' | 'midi' | 'audio' | 'video' | 'other';
  name: string;
  url: string;
  size_bytes?: number;
  version: number;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  uploaded_by: string;
  notes?: string;
  created_at?: string;
}

export const arrangementService = {
  async createArrangement(input: {
    song_id: string;
    title: string;
    description?: string;
    notes?: string;
  }): Promise<Arrangement> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existingArrangements } = await supabase
      .from('arrangements')
      .select('version')
      .eq('song_id', input.song_id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingArrangements?.[0]?.version ? existingArrangements[0].version + 1 : 1;

    const { data, error } = await supabase
      .from('arrangements')
      .insert({
        ...input,
        arranger_id: user?.id,
        version: nextVersion,
        status: 'draft',
        is_current: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateArrangement(id: string, updates: Partial<Arrangement>): Promise<Arrangement> {
    const { data, error } = await supabase
      .from('arrangements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getArrangementsBySong(songId: string): Promise<Arrangement[]> {
    const { data, error } = await supabase
      .from('arrangements')
      .select('*')
      .eq('song_id', songId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPart(input: {
    arrangement_id: string;
    instrument: string;
    transpose_semitones?: number;
    clef?: string;
    url_pdf?: string;
    url_musicxml?: string;
    url_midi?: string;
    notes?: string;
    difficulty?: string;
  }): Promise<Part> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('parts')
      .insert({
        ...input,
        transpose_semitones: input.transpose_semitones || 0,
        clef: input.clef || 'treble',
        version: 1,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePart(id: string, updates: Partial<Part>): Promise<Part> {
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPartsByArrangement(arrangementId: string): Promise<Part[]> {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('arrangement_id', arrangementId)
      .order('instrument');

    if (error) throw error;
    return data || [];
  }
};
