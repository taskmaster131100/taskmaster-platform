import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Music, Home, FolderOpen, Users, Calendar, BarChart3,
  Settings, LogOut, Menu, X, ChevronDown, ChevronRight,
  Sparkles, Library, TrendingUp, FileText, Eye, CheckSquare,
  MessageSquare, PieChart, Shield, User, Mic2, Radio, FolderArchive,
  HelpCircle, BookOpen, FileQuestion, MapPin, Share2, Disc3,
  DollarSign, UsersRound, Bell, Search, Bot, Brain, PhoneCall, LayoutDashboard
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [comunicacaoMenuOpen, setComunicacaoMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
      title: 'MENTOR IA',
      items: [
        { id: 'mentor-chat', label: 'Chat Marcos Menezes', icon: Bot, link: '/mentor-chat' },
        { id: 'mentor-diagnosis', label: 'Diagnóstico', icon: Brain, link: '/mentor-diagnosis' },
        { id: 'mentor-dashboard', label: 'Dashboard Mentor', icon: LayoutDashboard, link: '/mentor-dashboard' },
        { id: 'mentor-consulting', label: 'Consultoria Premium', icon: PhoneCall, link: '/mentor-consulting' },
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

  // Bottom navigation items for mobile
  const bottomNavItems = [
    { id: 'organization', label: 'Início', icon: Home },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'menu', label: 'Menu', icon: Menu, isMenu: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavClick = (item: any) => {
    if (item.isMenu) {
      setMobileMenuOpen(true);
      return;
    }
    if (item.link) {
      navigate(item.link);
    } else {
      onTabChange(item.id);
    }
    setMobileMenuOpen(false);
  };

  const renderMenuItems = (showLabels: boolean = true) => (
    <div className="px-2 space-y-4">
      {menuSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {showLabels && section.title && (
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </span>
            </div>
          )}

          {section.expandable && showLabels ? (
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#FFAD85]/10 text-[#FF9B6A]'
                            : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#FFAD85]/10 text-[#FF9B6A]'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                    title={!showLabels ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {showLabels && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Menu Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 safe-area-top flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-xl flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TaskMaster</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-button"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile Menu Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar pb-24">
          {renderMenuItems(true)}
        </nav>

        {/* Mobile Menu User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white safe-area-bottom">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-full flex items-center justify-center">
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
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors touch-button"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex-col flex-shrink-0`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-lg flex items-center justify-center">
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

        {/* Desktop Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {renderMenuItems(sidebarOpen)}
        </nav>

        {/* Desktop User Menu */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-full flex items-center justify-center">
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
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Header */}
        <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 safe-area-top flex-shrink-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2 touch-button"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            {/* Desktop sidebar toggle */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            {/* Logo for mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">TaskMaster</span>
            </div>
            
            <h1 className="hidden lg:block text-xl font-semibold text-gray-900">
              TaskMaster
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button - mobile */}
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-button">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Notifications */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative touch-button">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Desktop buttons */}
            <button
              onClick={onCreateProject}
              className="hidden md:flex px-3 lg:px-4 py-2 bg-gradient-to-r from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium items-center gap-1 touch-button"
            >
              <span className="hidden lg:inline">+ Criar Projeto</span>
              <span className="lg:hidden">+ Novo</span>
            </button>
            <button
              onClick={onViewArtists}
              className="hidden lg:flex px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium touch-button"
            >
              Artistas
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 safe-area-bottom z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around h-16">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = !item.isMenu && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all active:scale-95 touch-button ${
                    isActive
                      ? 'text-[#FF9B6A] bg-[#FFAD85]/10'
                      : 'text-gray-500 hover:text-gray-700 active:text-gray-900'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${isActive ? 'text-[#FF9B6A]' : ''}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}
