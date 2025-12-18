import { supabase } from '../../lib/supabase';

export interface Song {
  id: string;
  artist_id: string;
  organization_id: string;
  title: string;
  artist_name?: string;
  original_key?: string;
  bpm?: number;
  time_signature?: string;
  structure?: any[];
  lyrics?: string;
  chords?: string;
  notes?: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  genre?: string;
  duration_seconds?: number;
  language?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSongInput {
  artist_id: string;
  organization_id: string;
  title: string;
  artist_name?: string;
  original_key?: string;
  bpm?: number;
  time_signature?: string;
  lyrics?: string;
  chords?: string;
  notes?: string;
  genre?: string;
  duration_seconds?: number;
  language?: string;
}

export const songService = {
  async create(input: CreateSongInput): Promise<Song> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('songs')
      .insert({
        ...input,
        created_by: user?.id,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Song>): Promise<Song> {
    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getById(id: string): Promise<Song | null> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getByArtist(artistId: string): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('title');

    if (error) throw error;
    return data || [];
  },

  async getByOrganization(organizationId: string): Promise<Song[]> {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('title');

    if (error) throw error;
    return data || [];
  }
};
