import { supabase } from '../lib/supabase';

export interface FileLibraryItem {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  linked_to_type?: string;
  linked_to_id?: string;
  tags?: string[];
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
}

export type FileCategory =
  | 'contratos'
  | 'letras'
  | 'cifras'
  | 'partituras'
  | 'press_kit'
  | 'fotos'
  | 'logos'
  | 'riders'
  | 'documentos'
  | 'outros';

export const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'contratos', label: 'Contratos' },
  { value: 'letras', label: 'Letras' },
  { value: 'cifras', label: 'Cifras' },
  { value: 'partituras', label: 'Partituras' },
  { value: 'press_kit', label: 'Press Kit' },
  { value: 'fotos', label: 'Fotos' },
  { value: 'logos', label: 'Logos' },
  { value: 'riders', label: 'Riders' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'outros', label: 'Outros' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function uploadFile(
  file: File,
  category: FileCategory,
  description?: string,
  tags?: string[]
): Promise<FileLibraryItem> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${user.id}/${category}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('file_library')
    .insert({
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      category,
      description,
      tags,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from('files').remove([filePath]);
    throw error;
  }

  return data;
}

export async function listFiles(filters?: {
  category?: FileCategory;
  linkedToType?: string;
  linkedToId?: string;
  tags?: string[];
  search?: string;
}): Promise<FileLibraryItem[]> {
  let query = supabase
    .from('file_library')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.linkedToType) {
    query = query.eq('linked_to_type', filters.linkedToType);
  }

  if (filters?.linkedToId) {
    query = query.eq('linked_to_id', filters.linkedToId);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters?.search) {
    query = query.ilike('file_name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getFileById(id: string): Promise<FileLibraryItem | null> {
  const { data, error } = await supabase
    .from('file_library')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateFile(
  id: string,
  updates: {
    description?: string;
    tags?: string[];
    category?: FileCategory;
  }
): Promise<FileLibraryItem> {
  const { data, error } = await supabase
    .from('file_library')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function linkFile(
  id: string,
  linkedToType: string,
  linkedToId: string
): Promise<FileLibraryItem> {
  const { data, error } = await supabase
    .from('file_library')
    .update({
      linked_to_type: linkedToType,
      linked_to_id: linkedToId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unlinkFile(id: string): Promise<FileLibraryItem> {
  const { data, error } = await supabase
    .from('file_library')
    .update({
      linked_to_type: null,
      linked_to_id: null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFile(id: string): Promise<void> {
  const file = await getFileById(id);
  if (!file) throw new Error('Arquivo não encontrado');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const urlParts = file.file_url.split('/files/');
  if (urlParts.length !== 2) throw new Error('URL de arquivo inválida');

  const filePath = urlParts[1];

  const { error: storageError } = await supabase.storage
    .from('files')
    .remove([filePath]);

  if (storageError) {
    console.error('Erro ao remover arquivo do storage:', storageError);
  }

  const { error } = await supabase
    .from('file_library')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'Image';
  if (fileType.startsWith('video/')) return 'Video';
  if (fileType.startsWith('audio/')) return 'Music';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('word') || fileType.includes('document')) return 'FileText';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'Table';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation';
  if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive';
  return 'File';
}
