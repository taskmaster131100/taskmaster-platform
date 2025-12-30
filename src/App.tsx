import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useAuth } from './components/auth/AuthProvider';
import SupabaseConnection from './components/SupabaseConnection';

// Lazy load all components for better performance
const MainLayout = React.lazy(() => import('./components/MainLayout'));
const OrganizationDashboard = React.lazy(() => import('./components/OrganizationDashboard'));
const ArtistManager = React.lazy(() => import('./components/ArtistManager'));
const ArtistDetails = React.lazy(() => import('./components/ArtistDetails'));
const ProjectDashboard = React.lazy(() => import('./components/ProjectDashboard'));
const TaskBoard = React.lazy(() => import('./components/TaskBoard'));
const Calendar = React.lazy(() => import('./components/CalendarView'));
const Schedule = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.Schedule })));
const WhatsAppManager = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.WhatsAppManager })));
const GoogleIntegration = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.GoogleIntegration })));
const MeetingsManager = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.MeetingsManager })));
const MarketingManager = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.MarketingManager })));
const ProductionManager = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.ProductionManager })));
const PreProductionManager = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.PreProductionManager })));
const UserProfile = React.lazy(() => import('./components/UserProfilePage'));
const UserPreferences = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.UserPreferences })));
const UserRoleFeatures = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.UserRoleFeatures })));
const AIInsights = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.AIInsights })));
const KPIManager = React.lazy(() => import('./components/KPIManager'));
const MindMap = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.MindMap })));
const UserManagement = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.UserManagement })));
const ReportsPage = React.lazy(() => import('./components/ReportsPage'));
const Presentation = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.Presentation })));
const About = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.About })));
const CommandCenter = React.lazy(() => import('./pages/CommandCenter'));
const Templates = React.lazy(() => import('./pages/Templates'));
const PlanejamentoPage = React.lazy(() => import('./pages/Planejamento'));
const PlanningDashboard = React.lazy(() => import('./components/PlanningDashboard'));
const ApprovalsPage = React.lazy(() => import('./pages/ApprovalsPage'));
const FunctionalityValidator = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.FunctionalityValidator })));
const SystemValidator = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.SystemValidator })));
const BetaBanner = React.lazy(() => import('./components/BetaBanner'));
const DemoBanner = React.lazy(() => import('./components/DemoBanner'));
const WelcomeModal = React.lazy(() => import('./components/WelcomeModal'));
const Onboarding = React.lazy(() => import('./components/Onboarding'));
const LoginForm = React.lazy(() => import('./components/auth/LoginForm'));
const RegisterForm = React.lazy(() => import('./components/auth/RegisterForm'));
const ResetPassword = React.lazy(() => import('./components/auth/ResetPassword'));
const DashboardRedirect = React.lazy(() => import('./pages/RedirectPages').then(module => ({ default: module.DashboardRedirect })));
const VisaoGeralRedirect = React.lazy(() => import('./pages/RedirectPages').then(module => ({ default: module.VisaoGeralRedirect })));
const BetaDashboard = React.lazy(() => import('./components/beta/BetaDashboard'));
const BetaFeedbackWidget = React.lazy(() => import('./components/beta/BetaFeedbackWidget'));
const MusicHub = React.lazy(() => import('./components/music/MusicHub'));
const FileLibrary = React.lazy(() => import('./components/FileLibrary'));
const AITextGenerator = React.lazy(() => import('./components/AITextGenerator'));
const ShowsManager = React.lazy(() => import('./pages/ShowsManager'));

const ManualUsuario = React.lazy(() => import('./pages/DocsPages').then(module => ({ default: module.ManualUsuario })));
const ManualEscritorio = React.lazy(() => import('./pages/DocsPages').then(module => ({ default: module.ManualEscritorio })));
const Apresentacao = React.lazy(() => import('./pages/DocsPages').then(module => ({ default: module.Apresentacao })));
const Fluxos = React.lazy(() => import('./pages/DocsPages').then(module => ({ default: module.Fluxos })));
const FAQ = React.lazy(() => import('./pages/DocsPages').then(module => ({ default: module.FAQ })));
const Changelog = React.lazy(() => import('./pages/DocsPages').then(module => ({ default: module.Changelog })));

const ToursManager = React.lazy(() => import('./pages/ToursManager'));
const ContentManager = React.lazy(() => import('./pages/ContentManager'));
const ReleasesManager = React.lazy(() => import('./pages/ReleasesManager'));
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const FinancePage = React.lazy(() => import('./pages/FinancePage'));

