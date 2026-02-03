import React, { useState, useEffect } from 'react';
import { Download, BookOpen, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DocsViewerProps {
  docPath: string;
  title: string;
}

function resolveLang() {
  const stored = localStorage.getItem('taskmaster_language');
  const lang = stored || (navigator.language || 'en');

  if (lang.toLowerCase().startsWith('pt')) return 'pt-BR';
  if (lang.toLowerCase().startsWith('es')) return 'es';
  return 'en';
}

export default function DocsViewer({ docPath, title }: DocsViewerProps) {
  const [content, setContent] = useState<string>('');
  const [resolvedPath, setResolvedPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMarkdown();
  }, [docPath]);

  const loadMarkdown = async () => {
    try {
      setLoading(true);
      const lang = resolveLang();
      const resolved = docPath.includes('{lang}') ? docPath.replace('{lang}', lang) : docPath;
      setResolvedPath(resolved);

      const response = await fetch(resolved);
      const text = await response.text();

      // Guard: if Vercel rewrite returns index.html, we don't want to render a blank "manual".
      const looksLikeHtml = /<!doctype html>|<html\b/i.test(text);
      if (looksLikeHtml) {
        setContent('# Documento indisponível\n\nO arquivo do manual não foi encontrado. Tente novamente em alguns minutos.');
      } else {
        setContent(text);
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      setContent('# Erro ao carregar documento\n\nNão foi possível carregar o conteúdo. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const parseMarkdown = (md: string): string => {
    let html = md;

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mb-6">$1</h1>');

    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="max-w-full h-auto my-4 rounded-lg" />');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#FFAD85] hover:text-[#FF9B6A] underline">$1</a>');

    html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 my-2">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc">$1</ul>');

    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-[#FFAD85] pl-4 py-2 my-4 bg-blue-50 text-gray-700">$1</blockquote>');

    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');

    html = html.replace(/^```(.*?)```$/gms, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>');

    html = html.replace(/^---$/gim, '<hr class="my-8 border-gray-300" />');

    // Paragraphs (avoid wrapping block elements like headings inside <p> which can break printing)
    html = html.replace(/\n\n+/g, '<div class="h-4"></div>');

    return html;
  };

  const handleExportPDF = () => {
    // Uses browser print dialog (user can "Save as PDF")
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!resolvedPath) return;
    window.open(resolvedPath, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAD85] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Abrir arquivo
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
            >
              <Download className="w-5 h-5" />
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <BookOpen className="w-8 h-8 text-[#FFAD85]" />
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
