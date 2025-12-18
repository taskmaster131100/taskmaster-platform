import { supabase } from '../../lib/supabase';

export interface Setlist {
  id: string;
  show_id?: string;
  artist_id: string;
  organization_id: string;
  title: string;
  description?: string;
  show_date?: string;
  venue?: string;
  locked: boolean;
  locked_at?: string;
  locked_by?: string;
  total_duration_minutes: number;
  notes?: string;
  technical_notes?: string;
  status: 'draft' | 'review' | 'approved' | 'locked' | 'archived';
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface SetlistItem {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  key_override?: string;
  tempo_override?: number;
  arrangement_id?: string;
  cues?: string;
  notes?: string;
  estimated_duration_seconds?: number;
  segue_to_next: boolean;
  is_encore: boolean;
  created_at?: string;
}

export interface SetlistWithItems extends Setlist {
  items?: SetlistItem[];
}

export const setlistService = {
  async create(input: {
    artist_id: string;
    organization_id: string;
    title: string;
    description?: string;
    show_date?: string;
    venue?: string;
    show_id?: string;
  }): Promise<Setlist> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('setlists')
      .insert({
        ...input,
        created_by: user!.id,
        status: 'draft',
        locked: false,
        total_duration_minutes: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<SetlistWithItems | null> {
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (setlistError) throw setlistError;
    if (!setlist) return null;

    const { data: items, error: itemsError } = await supabase
      .from('setlist_items')
      .select('*')
      .eq('setlist_id', id)
      .order('position');

    if (itemsError) throw itemsError;

    return {
      ...setlist,
      items: items || []
    };
  },

  async getByArtist(artistId: string): Promise<Setlist[]> {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('artist_id', artistId)
      .order('show_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async lock(id: string): Promise<Setlist> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('setlists')
      .update({
        locked: true,
        locked_at: new Date().toISOString(),
        locked_by: user?.id,
        status: 'locked'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unlock(id: string): Promise<Setlist> {
    const { data, error } = await supabase
      .from('setlists')
      .update({
        locked: false,
        locked_at: null,
        locked_by: null,
        status: 'draft'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addItem(input: {
    setlist_id: string;
    song_id: string;
    position: number;
    key_override?: string;
    tempo_override?: number;
    arrangement_id?: string;
    cues?: string;
    notes?: string;
    estimated_duration_seconds?: number;
    segue_to_next?: boolean;
    is_encore?: boolean;
  }): Promise<SetlistItem> {
    const { data, error } = await supabase
      .from('setlist_items')
      .insert({
        ...input,
        segue_to_next: input.segue_to_next || false,
        is_encore: input.is_encore || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('setlist_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async reorderItems(setlistId: string, items: { id: string; position: number }[]): Promise<void> {
    for (const item of items) {
      await supabase
        .from('setlist_items')
        .update({ position: item.position })
        .eq('id', item.id);
    }
  },

  async getItems(setlistId: string): Promise<SetlistItem[]> {
    const { data, error } = await supabase
      .from('setlist_items')
      .select('*')
      .eq('setlist_id', setlistId)
      .order('position');

    if (error) throw error;
    return data || [];
  }
};
