import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Search, Filter, X, Copy, Trash2 } from 'lucide-react';
import {
  ContentPost,
  ContentStatus,
  Platform,
  PostType,
  PLATFORMS,
  POST_TYPES,
  CONTENT_STATUSES,
  createPost,
  updatePost,
  deletePost,
  listPosts,
  duplicatePost,
  getUpcomingPosts,
  formatDate,
  getStatusColor,
  getPlatformIcon,
  extractHashtags,
  extractMentions,
  getCharacterLimit
} from '../services/contentService';

export default function ContentManager() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<Platform | ''>('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'instagram' as Platform,
    post_type: 'feed' as PostType,
    status: 'draft' as ContentStatus,
    scheduled_date: '',
    engagement_goal: '',
    notes: ''
  });

  useEffect(() => {
    loadPosts();
  }, [statusFilter, platformFilter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (platformFilter) filters.platform = platformFilter;

      const data = await listPosts(filters);
      setPosts(data);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hashtags = extractHashtags(formData.content);
      const mentions = extractMentions(formData.content);

      const postData = {
        ...formData,
        hashtags,
        mentions,
        media_urls: []
      };

      if (selectedPost) {
        await updatePost(selectedPost.id, postData);
      } else {
        await createPost(postData);
      }

      setShowModal(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Erro ao salvar post:', error);
    }
  };

  const handleEdit = (post: ContentPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      platform: post.platform,
      post_type: post.post_type,
      status: post.status,
      scheduled_date: post.scheduled_date || '',
      engagement_goal: post.engagement_goal || '',
      notes: post.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este post?')) {
      try {
        await deletePost(id);
        loadPosts();
      } catch (error) {
        console.error('Erro ao excluir post:', error);
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePost(id);
      loadPosts();
    } catch (error) {
      console.error('Erro ao duplicar post:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      platform: 'instagram',
      post_type: 'feed',
      status: 'draft',
      scheduled_date: '',
      engagement_goal: '',
      notes: ''
    });
    setSelectedPost(null);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: ContentStatus) => {
    const statusInfo = CONTENT_STATUSES.find(s => s.value === status);
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo?.color as keyof typeof colorClasses]}`}>
        {statusInfo?.label}
      </span>
    );
  };

  const charLimit = getCharacterLimit(formData.platform, formData.post_type);
  const charCount = formData.content.length;
  const charRemaining = charLimit - charCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo & Postagens</h1>
          <p className="text-gray-600 mt-1">Gerencie seu calendário de conteúdo</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Post
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todos os Status</option>
          {CONTENT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as Platform | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todas Plataformas</option>
          {PLATFORMS.map(platform => (
            <option key={platform.value} value={platform.value}>
              {platform.icon} {platform.label}
            </option>
          ))}
        </select>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum post encontrado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro post para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                    <h3 className="text-lg font-bold text-gray-900">{post.title}</h3>
                  </div>
                  {getStatusBadge(post.status)}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.content}</p>

              {post.scheduled_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.scheduled_date)}</span>
                </div>
              )}

              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.hashtags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                  {post.hashtags.length > 3 && (
                    <span className="text-xs text-gray-500">+{post.hashtags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(post)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDuplicate(post.id)}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedPost ? 'Editar Post' : 'Novo Post'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Post sobre novo single"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataforma *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PLATFORMS.map(platform => (
                      <option key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.post_type}
                    onChange={(e) => setFormData({ ...formData, post_type: e.target.value as PostType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {POST_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CONTENT_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo * ({charRemaining >= 0 ? charRemaining : 0} caracteres restantes)
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  maxLength={charLimit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o conteúdo do post... Use # para hashtags e @ para mentions"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hashtags e mentions serão extraídas automaticamente
                </p>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data e Hora Agendada *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objetivo de Engajamento
                </label>
                <input
                  type="text"
                  value={formData.engagement_goal}
                  onChange={(e) => setFormData({ ...formData, engagement_goal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1000 curtidas, 100 comentários"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações internas..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedPost ? 'Atualizar' : 'Criar'} Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