// Classic Routes Preview (feature flag controlled)
const WelcomePreview = React.lazy(() => import('./pages/WelcomePreview'));
const LobbyPreview = React.lazy(() => import('./pages/LobbyPreview'));
const MailPreview = React.lazy(() => import('./pages/MailPreview'));

import { localDatabase } from './services/localDatabase';
import type { Project, Task, Artist, Department, TeamMember } from './types';

// Feature flag for classic routes
const ENABLE_CLASSIC_ROUTES = import.meta.env.VITE_ENABLE_CLASSIC_ROUTES === 'true';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dbMode, setDbMode] = useState<'checking' | 'ready' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('organization');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showArtistDetails, setShowArtistDetails] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateArtist, setShowCreateArtist] = useState(false);

  // Importar componentes necessários
  const ProjectForm = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.ProjectForm })));
  const ArtistForm = React.lazy(() => import('./components/SimpleComponents').then(m => ({ default: m.ArtistForm })));

  // Setup cleanup on component mount
  useEffect(() => {
    const handleBeforeUnload = () => {
      localDatabase.cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Check database mode on app start
    if (typeof window !== 'undefined' && window.localStorage) {
      const useLocalDatabase = localStorage.getItem('useLocalDatabase');
      if (useLocalDatabase === 'true') {
        setDbMode('ready');
      } else {
        // Default to Supabase (ready) since we have it configured
        setDbMode('ready');
      }
    }
  }, []);

  useEffect(() => {
    if (user && dbMode === 'ready') {
      loadData();

      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      } else {
        // Check if user should see welcome modal (for returning users)
        const lastLogin = localStorage.getItem('lastLogin');
        const today = new Date().toDateString();
        if (lastLogin !== today) {
          setShowWelcome(true);
          localStorage.setItem('lastLogin', today);
        }
      }
    }
  }, [user, dbMode]);

  // Update activeTab based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/organization') {
      setActiveTab('organization');
    } else if (path === '/tasks') {
      setActiveTab('tasks');
    } else if (path === '/calendar') {
      setActiveTab('calendar');
    } else if (path === '/reports') {
      setActiveTab('reports');
    } else if (path === '/artists') {
      setActiveTab('artists');
    } else if (path === '/shows') {
      setActiveTab('shows');
    } else if (path === '/whatsapp') {
      setActiveTab('whatsapp');
    } else if (path === '/google') {
      setActiveTab('google');
    } else if (path === '/meetings') {
      setActiveTab('meetings');
    } else if (path === '/marketing') {
      setActiveTab('marketing');
    } else if (path === '/production') {
      setActiveTab('production');
    } else if (path === '/ai') {
      setActiveTab('ai');
    } else if (path === '/kpis') {
      setActiveTab('kpis');
    } else if (path === '/users') {
      setActiveTab('users');
    } else if (path === '/profile') {
      setActiveTab('profile');
    }
  }, [location]);

  const loadData = () => {
    // Don't initialize example data for real users
    // Each user starts with clean slate

    // Load all data
    const projectsData = localDatabase.getCollection<Project>('projects');
    const tasksData = localDatabase.getCollection<Task>('tasks');
    const artistsData = localDatabase.getCollection<Artist>('artists');
    const departmentsData = localDatabase.getCollection<Department>('departments');
    const teamMembersData = localDatabase.getCollection<TeamMember>('teamMembers');

    setProjects(Array.isArray(projectsData) ? projectsData : []);
    setTasks(Array.isArray(tasksData) ? tasksData : []);
    setArtists(Array.isArray(artistsData) ? artistsData : []);
    setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    setTeamMembers(Array.isArray(teamMembersData) ? teamMembersData : []);

    // Select first project if none selected
    if (!selectedProjectId && Array.isArray(projectsData) && projectsData.length > 0) {
      setSelectedProjectId(projectsData[0].id);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('dashboard');
  };

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectSubmit = (projectData: any) => {
    try {
      // Garantir que todos os campos obrigatórios estão presentes
      const safeProjectData = {
        name: projectData.name || 'Novo Projeto',
        description: projectData.description || 'Descrição do projeto',
        project_type: projectData.project_type || 'artist_management',
        status: projectData.status || 'active',
        startDate: projectData.startDate || new Date().toISOString(),
        budget: Number(projectData.budget) || 0,
        totalCost: 0,
        ownerId: 'user_1',
        members: [],
        phases: projectData.phases || [],
        whatsappGroup: projectData.whatsappGroup || '',
        artistId: projectData.artistId,
        tasks: []
      };

      const newProject = localDatabase.createProject(safeProjectData);
      if (newProject) {
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        setActiveTab('dashboard');
        // Recarregar dados após criar projeto
        loadData();
      }
      setShowCreateProject(false);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto. Tente novamente.');
    }
  };

  const handleArtistSubmit = (artistData: any) => {
    try {
      // Garantir que todos os campos obrigatórios estão presentes
      const safeArtistData = {
        name: artistData.name || 'Novo Artista',
        artisticName: artistData.artisticName,
        genre: artistData.genre || 'Não definido',
        status: artistData.status || 'active',
        contactEmail: artistData.contactEmail,
        contactPhone: artistData.contactPhone,
        bio: artistData.bio,
        imageUrl: artistData.imageUrl,
        exclusivity: Boolean(artistData.exclusivity),
        contractStartDate: artistData.contractStartDate,
        contractEndDate: artistData.contractEndDate,
        commissionRate: artistData.commissionRate,
        managerId: artistData.managerId,
        socialMedia: artistData.socialMedia || {},
        financialSummary: {
          totalRevenue: 0,
          totalExpenses: 0,
          balance: 0,
          pendingPayments: 0
        },
        upcomingEvents: {
          shows: 0,
          releases: 0,
          meetings: 0
        }
      };

      const newArtist = localDatabase.createArtist(safeArtistData);
      if (newArtist) {
        setArtists(prev => [...prev, newArtist as Artist]);
        // Recarregar dados após criar artista
        loadData();
      }
      setShowCreateArtist(false);
    } catch (error) {
      console.error('Erro ao criar artista:', error);
      toast.error('Erro ao criar artista. Tente novamente.');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Navigate to specific routes
    if (tab === 'organization') {
      navigate('/');
    } else if (tab === 'tasks') {
      navigate('/tasks');
    } else if (tab === 'calendar') {
      navigate('/calendar');
    } else if (tab === 'reports') {
      navigate('/reports');
    } else if (tab === 'artists') {
      navigate('/artists');
    } else if (tab === 'shows') {
      navigate('/shows');
    } else if (tab === 'whatsapp') {
      navigate('/whatsapp');
    } else if (tab === 'google') {
      navigate('/google');
    } else if (tab === 'meetings') {
      navigate('/meetings');
    } else if (tab === 'marketing') {
      navigate('/marketing');
    } else if (tab === 'production') {
      navigate('/production');
    } else if (tab === 'ai') {
      navigate('/ai');
    } else if (tab === 'kpis') {
      navigate('/kpis');
    } else if (tab === 'users') {
      navigate('/users');
    } else if (tab === 'profile') {
      navigate('/profile');
    }
  };

  const handleViewArtists = () => {
    navigate('/artists');
  };

  const handleSelectArtist = (artistId: string) => {
    setShowArtistDetails(artistId);
  };

  const handleCreateArtist = () => {
    setShowCreateArtist(true);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);

  // Check if accessing preview routes - bypass auth
  const isPreviewRoute = ENABLE_CLASSIC_ROUTES &&
    (location.pathname === '/welcome' || location.pathname === '/lobby' || location.pathname === '/mail');

  if (isPreviewRoute) {
    return (
      <Routes>
        <Route path="/welcome" element={
          <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <WelcomePreview />
          </React.Suspense>
        } />
        <Route path="/lobby" element={
          <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <LobbyPreview />
          </React.Suspense>
        } />
        <Route path="/mail" element={
          <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <MailPreview />
          </React.Suspense>
        } />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando TaskMaster...</p>
        </div>
      </div>
    );
  }

  // Show database mode selection if not determined yet
  if (dbMode === 'checking') {
    return (
      <SupabaseConnection
        onConnectionSuccess={() => setDbMode('ready')}
        onUseLocalDatabase={() => {
          localStorage.setItem('useLocalDatabase', 'true');
          setDbMode('ready');
        }}
      />
    );
  }

  if (!user) {
    return (
      <div>
        <React.Suspense fallback={<div></div>}>
          <BetaBanner />
        </React.Suspense>
        <Routes>
          <Route path="/login" element={
            <React.Suspense fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando...</p>
                </div>
              </div>
            }>
              <LoginForm />
            </React.Suspense>
          } />
          <Route path="/register" element={
            <React.Suspense fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando...</p>
                </div>
              </div>
            }>
              <RegisterForm />
            </React.Suspense>
          } />
          <Route path="/reset-password" element={
            <React.Suspense fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando...</p>
                </div>
              </div>
            }>
              <ResetPassword />
            </React.Suspense>
          } />

          {/* Classic Routes Preview (feature flag controlled) */}
          {ENABLE_CLASSIC_ROUTES && (
            <>
              <Route path="/welcome" element={
                <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
                  <WelcomePreview />
                </React.Suspense>
              } />
              <Route path="/lobby" element={
                <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
                  <LobbyPreview />
                </React.Suspense>
              } />
              <Route path="/mail" element={
                <React.Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
                  <MailPreview />
                </React.Suspense>
              } />
            </>
          )}

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'organization') {
      return (
        <OrganizationDashboard
          onSelectArtist={handleSelectArtist}
          onCreateArtist={handleCreateArtist}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          projects={projects}
          departments={departments}
          users={[]}
        />
      );
    }

    if (activeTab === 'artists' && !showArtistDetails) {
      return (
        <ArtistManager
          onSelectArtist={handleSelectArtist}
          onCreateArtist={handleCreateArtist}
          onSelectProject={handleSelectProject}
        />
      );
    }

    if (showArtistDetails) {
      return (
        <ArtistDetails
          artistId={showArtistDetails}
          onBack={() => setShowArtistDetails(null)}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
        />
      );
    }

    if (activeTab === 'dashboard' && selectedProject) {
      return (
        <ProjectDashboard
          project={selectedProject}
          tasks={projectTasks}
          departments={departments}
          onTaskUpdate={(task) => {
            setTasks(tasks.map(t => t.id === task.id ? task : t));
          }}
          onAddTask={() => {}}
        />
      );
    }

    if (activeTab === 'tasks') {
      return (
        <TaskBoard
          tasks={projectTasks}
          departments={departments}
          project={selectedProject}
          onTasksChange={setTasks}
        />
      );
    }

    if (activeTab === 'calendar') {
      return (
        <Calendar
          tasks={projectTasks}
          onTaskUpdate={(task) => {
            setTasks(tasks.map(t => t.id === task.id ? task : t));
          }}
        />
      );
    }

    if (activeTab === 'schedule') {
      return (
        <Schedule
          selectedProject={selectedProject}
          onProjectUpdate={(project) => {
            setProjects(projects.map(p => p.id === project.id ? project : p));
          }}
          tasks={projectTasks}
          onTasksChange={setTasks}
        />
      );
    }

    if (activeTab === 'whatsapp') {
      return (
        <WhatsAppManager
          tasks={projectTasks}
          selectedProject={selectedProject}
          onProjectUpdate={(project) => {
            setProjects(projects.map(p => p.id === project.id ? project : p));
          }}
        />
      );
    }

    if (activeTab === 'google') return <GoogleIntegration />;
    if (activeTab === 'meetings') return <MeetingsManager project={selectedProject} />;
    if (activeTab === 'marketing') return <MarketingManager project={selectedProject} />;
    if (activeTab === 'production') return <ProductionManager project={selectedProject} />;
    if (activeTab === 'preproduction') return <PreProductionManager project={selectedProject} />;
    if (activeTab === 'ai') return <AIInsights project={selectedProject} tasks={projectTasks} />;
    if (activeTab === 'kpis') return <KPIManager selectedProject={selectedProject} />;
    if (activeTab === 'mindmap') {
      return (
        <MindMap
          selectedProject={selectedProject}
          tasks={projectTasks}
          onTasksChange={setTasks}
        />
      );
    }
    if (activeTab === 'users' && selectedProject) {
      return (
        <UserManagement
          project={selectedProject}
          onProjectUpdate={(project) => {
            setProjects(projects.map(p => p.id === project.id ? project : p));
          }}
        />
      );
    }
    if (activeTab === 'presentation') return <Presentation />;
    if (activeTab === 'profile') return <UserProfile />;
    if (activeTab === 'preferences') return <UserPreferences />;
    if (activeTab === 'role-features') return <UserRoleFeatures />;
    if (activeTab === 'about') return <About />;
    if (activeTab === 'reports') {
      return <ReportsPage />;
    }
    if (activeTab === 'shows') {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">🎤 Shows</h2>
          <p className="text-gray-600">
            Gerencie apresentações, turnês e eventos dos artistas.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <Toaster position="top-right" richColors closeButton />
      <React.Suspense fallback={<div></div>}>
        <BetaBanner />
      </React.Suspense>
      <React.Suspense fallback={<div></div>}>
        <DemoBanner />
      </React.Suspense>

      {/* Onboarding for new users */}
      {showOnboarding && (
        <React.Suspense fallback={<div></div>}>
          <Onboarding
            onComplete={() => {
              setShowOnboarding(false);
              localStorage.setItem('hasSeenOnboarding', 'true');
              navigate('/');
            }}
            onSkip={() => {
              setShowOnboarding(false);
              localStorage.setItem('hasSeenOnboarding', 'true');
              navigate('/');
            }}
          />
        </React.Suspense>
      )}

      {/* Welcome modal for returning users */}
      {showWelcome && !showOnboarding && (
        <React.Suspense fallback={<div></div>}>
          <WelcomeModal
            userName={user.name || user.email.split('@')[0]}
            onClose={() => setShowWelcome(false)}
          />
        </React.Suspense>
      )}

      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/reset-password" element={<Navigate to="/" replace />} />

        {/* Redirects for old routes */}
        <Route path="/dashboard" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <DashboardRedirect />
          </React.Suspense>
        } />
        <Route path="/visao-geral" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <VisaoGeralRedirect />
          </React.Suspense>
        } />

        {/* Standalone routes (without MainLayout) */}
        <Route path="/command-center" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <CommandCenter />
          </React.Suspense>
        } />
        <Route path="/templates" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <Templates />
          </React.Suspense>
        } />
        <Route path="/planejamento" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <PlanejamentoPage />
          </React.Suspense>
        } />
        <Route path="/planejamento/dashboard" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <PlanningDashboard />
          </React.Suspense>
        } />
        <Route path="/planejamento/aprovacoes" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ApprovalsPage />
          </React.Suspense>
        } />
        <Route path="/validator" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <FunctionalityValidator />
          </React.Suspense>
        } />
        <Route path="/system-validator" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <SystemValidator />
          </React.Suspense>
        } />
        <Route path="/beta-dashboard" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <BetaDashboard />
          </React.Suspense>
        } />

        <Route path="/music" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <MusicHub />
          </React.Suspense>
        } />
        <Route path="/music/:artistId" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <MusicHub />
          </React.Suspense>
        } />

        <Route path="/biblioteca" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <FileLibrary />
          </React.Suspense>
        } />

        <Route path="/ia-texto" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <AITextGenerator />
          </React.Suspense>
        } />

        <Route path="/shows" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ShowsManager />
          </React.Suspense>
        } />

        <Route path="/docs/manual-usuario" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ManualUsuario />
          </React.Suspense>
        } />

        <Route path="/docs/manual-escritorio" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ManualEscritorio />
          </React.Suspense>
        } />

        <Route path="/docs/apresentacao" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <Apresentacao />
          </React.Suspense>
        } />

        <Route path="/docs/fluxos" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <Fluxos />
          </React.Suspense>
        } />

        <Route path="/docs/faq" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <FAQ />
          </React.Suspense>
        } />

        <Route path="/docs/changelog" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <Changelog />
          </React.Suspense>
        } />

        <Route path="/tours" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ToursManager />
          </React.Suspense>
        } />

        <Route path="/content" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ContentManager />
          </React.Suspense>
        } />

        <Route path="/releases" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <ReleasesManager />
          </React.Suspense>
        } />

        <Route path="/team" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <TeamPage />
          </React.Suspense>
        } />

        <Route path="/finance" element={
          <React.Suspense fallback={<div className="p-6">Carregando...</div>}>
            <FinancePage />
          </React.Suspense>
        } />

        {/* Main layout routes */}
        <Route path="/*" element={
          <React.Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando...</p>
              </div>
            </div>
          }>
            <MainLayout
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onViewArtists={handleViewArtists}
            >
              <React.Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              }>
                {renderContent()}
              </React.Suspense>
            </MainLayout>
          </React.Suspense>
        } />
      </Routes>

      {/* Modal de Novo Projeto */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <React.Suspense fallback={
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            </div>
          }>
            <ProjectForm
              onSubmit={handleProjectSubmit}
              onCancel={() => setShowCreateProject(false)}
            />
          </React.Suspense>
        </div>
      )}

      {/* Modal de Novo Artista */}
      {showCreateArtist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <React.Suspense fallback={
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            </div>
          }>
            <ArtistForm
              onSubmit={handleArtistSubmit}
              onCancel={() => setShowCreateArtist(false)}
            />
          </React.Suspense>
        </div>
      )}

      {/* Beta Feedback Widget */}
      {user && (
        <React.Suspense fallback={<div></div>}>
          <BetaFeedbackWidget />
        </React.Suspense>
      )}
    </div>
  );
}

export default App;
