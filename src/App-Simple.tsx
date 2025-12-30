import { useAuth } from './components/auth/AuthProvider';

function AppSimple() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFAD85] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando TaskMaster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">TaskMaster</h1>
          <p className="text-gray-600 mb-6 text-center">
            Faça login para acessar o sistema
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-[#FFAD85] hover:bg-[#FF9B6A] text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bem-vindo ao TaskMaster
          </h1>
          <p className="text-gray-600 mb-6">
            Olá, {user.name || user.email}!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">
              ✅ Sistema carregado com sucesso!
            </p>
            <p className="text-green-600 text-sm mt-1">
              A aplicação está funcionando corretamente.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FFAD85] hover:bg-[#FF9B6A] text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppSimple;
