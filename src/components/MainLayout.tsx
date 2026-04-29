import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Music, Home, Users, Calendar, BarChart3,
  LogOut, Menu, X,
  Sparkles, TrendingUp, CheckSquare,
  Shield, User, Mic2,
  BookOpen, MapPin, Disc3,
  DollarSign, UsersRound, Bell, Search, Bot, Brain, PhoneCall, Megaphone, FileText,
  AlertTriangle, Clock
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';

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
  // Sidebar sempre aberta no desktop — não colapsa
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; type: 'task' | 'show' | 'release'; title: string; detail: string; link: string }[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function loadNotifications() {
    if (notifLoaded) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      const [overdueTasks, upcomingShows, upcomingReleases] = await Promise.all([
        supabase.from('tasks').select('id, title, due_date').neq('status', 'done').lte('due_date', today).order('due_date').limit(5),
        supabase.from('shows').select('id, title, show_date').gte('show_date', today).lte('show_date', in3days).order('show_date').limit(3),
        supabase.from('releases').select('id, title, release_date').gte('release_date', today).lte('release_date', in3days).order('release_date').limit(3),
      ]);
      const items: typeof notifications = [];
      (overdueTasks.data || []).forEach(t => items.push({ id: t.id, type: 'task', title: t.title, detail: `Venceu em ${t.due_date}`, link: '/tasks' }));
      (upcomingShows.data || []).forEach(s => items.push({ id: s.id, type: 'show', title: s.title, detail: `Show em ${s.show_date}`, link: '/shows' }));
      (upcomingReleases.data || []).forEach(r => items.push({ id: r.id, type: 'release', title: r.title, detail: `Lança em ${r.release_date}`, link: '/releases' }));
      setNotifications(items);
      setNotifLoaded(true);
    } catch {}
  }

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
        { id: 'artists', label: 'Artistas', icon: Music, link: '/artists' },
        { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
        { id: 'calendar', label: 'Agenda', icon: Calendar },
      ]
    },
    {
      title: 'COPILOTO IA',
      items: [
        { id: 'planejamento', label: 'Planejamento IA', icon: Sparkles, link: '/planejamento' },
      ]
    },
    {
      title: 'LANÇAMENTOS',
      items: [
        { id: 'releases', label: 'Lançamentos', icon: Disc3, link: '/releases' },
        { id: 'music', label: 'Produção Musical', icon: Music, link: '/music' },
      ]
    },
    {
      title: 'SHOWS',
      items: [
        { id: 'shows', label: 'Shows', icon: Mic2, link: '/shows' },
      ]
    },
    {
      title: 'GESTÃO',
      items: [
        { id: 'team', label: 'Equipe', icon: UsersRound, link: '/team' },
        { id: 'finance', label: 'Financeiro', icon: DollarSign, link: '/finance' },
        { id: 'kpis', label: 'KPIs', icon: TrendingUp, link: '/kpis' },
        { id: 'epk', label: 'EPK', icon: FileText, link: '/epk' },
      ]
    },
    {
      title: 'AJUDA',
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
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">

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
                {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
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

      {/* Desktop Sidebar — sempre visível */}
      <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0">

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">TaskMaster</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {renderMenuItems(true)}
        </nav>

        {/* Desktop User Menu */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFAD85] via-[#FF9B6A] to-[#FFD4B8] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
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
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); loadNotifications(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative touch-button"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-900">Notificações</span>
                    <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Nenhuma notificação pendente</p>
                    ) : (
                      notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => { navigate(n.link); setNotifOpen(false); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          {n.type === 'task' ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> : <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-tight">{n.title}</p>
                            <p className="text-xs text-gray-500">{n.detail}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
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
