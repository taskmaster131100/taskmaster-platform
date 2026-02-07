import React, { useState, useEffect } from 'react';
import { Upload, Search, Filter, X, Edit3, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { FileUploadZone } from './FileUploadZone';
import { FileCard } from './FileCard';
import {
  FileLibraryItem,
  FileCategory,
  FILE_CATEGORIES,
  uploadFile,
  listFiles,
  deleteFile,
  updateFile,
  linkFile,
  unlinkFile
} from '../services/fileLibraryService';

export default function FileLibrary() {
  const [files, setFiles] = useState<FileLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileLibraryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const [uploadCategory, setUploadCategory] = useState<FileCategory>('outros');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editCategory, setEditCategory] = useState<FileCategory>('outros');

  useEffect(() => {
    loadFiles();
  }, [selectedCategory, searchTerm]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await listFiles({
        category: selectedCategory || undefined,
        search: searchTerm || undefined
      });
      setFiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      // Silently handle error to avoid persistent error toast on every screen
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFiles) {
      try {
        await uploadFile(
          file,
          uploadCategory,
          uploadDescription || undefined,
          uploadTags ? uploadTags.split(',').map(t => t.trim()).filter(Boolean) : undefined
        );
        successCount++;
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) enviado(s) com sucesso`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} arquivo(s) com erro`);
    }

    setUploading(false);
    setShowUploadModal(false);
    setSelectedFiles([]);
    setUploadDescription('');
    setUploadTags('');
    setUploadCategory('outros');
    loadFiles();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(id);
      toast.success('Arquivo excluído com sucesso');
      loadFiles();
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const handleEdit = (file: FileLibraryItem) => {
    setSelectedFile(file);
    setEditDescription(file.description || '');
    setEditTags(file.tags?.join(', ') || '');
    setEditCategory(file.category as FileCategory);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedFile) return;

    try {
      await updateFile(selectedFile.id, {
        description: editDescription || undefined,
        tags: editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        category: editCategory
      });
      toast.success('Arquivo atualizado com sucesso');
      setShowEditModal(false);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      console.error('Erro ao atualizar arquivo:', error);
      toast.error('Erro ao atualizar arquivo');
    }
  };

  const handleLink = (file: FileLibraryItem) => {
    setSelectedFile(file);
    setShowLinkModal(true);
  };

  const handleView = (file: FileLibraryItem) => {
    window.open(file.file_url, '_blank');
  };

  const filteredFiles = files;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Arquivos</h1>
            <p className="text-gray-600 mt-1">
              {files.length} arquivo(s) • Organize e gerencie seus documentos
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] flex items-center gap-2 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-[#FF9B6A]' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Categoria:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as FileCategory | '')}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              >
                <option value="">Todas</option>
                {FILE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="text-sm text-[#FFAD85] hover:text-[#FF9B6A]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAD85] mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando arquivos...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum arquivo encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Comece fazendo upload dos seus arquivos
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
            >
              Fazer Upload
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFiles.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onLink={handleLink}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Upload de Arquivos</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <FileUploadZone
                onFilesSelected={setSelectedFiles}
                maxFiles={10}
                maxSizePerFile={50 * 1024 * 1024}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as FileCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  {FILE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Adicione uma descrição..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="Ex: urgente, 2024, contrato"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploading}
                  className="flex-1 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Enviando...' : `Enviar (${selectedFiles.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Editar Arquivo</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do arquivo
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {selectedFile.file_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as FileCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  {FILE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Vincular Arquivo</h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Funcionalidade de vínculo será implementada nos próximos módulos (Shows, Releases, etc.)
              </p>
              <button
                onClick={() => setShowLinkModal(false)}
                className="w-full px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
