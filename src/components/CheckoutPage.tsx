import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CreditCard, Check } from 'lucide-react';
import { PRICING_PLANS } from '../config/pricing';
import { toast } from 'sonner';

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'starter';
  
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const plan = PRICING_PLANS.find(p => p.id === planId);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Plan not found</h2>
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const yearlyPrice = Math.round(plan.price * 12 * 0.8);
  const displayPrice = billingInterval === 'year' ? yearlyPrice : plan.price;

  const handleCheckout = async () => {
    setLoading(true);

    try {
      // TODO: Integrate with Stripe
      // This is where we'll call Stripe's checkout API
      // For now, just show a message
      
      toast.info('Stripe integration pending. Please configure Stripe API keys.');
      
      // Example of what the Stripe integration will look like:
      /*
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          interval: billingInterval
        })
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY!);
      await stripe.redirectToCheckout({ sessionId });
      */

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/pricing')}
            className="text-[#FFAD85] hover:text-[#FF9B6A] mb-4"
          >
            ← Back to pricing
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete your purchase</h1>
          <p className="text-gray-600 mt-2">Start your 14-day free trial today</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name} Plan</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${displayPrice}
                    </p>
                    <p className="text-sm text-gray-600">
                      /{billingInterval === 'year' ? 'year' : 'month'}
                    </p>
                  </div>
                </div>

                {/* Billing Interval Toggle */}
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Billing Interval
                  </label>
                  <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setBillingInterval('month')}
                      className={`px-4 py-2 rounded-md transition-all ${
                        billingInterval === 'month'
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-600'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('year')}
                      className={`px-4 py-2 rounded-md transition-all ${
                        billingInterval === 'year'
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-600'
                      }`}
                    >
                      Yearly (Save 20%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Included Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plan.features.filter(f => f.included).slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Form Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Stripe integration is ready to be configured. 
                  Add your Stripe API keys to enable payments.
                </p>
              </div>

              {/* This will be replaced with Stripe Elements */}
              <div className="space-y-4 opacity-50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                    •••• •••• •••• ••••
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                      MM / YY
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                      •••
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{plan.name} Plan</span>
                  <span className="font-medium text-gray-900">${displayPrice}</span>
                </div>
                {billingInterval === 'year' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Yearly Discount (20%)</span>
                    <span className="font-medium text-green-600">
                      -${Math.round(plan.price * 12 * 0.2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">${displayPrice}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#FFAD85] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#FF9B6A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? 'Processing...' : 'Start Free Trial'}
              </button>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Secure payment with Stripe</span>
                </div>
                <p>
                  By clicking "Start Free Trial", you agree to our Terms of Service and Privacy Policy.
                </p>
                <p className="font-medium text-gray-900">
                  14-day free trial • Cancel anytime • No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
