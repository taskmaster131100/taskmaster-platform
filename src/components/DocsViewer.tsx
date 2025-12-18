import React, { useState, useEffect } from 'react';
import { Download, BookOpen, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DocsViewerProps {
  docPath: string;
  title: string;
}

export default function DocsViewer({ docPath, title }: DocsViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMarkdown();
  }, [docPath]);

  const loadMarkdown = async () => {
    try {
      setLoading(true);
      const response = await fetch(docPath);
      const text = await response.text();
      setContent(text);
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
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline">$1</a>');

    html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 my-2">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc">$1</ul>');

    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700">$1</blockquote>');

    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');

    html = html.replace(/^```(.*?)```$/gms, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>');

    html = html.replace(/^---$/gim, '<hr class="my-8 border-gray-300" />');

    html = html.replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed my-4">');
    html = '<p class="text-gray-700 leading-relaxed my-4">' + html + '</p>';

    return html;
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            <BookOpen className="w-8 h-8 text-blue-600" />
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
