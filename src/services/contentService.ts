import { supabase } from '../lib/supabase';

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  platform: Platform;
  post_type: PostType;
  status: ContentStatus;
  scheduled_date?: string;
  published_date?: string;
  media_urls: string[];
  hashtags: string[];
  mentions: string[];
  engagement_goal?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'linkedin' | 'threads';
export type PostType = 'feed' | 'story' | 'reel' | 'video' | 'carousel' | 'tweet' | 'short';
export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'cancelled';

export const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'threads', label: 'Threads', icon: '🧵' }
];

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'story', label: 'Story' },
  { value: 'reel', label: 'Reel' },
  { value: 'video', label: 'Vídeo' },
  { value: 'carousel', label: 'Carrossel' },
  { value: 'tweet', label: 'Tweet' },
  { value: 'short', label: 'Short' }
];

export const CONTENT_STATUSES: { value: ContentStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Rascunho', color: 'gray' },
  { value: 'scheduled', label: 'Agendado', color: 'blue' },
  { value: 'published', label: 'Publicado', color: 'green' },
  { value: 'cancelled', label: 'Cancelado', color: 'red' }
];

export async function createPost(postData: Partial<ContentPost>): Promise<ContentPost> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('content_posts')
    .insert({
      ...postData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  if (data.status === 'scheduled' && data.scheduled_date) {
    await createCalendarEntry(data);
  }

  return data;
}

async function createCalendarEntry(post: ContentPost): Promise<void> {
  const date = new Date(post.scheduled_date!);

  await supabase.from('content_calendar').insert({
    post_id: post.id,
    calendar_date: date.toISOString().split('T')[0],
    time_slot: date.toTimeString().split(' ')[0]
  });
}

export async function updatePost(id: string, updates: Partial<ContentPost>): Promise<ContentPost> {
  const { data, error } = await supabase
    .from('content_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (updates.status === 'scheduled' && updates.scheduled_date) {
    await supabase
      .from('content_calendar')
      .delete()
      .eq('post_id', id);

    await createCalendarEntry(data);
  }

  if (updates.status === 'published') {
    await supabase
      .from('content_posts')
      .update({ published_date: new Date().toISOString() })
      .eq('id', id);
  }

  return data;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('content_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await supabase
    .from('calendar_events')
    .delete()
    .eq('metadata->>post_id', id);
}

export async function listPosts(filters?: {
  status?: ContentStatus;
  platform?: Platform;
  date?: string;
}): Promise<ContentPost[]> {
  let query = supabase
    .from('content_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }

  if (filters?.date) {
    const date = new Date(filters.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    query = query
      .gte('scheduled_date', date.toISOString())
      .lt('scheduled_date', nextDay.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getPostById(id: string): Promise<ContentPost | null> {
  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUpcomingPosts(days: number = 7): Promise<ContentPost[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_date', today.toISOString())
    .lte('scheduled_date', futureDate.toISOString())
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function duplicatePost(id: string): Promise<ContentPost> {
  const original = await getPostById(id);
  if (!original) throw new Error('Post não encontrado');

  const { id: _, created_at, updated_at, published_date, ...postData } = original;

  return createPost({
    ...postData,
    title: `${postData.title} (cópia)`,
    status: 'draft',
    scheduled_date: undefined
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getStatusColor(status: ContentStatus): string {
  const statusInfo = CONTENT_STATUSES.find(s => s.value === status);
  return statusInfo?.color || 'gray';
}

export function getPlatformIcon(platform: Platform): string {
  const platformInfo = PLATFORMS.find(p => p.value === platform);
  return platformInfo?.icon || '📱';
}

export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@[a-zA-Z0-9_.]+/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.substring(1)) : [];
}

export function getCharacterLimit(platform: Platform, postType: PostType): number {
  const limits: Record<string, number> = {
    'instagram_feed': 2200,
    'instagram_story': 0,
    'instagram_reel': 2200,
    'twitter_tweet': 280,
    'tiktok_video': 150,
    'youtube_video': 5000,
    'facebook_feed': 63206,
    'linkedin_feed': 3000,
    'threads_feed': 500
  };

  const key = `${platform}_${postType}`;
  return limits[key] || 2000;
}
