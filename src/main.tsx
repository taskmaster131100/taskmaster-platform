import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.tsx';  // Main app with full functionality
import { AuthProvider } from './components/auth/AuthProvider';
import { OrganizationProvider } from './components/organization/OrganizationContext';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';  // Initialize i18n
import './index.css';

// Use HashRouter when classic routes are enabled for easier preview access
const ENABLE_CLASSIC_ROUTES = import.meta.env.VITE_ENABLE_CLASSIC_ROUTES === 'true';
const Router = ENABLE_CLASSIC_ROUTES ? HashRouter : BrowserRouter;

const renderApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <OrganizationProvider>
                <App />
              </OrganizationProvider>
            </AuthProvider>
          </Router>
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center; padding: 2rem; max-width: 500px;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Erro ao Carregar</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">Ocorreu um erro ao carregar o TaskMaster.</p>
          <button onclick="location.reload()" style="background: #4f46e5; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
            Tentar Novamente
          </button>
        </div>
      </div>
    `;
  }
};

// Initialize the app
renderApp();