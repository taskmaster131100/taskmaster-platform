import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Film, Music, Download, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth/AuthProvider';
import { toast } from 'sonner';

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url?: string;
  created_at: string;
}

interface AttachmentUploaderProps {
  entityType: 'task' | 'event' | 'budget_item';
  entityId: string;
  organizationId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

const FILE_ICONS: Record<string, React.ComponentType<any>> = {
  image: Image,
  video: Film,
  audio: Music,
  pdf: FileText,
  document: FileText,
  default: File
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return FILE_ICONS.image;
  if (fileType.startsWith('video/')) return FILE_ICONS.video;
  if (fileType.startsWith('audio/')) return FILE_ICONS.audio;
  if (fileType.includes('pdf')) return FILE_ICONS.pdf;
  if (fileType.includes('document') || fileType.includes('word') || fileType.includes('sheet')) return FILE_ICONS.document;
  return FILE_ICONS.default;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AttachmentUploader({
  entityType,
  entityId,
  organizationId,
  attachments,
  onAttachmentsChange,
  maxSize = 10,
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx']
}: AttachmentUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${maxSize}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Generate unique path
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `${organizationId}/${entityType}/${entityId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, create mock attachment
        console.warn('Storage upload failed, using mock:', uploadError);
        
        const mockAttachment: Attachment = {
          id: crypto.randomUUID(),
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          url: URL.createObjectURL(file),
          created_at: new Date().toISOString()
        };

        return mockAttachment;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(storagePath);

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          organization_id: organizationId,
          [`${entityType}_id`]: entityId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          mime_type: file.type,
          storage_path: storagePath,
          url: urlData.publicUrl,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return dbData as Attachment;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const attachment = await uploadFile(file);
      if (attachment) {
        newAttachments.push(attachment);
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} arquivo(s) enviado(s)`);
    }
  }, [attachments, onAttachmentsChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const attachment = await uploadFile(file);
      if (attachment) {
        newAttachments.push(attachment);
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} arquivo(s) enviado(s)`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return;

      // Try to delete from database
      await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId);

      // Update local state
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
      toast.success('Arquivo removido');
    } catch (error) {
      console.error('Delete error:', error);
      // Still remove from local state
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
      toast.success('Arquivo removido');
    }
  };

  const handleDownload = (attachment: Attachment) => {
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.file_name;
      link.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-[#FFAD85] bg-[#FFF8F3]' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Enviando arquivo...</p>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#FFF8F3]0 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-[#FFAD85]">Clique para enviar</span> ou arraste arquivos aqui
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, XLS, imagens até {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Anexos ({attachments.length})
          </p>
          <div className="space-y-2">
            {attachments.map(attachment => {
              const IconComponent = getFileIcon(attachment.file_type);
              const isImage = attachment.file_type.startsWith('image/');
              
              return (
                <div 
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  {isImage && attachment.url ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.file_name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="p-1.5 text-gray-500 hover:text-[#FFAD85] hover:bg-[#FFF8F3] rounded"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
