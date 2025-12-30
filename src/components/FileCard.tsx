import React, { useState } from 'react';
import { Download, Trash2, Edit3, Link as LinkIcon, ExternalLink, Image, Video, Music, FileText, Table, Presentation, Archive, File, MoreVertical } from 'lucide-react';
import { FileLibraryItem, formatFileSize } from '../services/fileLibraryService';

interface FileCardProps {
  file: FileLibraryItem;
  onDelete: (id: string) => void;
  onEdit: (file: FileLibraryItem) => void;
  onLink: (file: FileLibraryItem) => void;
  onView: (file: FileLibraryItem) => void;
}

export function FileCard({ file, onDelete, onEdit, onLink, onView }: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getFileIcon = () => {
    const iconClass = "w-12 h-12";

    if (file.file_type.startsWith('image/')) return <Image className={iconClass} />;
    if (file.file_type.startsWith('video/')) return <Video className={iconClass} />;
    if (file.file_type.startsWith('audio/')) return <Music className={iconClass} />;
    if (file.file_type.includes('pdf')) return <FileText className={iconClass} />;
    if (file.file_type.includes('word') || file.file_type.includes('document')) return <FileText className={iconClass} />;
    if (file.file_type.includes('sheet') || file.file_type.includes('excel')) return <Table className={iconClass} />;
    if (file.file_type.includes('presentation') || file.file_type.includes('powerpoint')) return <Presentation className={iconClass} />;
    if (file.file_type.includes('zip') || file.file_type.includes('rar')) return <Archive className={iconClass} />;
    return <File className={iconClass} />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      contratos: 'bg-purple-100 text-purple-700',
      letras: 'bg-pink-100 text-pink-700',
      cifras: 'bg-green-100 text-green-700',
      partituras: 'bg-blue-100 text-[#FF9B6A]',
      press_kit: 'bg-orange-100 text-orange-700',
      fotos: 'bg-red-100 text-red-700',
      logos: 'bg-[#FFF0E6] text-[#FF9B6A]',
      riders: 'bg-yellow-100 text-yellow-700',
      documentos: 'bg-gray-100 text-gray-700',
      outros: 'bg-slate-100 text-slate-700'
    };
    return colors[category] || colors.outros;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const isImage = file.file_type.startsWith('image/');

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative group">
        {isImage ? (
          <img
            src={file.file_url}
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400">
            {getFileIcon()}
          </div>
        )}

        <button
          onClick={() => onView(file)}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-8 h-8 text-white" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 pr-2">
            {file.file_name}
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onView(file);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver arquivo
                  </button>
                  <button
                    onClick={() => {
                      window.open(file.file_url, '_blank');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      onEdit(file);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onLink(file);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Vincular
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este arquivo?')) {
                        onDelete(file.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {file.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {file.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(file.category)}`}>
            {file.category}
          </span>
          <span className="text-xs text-gray-500">
            {formatFileSize(file.file_size)}
          </span>
        </div>

        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {file.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {file.linked_to_type && (
          <div className="flex items-center gap-1 text-xs text-[#FFAD85] mb-2">
            <LinkIcon className="w-3 h-3" />
            <span>Vinculado a {file.linked_to_type}</span>
          </div>
        )}

        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          {formatDate(file.uploaded_at)}
        </div>
      </div>
    </div>
  );
}
