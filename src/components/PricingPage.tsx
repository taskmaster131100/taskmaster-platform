import React, { useState } from 'react';
import { Check, X, Zap, Gift, Clock } from 'lucide-react';
import { PRICING_PLANS, LAUNCH_PROMO, BILLING_INTERVALS } from '../config/pricing';
import { useNavigate } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<string>('month');

  const handleSelectPlan = (planId: string) => {
    if (planId === 'professional') {
      navigate('/mentor-consulting');
    } else {
      navigate(`/checkout?plan=${planId}&interval=${billingInterval}`);
    }
  };

  const getDisplayPrice = (plan: typeof PRICING_PLANS[0]) => {
    if (billingInterval === 'semester') return plan.priceSemiannualMonthly;
    if (billingInterval === 'year') return plan.priceAnnualMonthly;
    return plan.priceMonthly;
  };

  const getTotalPrice = (plan: typeof PRICING_PLANS[0]) => {
    if (billingInterval === 'semester') return plan.priceSemiannual;
    if (billingInterval === 'year') return plan.priceAnnual;
    return plan.priceMonthly;
  };

  const getPromoPrice = (plan: typeof PRICING_PLANS[0]) => {
    if (!LAUNCH_PROMO.enabled || billingInterval !== 'month') return null;
    return plan.priceMonthly * (1 - LAUNCH_PROMO.discountPercent / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Promoção de Lançamento Banner */}
        {LAUNCH_PROMO.enabled && (
          <div className="mb-8 bg-gradient-to-r from-[#FFAD85] to-[#FF8C5A] rounded-2xl p-6 text-white text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{LAUNCH_PROMO.label}</h2>
              <Gift className="w-6 h-6" />
            </div>
            <p className="text-lg opacity-90">{LAUNCH_PROMO.description}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm opacity-80">
              <Clock className="w-4 h-4" />
              <span>Válido nos {LAUNCH_PROMO.durationMonths} primeiros meses do plano mensal</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Planos Simples e Transparentes
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Escolha o plano perfeito para sua carreira musical
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 shadow-sm">
            {BILLING_INTERVALS.map((interval) => (
              <button
                key={interval.id}
                onClick={() => setBillingInterval(interval.id)}
                className={`px-5 py-2 rounded-full transition-all text-sm font-medium ${
                  billingInterval === interval.id
                    ? 'bg-[#FFAD85] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {interval.label}
                {interval.badge && (
                  <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {interval.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan) => {
            const displayPrice = getDisplayPrice(plan);
            const totalPrice = getTotalPrice(plan);
            const promoPrice = getPromoPrice(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all ${
                  plan.popular ? 'ring-2 ring-[#FFAD85] scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-[#FFAD85] text-white px-4 py-1 rounded-full text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {promoPrice ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-400 line-through">
                            ${displayPrice.toFixed(0)}
                          </span>
                          <span className="text-5xl font-bold text-green-600">
                            ${promoPrice.toFixed(0)}
                          </span>
                          <span className="text-gray-600">/mês</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1 font-medium">
                          🎉 Preço promocional nos 3 primeiros meses
                        </p>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-gray-900">
                          ${displayPrice.toFixed(plan.id === 'professional' ? 2 : 0)}
                        </span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                    )}
                    {billingInterval === 'semester' && (
                      <p className="text-sm text-green-600 mt-2">
                        Cobrado ${totalPrice.toFixed(2)} a cada 6 meses
                      </p>
                    )}
                    {billingInterval === 'year' && (
                      <p className="text-sm text-green-600 mt-2">
                        Cobrado ${totalPrice.toFixed(0)}/ano
                      </p>
                    )}
                    {plan.id === 'professional' && (
                      <p className="text-xs text-gray-500 mt-1">
                        A partir de — varia conforme necessidade
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all mb-6 ${
                      plan.popular
                        ? 'bg-[#FFAD85] text-white hover:bg-[#FF9B6A]'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {feature.name}
                          {feature.limit && feature.included && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({feature.limit})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças serão refletidas no próximo ciclo de cobrança.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Existe período de teste gratuito?
              </h3>
              <p className="text-gray-600">
                Sim! Todos os planos incluem 14 dias de teste gratuito com funcionalidades Pro. Não precisa de cartão de crédito.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Quais formas de pagamento são aceitas?
              </h3>
              <p className="text-gray-600">
                Aceitamos todos os principais cartões de crédito (Visa, Mastercard, American Express) via Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                O que é a promoção de lançamento?
              </h3>
              <p className="text-gray-600">
                Nos 3 primeiros meses do plano mensal, você paga 25% a menos. Depois, o valor volta ao preço normal. É nossa forma de agradecer por acreditar no TaskMaster desde o início.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Qual a diferença entre semestral e anual?
              </h3>
              <p className="text-gray-600">
                O plano semestral tem 15% de desconto e o anual 25% de desconto em relação ao mensal. Quanto maior o compromisso, maior a economia.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Claro! Você pode cancelar sua assinatura a qualquer momento. Continuará tendo acesso até o final do período pago.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Confiado por artistas e produtores musicais</p>
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>SSL Criptografado</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Dados Seguros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
