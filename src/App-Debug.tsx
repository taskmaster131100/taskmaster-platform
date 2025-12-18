import { useAuth } from './components/auth/AuthProvider';

function AppDebug() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Carregando TaskMaster...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#1f2937'
          }}>TaskMaster</h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '32px'
          }}>Faça login para continuar</p>

          <div style={{ marginBottom: '16px' }}>
            <a
              href="/login"
              style={{
                display: 'block',
                width: '100%',
                background: '#4f46e5',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: '600',
                marginBottom: '12px'
              }}
            >
              Entrar
            </a>
            <a
              href="/register"
              style={{
                display: 'block',
                width: '100%',
                background: '#f3f4f6',
                color: '#4f46e5',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Criar conta
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#1f2937'
          }}>Bem-vindo, {user.email}!</h1>
          <p style={{ color: '#6b7280' }}>Você está logado no TaskMaster</p>
        </div>

        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#1f2937'
          }}>Debug Info</h2>
          <pre style={{
            background: '#f3f4f6',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto'
          }}>
            {JSON.stringify({ user, loading }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default AppDebug;
