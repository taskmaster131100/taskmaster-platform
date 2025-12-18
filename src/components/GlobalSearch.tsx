import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Calendar, CheckSquare, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'task' | 'artist' | 'event' | 'file';
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

  // Mock search function (replace with real search)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Simulate search delay
    const timer = setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'task',
          title: 'Finish album artwork',
          subtitle: 'Due tomorrow',
          url: '/tasks/1',
          icon: <CheckSquare className="w-5 h-5" />
        },
        {
          id: '2',
          type: 'artist',
          title: 'John Doe',
          subtitle: 'Pop Artist',
          url: '/artists/1',
          icon: <User className="w-5 h-5" />
        },
        {
          id: '3',
          type: 'event',
          title: 'Album Release Party',
          subtitle: 'Dec 25, 2025',
          url: '/calendar/event/1',
          icon: <Calendar className="w-5 h-5" />
        },
        {
          id: '4',
          type: 'file',
          title: 'Contract_2025.pdf',
          subtitle: 'Documents',
          url: '/files/1',
          icon: <FileText className="w-5 h-5" />
        }
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase())
      );

      setResults(mockResults);
      setSelectedIndex(0);
    }, 200);

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
              placeholder="Search tasks, artists, events, files..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 && query.trim() !== '' && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            )}

            {results.length === 0 && query.trim() === '' && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4">Start typing to search...</p>
                <div className="text-sm space-y-2">
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</kbd> to open search</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> to navigate</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> to select</p>
                  <p><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to close</p>
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
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
              <span><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">↑↓</kbd> Navigate</span>
              <span><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Enter</kbd> Select</span>
              <span><kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded">Esc</kbd> Close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default GlobalSearch;
