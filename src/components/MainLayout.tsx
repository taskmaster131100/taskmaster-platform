import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Music, Home, FolderOpen, Users, Calendar, BarChart3,
  Settings, LogOut, Menu, X, ChevronDown, ChevronRight,
  Sparkles, Library, TrendingUp, FileText, Eye, CheckSquare,
  MessageSquare, PieChart, Shield, User, Mic2, Radio, FolderArchive,
  HelpCircle, BookOpen, FileQuestion, MapPin, Share2, Disc3,
  DollarSign, UsersRound
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

interface MainLayoutProps {
  children: React.ReactNode;
  projects: any[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onViewArtists: () => void;
}

export default function MainLayout({
  children,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  activeTab,
  onTabChange,
  onViewArtists
}: MainLayoutProps) {
  // Load sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [comunicacaoMenuOpen, setComunicacaoMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  // Persist sidebar state to localStorage
  React.useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const menuSections = [
    {
      title: 'PRINCIPAL',
      items: [
        { id: 'organization', label: 'Início', icon: Home },
        { id: 'organization', label: 'Organização', icon: TrendingUp },
        { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
        { id: 'calendar', label: 'Agenda', icon: Calendar },
        { id: 'reports', label: 'Relatórios', icon: BarChart3 },
      ]
    },
    {
      title: 'PLANEJAMENTO',
      items: [
        { id: 'planejamento', label: 'Planejamento', icon: Sparkles, link: '/planejamento' },
        { id: 'biblioteca', label: 'Biblioteca', icon: FolderArchive, link: '/biblioteca' },
      ]
    },
    {
      title: 'CONTEÚDO',
      expandable: true,
      isOpen: contentMenuOpen,
      toggle: () => setContentMenuOpen(!contentMenuOpen),
      items: [
        { id: 'music', label: 'Produção Musical', icon: Music, link: '/music' },
        { id: 'marketing', label: 'Marketing', icon: Radio },
        { id: 'production', label: 'Produção', icon: FileText },
      ]
    },
    {
      title: 'LANÇAMENTOS',
      items: [
        { id: 'releases', label: 'Lançamentos', icon: Disc3, link: '/releases' },
      ]
    },
    {
      title: 'SHOWS',
      items: [
        { id: 'shows', label: 'Shows', icon: Mic2, link: '/shows' },
        { id: 'tours', label: 'Turnês', icon: MapPin, link: '/tours' },
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { id: 'content', label: 'Conteúdo', icon: Share2, link: '/content' },
      ]
    },
    {
      title: 'COMUNICAÇÃO',
      expandable: true,
      isOpen: comunicacaoMenuOpen,
      toggle: () => setComunicacaoMenuOpen(!comunicacaoMenuOpen),
      items: [
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'google', label: 'Google', icon: Calendar },
        { id: 'meetings', label: 'Reuniões', icon: Users },
      ]
    },
    {
      title: 'ANÁLISE',
      items: [
        { id: 'ai', label: 'Análise', icon: PieChart },
        { id: 'ia-texto', label: 'IA de Texto', icon: Sparkles, link: '/ia-texto' },
        { id: 'kpis', label: 'KPIs', icon: TrendingUp },
      ]
    },
    {
      title: 'GESTÃO',
      items: [
        { id: 'team', label: 'Equipe', icon: UsersRound, link: '/team' },
        { id: 'finance', label: 'Financeiro', icon: DollarSign, link: '/finance' },
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { id: 'users', label: 'Admin', icon: Shield },
      ]
    },
    {
      title: 'AJUDA',
      expandable: true,
      isOpen: helpMenuOpen,
      toggle: () => setHelpMenuOpen(!helpMenuOpen),
      items: [
        { id: 'manual-usuario', label: 'Manual do Usuário', icon: BookOpen, link: '/docs/manual-usuario' },
        { id: 'manual-escritorio', label: 'Manual Escritório', icon: Users, link: '/docs/manual-escritorio' },
        { id: 'apresentacao', label: 'Apresentação', icon: Eye, link: '/docs/apresentacao' },
        { id: 'fluxos', label: 'Guia de Fluxos', icon: TrendingUp, link: '/docs/fluxos' },
        { id: 'faq', label: 'FAQ', icon: FileQuestion, link: '/docs/faq' },
        { id: 'changelog', label: 'Changelog', icon: FileText, link: '/docs/changelog' },
      ]
    },
    {
      title: 'PERFIL',
      items: [
        { id: 'profile', label: 'Perfil', icon: User },
      ]
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavClick = (item: any) => {
    if (item.link) {
      navigate(item.link);
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">TaskMaster</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors mx-auto"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-4">

            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {sidebarOpen && section.title && (
                  <div className="px-3 mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </span>
                  </div>
                )}

                {section.expandable && sidebarOpen ? (
                  <div>
                    <button
                      onClick={section.toggle}
                      className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium">{section.title}</span>
                      {section.isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {section.isOpen && (
                      <div className="ml-2 mt-1 space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id || (item.link && window.location.pathname === item.link);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNavClick(item)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id || (item.link && window.location.pathname === item.link);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          title={!sidebarOpen ? item.label : undefined}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

          </div>
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-200 p-4">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex justify-center"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              TaskMaster
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateProject}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 via-orange-500 to-yellow-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              + Criar Projeto
            </button>
            <button
              onClick={onViewArtists}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Artistas
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
