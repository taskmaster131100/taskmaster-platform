import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
          <p className="text-sm text-gray-500 mb-8">Última atualização: março de 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Quem somos</h2>
              <p>
                TaskMaster Tecnologia Ltda. ("nós", "nosso") opera a plataforma TaskMaster.
                Esta política descreve como coletamos, usamos e protegemos seus dados pessoais,
                em conformidade com a LGPD (Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Dados que coletamos</h2>
              <p>Coletamos as seguintes categorias de dados:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Dados de cadastro:</strong> nome, email, telefone</li>
                <li><strong>Dados da organização:</strong> nome, endereço, informações de contato</li>
                <li><strong>Dados de uso:</strong> logs de acesso, funcionalidades utilizadas, erros</li>
                <li><strong>Dados de pagamento:</strong> processados por terceiros (Stripe); não armazenamos dados de cartão</li>
                <li><strong>Dados inseridos por você:</strong> artistas, projetos, shows, financeiro (são seus e você controla)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Como usamos seus dados</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fornecer e melhorar os serviços da Plataforma</li>
                <li>Comunicar atualizações, novidades e suporte</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Detectar e prevenir fraudes e abusos</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Compartilhamento de dados</h2>
              <p>Não vendemos seus dados. Compartilhamos apenas com:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Supabase:</strong> banco de dados e autenticação (servidores nos EUA/UE)</li>
                <li><strong>Vercel:</strong> hospedagem da aplicação</li>
                <li><strong>OpenAI:</strong> processamento de IA (apenas conteúdo enviado às funcionalidades de IA)</li>
                <li><strong>Stripe:</strong> processamento de pagamentos</li>
                <li><strong>Sentry:</strong> monitoramento de erros (dados técnicos anonimizados)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Seus direitos (LGPD)</h2>
              <p>Você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Acessar os dados que temos sobre você</li>
                <li>Corrigir dados incorretos ou incompletos</li>
                <li>Solicitar a exclusão dos seus dados</li>
                <li>Exportar seus dados em formato portátil</li>
                <li>Revogar consentimentos a qualquer momento</li>
                <li>Apresentar reclamação à ANPD</li>
              </ul>
              <p className="mt-2">
                Para exercer esses direitos, acesse as configurações da conta ou envie email para{' '}
                <a href="mailto:privacidade@taskmaster.app" className="text-[#FF9B6A] hover:underline">privacidade@taskmaster.app</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Retenção de dados</h2>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa. Após cancelamento, dados são
                mantidos por 90 dias para eventual reativação e então excluídos permanentemente,
                exceto quando obrigados por lei a manter por mais tempo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Cookies</h2>
              <p>
                Usamos cookies essenciais para autenticação e funcionamento da Plataforma.
                Cookies analíticos são usados apenas com seu consentimento para melhorar a experiência.
                Você pode gerenciar cookies nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Segurança</h2>
              <p>
                Adotamos medidas técnicas e organizacionais para proteger seus dados:
                criptografia em trânsito (TLS 1.3), criptografia em repouso, controle de acesso
                por organização (RLS), autenticação segura via Supabase Auth e monitoramento contínuo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Contato</h2>
              <p>
                Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado em{' '}
                <a href="mailto:privacidade@taskmaster.app" className="text-[#FF9B6A] hover:underline">privacidade@taskmaster.app</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
