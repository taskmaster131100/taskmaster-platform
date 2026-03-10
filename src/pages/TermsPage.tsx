import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-500 mb-8">Última atualização: março de 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar ou usar o TaskMaster ("Plataforma"), você concorda com estes Termos de Uso.
                Se você está usando a Plataforma em nome de uma empresa ou organização, você declara
                que tem autoridade para vincular essa entidade a estes termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Descrição do Serviço</h2>
              <p>
                O TaskMaster é uma plataforma SaaS de gestão de carreiras musicais que oferece ferramentas
                para gerenciamento de artistas, projetos, shows, releases, financeiro e inteligência artificial
                aplicada à indústria musical.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Uso Aceitável</h2>
              <p>Você concorda em usar a Plataforma somente para fins legais e de acordo com estes Termos. É proibido:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Usar a Plataforma para fins ilegais ou não autorizados</li>
                <li>Tentar obter acesso não autorizado a sistemas ou dados</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Revender ou sublicenciar o acesso à Plataforma sem autorização</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Conta de Usuário</h2>
              <p>
                Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas
                as atividades realizadas em sua conta. Notifique-nos imediatamente em caso de uso não autorizado
                em <a href="mailto:suporte@taskmaster.app" className="text-[#FF9B6A] hover:underline">suporte@taskmaster.app</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Dados e Privacidade</h2>
              <p>
                O tratamento dos seus dados é regido pela nossa{' '}
                <a href="/privacidade" className="text-[#FF9B6A] hover:underline">Política de Privacidade</a>,
                em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Propriedade Intelectual</h2>
              <p>
                O TaskMaster e seus conteúdos (código, design, marca, textos) são propriedade da TaskMaster
                Tecnologia Ltda. e protegidos por leis de propriedade intelectual. Os dados inseridos por você
                são de sua propriedade.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Planos e Pagamentos</h2>
              <p>
                Os planos pagos são cobrados conforme descrito na página de preços. Cancelamentos podem ser
                feitos a qualquer momento, com acesso mantido até o fim do período pago. Não realizamos
                reembolsos proporcionais, exceto por exigência legal.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Limitação de Responsabilidade</h2>
              <p>
                O TaskMaster é fornecido "como está". Não nos responsabilizamos por danos indiretos, incidentais
                ou consequenciais decorrentes do uso da Plataforma. Nossa responsabilidade total é limitada ao
                valor pago pelos últimos 3 meses de assinatura.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Modificações</h2>
              <p>
                Podemos atualizar estes Termos periodicamente. Notificaremos usuários sobre mudanças
                significativas por email ou notificação na Plataforma. O uso continuado após as mudanças
                constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contato</h2>
              <p>
                Para dúvidas sobre estes Termos, entre em contato com nossa equipe jurídica em{' '}
                <a href="mailto:legal@taskmaster.app" className="text-[#FF9B6A] hover:underline">legal@taskmaster.app</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
