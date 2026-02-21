import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Calendar, CheckSquare, User, FileText, Music, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  type: 'task' | 'artist' | 'event' | 'file' | 'show' | 'project';
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Listen for Ctrl+K
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    window.addEventListener('open-search', handleOpenSearch);
    return () => window.removeEventListener('open-search', handleOpenSearch);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigate(results[selectedIndex].url);
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate]);

  // Busca real no Supabase
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const searchResults: SearchResult[] = [];
      const q = query.toLowerCase();

      try {
        // Buscar tarefas
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, status, due_date')
          .ilike('title', `%${q}%`)
          .limit(3);

        if (tasks) {
          tasks.forEach(task => {
            const statusMap: Record<string, string> = {
              'pending': 'Pendente',
              'in_progress': 'Em andamento',
              'completed': 'Concluída',
              'overdue': 'Atrasada'
            };
            searchResults.push({
              id: `task-${task.id}`,
              type: 'task',
              title: task.title,
              subtitle: statusMap[task.status] || task.status,
              url: '/tasks',
              icon: <CheckSquare className="w-5 h-5" />
            });
          });
        }

        // Buscar shows
        const { data: shows } = await supabase
          .from('shows')
          .select('id, event_name, venue, date')
          .or(`event_name.ilike.%${q}%,venue.ilike.%${q}%`)
          .limit(3);

        if (shows) {
          shows.forEach(show => {
            searchResults.push({
              id: `show-${show.id}`,
              type: 'show',
              title: show.event_name,
              subtitle: show.venue ? `${show.venue}` : undefined,
              url: '/shows',
              icon: <Music className="w-5 h-5" />
            });
          });
        }

        // Buscar projetos
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, status')
          .ilike('name', `%${q}%`)
          .limit(3);

        if (projects) {
          projects.forEach(project => {
            searchResults.push({
              id: `project-${project.id}`,
              type: 'project',
              title: project.name,
              subtitle: project.status === 'active' ? 'Ativo' : project.status,
              url: '/',
              icon: <FileText className="w-5 h-5" />
            });
          });
        }

        // Buscar artistas/membros da equipe
        const { data: members } = await supabase
          .from('team_members')
          .select('id, name, role')
          .ilike('name', `%${q}%`)
          .limit(3);

        if (members) {
          members.forEach(member => {
            searchResults.push({
              id: `member-${member.id}`,
              type: 'artist',
              title: member.name,
              subtitle: member.role || 'Membro da equipe',
              url: '/team',
              icon: <User className="w-5 h-5" />
            });
          });
        }

        // Buscar eventos do calendário
        const { data: events } = await supabase
          .from('calendar_events')
          .select('id, title, start_date')
          .ilike('title', `%${q}%`)
          .limit(3);

        if (events) {
          events.forEach(event => {
            const date = event.start_date ? new Date(event.start_date).toLocaleDateString('pt-BR') : '';
            searchResults.push({
              id: `event-${event.id}`,
              type: 'event',
              title: event.title,
              subtitle: date,
              url: '/calendar',
              icon: <Calendar className="w-5 h-5" />
            });
          });
        }

      } catch (error) {
        console.error('Erro na busca:', error);
      }

      setResults(searchResults);
      setSelectedIndex(0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarefas, shows, projetos, equipe..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            {loading && (
              <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 && query.trim() !== '' && !loading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Nenhum resultado encontrado para "{query}"
              </div>
            )}

            {results.length === 0 && query.trim() === '' && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">Digite para buscar...</p>
                <div className="text-sm space-y-2">
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</kbd> para abrir busca</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> para navegar</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> para selecionar</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> para fechar</p>
                </div>
              </div>
            )}

            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => {
                  navigate(result.url);
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  index === selectedIndex ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                }`}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300">
                  {result.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">↑↓</kbd> Navegar</span>
              <span><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Enter</kbd> Selecionar</span>
              <span><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Esc</kbd> Fechar</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default GlobalSearch;
