import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Check, Zap, ArrowRight, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';
import { apiFetch } from '../lib/api';

const plans = [
    {
        id: 'monthly',
        name: 'Monthly',
        price: '$9.99',
        interval: '/month',
        features: ['Billed monthly', 'Zero Ads', 'Premium Features', 'Priority Support']
    },
    {
        id: 'yearly',
        name: 'Yearly',
        price: '$69.99',
        interval: '/year',
        features: ['Save 42% vs monthly', 'Zero Ads', 'Premium Features', 'Priority Support'],
        popular: true
    },
    {
        id: 'lifetime',
        name: 'Lifetime',
        price: '$129.99',
        interval: ' once',
        features: ['Pay once, enjoy forever', 'Zero Ads', 'Premium Features', 'Instant access']
    }
];

export default function Pricing() {
  const { user, userData, isPremium, daysRemaining } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const premiumStatus = userData?.premiumStatus || 'FREE';

  const handleSubscribe = async (planId: string) => {
    if (!user) {
        navigate('/login');
        return;
    }

    if (userData?.premiumStatus === 'PREMIUM' || userData?.premiumStatus === 'PREMIUM_TRIAL' || userData?.premiumStatus === 'CANCELING') {
        alert("You are already on a premium plan! Visit your dashboard to manage your subscription.");
        return;
    }

    setLoading(planId);
    
    try {
        const token = await user.getIdToken(true);
        const res = await apiFetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ planId }),
        });

        if (!res.ok) {
            const message = res.json?.error || res.json?.raw || `Request failed (${res.status})`;
            throw new Error(String(message));
        }

        const session = res.json || {};
        if (session.error) throw new Error(session.error || 'Failed to create checkout session');

        if (session.url) {
            const newWindow = window.open(session.url, '_blank');
            if (!newWindow) setCheckoutUrl(session.url);
        } else {
            throw new Error('No checkout URL returned from server. Ensure the backend is deployed and VITE_API_BASE_URL is configured.');
        }
    } catch (err: any) {
        console.error(err);
        alert(err.message || 'Failed to initialize payment');
    } finally {
        setLoading(null);
    }
  };

  return (
    <div className="py-24 bg-[#09090B] flex-1 relative">
      {checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="bg-[#0C0C0E] border border-amber-500/50 p-8 rounded-2xl flex flex-col items-center max-w-sm text-center">
                <Zap className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Proceed to Payment</h3>
                <p className="text-zinc-400 mb-6 text-sm">Your browser blocked the popup. Click below to securely open Stripe Checkout in a new tab.</p>
                <a 
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setCheckoutUrl(null)}
                    className="w-full bg-amber-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors"
                >
                    Open Checkout
                </a>
                <button 
                    onClick={() => setCheckoutUrl(null)}
                    className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Choose your PREMIUM Plan</h2>
          
          {/* Premium Status Banner */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-6 py-3 mb-6"
            >
              <Zap className="w-5 h-5 text-green-400" />
              <div className="text-center">
                <p className="text-green-400 font-semibold">
                  {premiumStatus === 'CANCELING' ? 'Premium Active Until Period End' : 'Premium Active'}
                </p>
                <p className="text-green-300 text-sm">
                  {userData?.isLifetime
                    ? 'Lifetime access'
                    : `${daysRemaining} days remaining • Next renewal ${formatDate(userData?.nextRenewalDate || userData?.premiumEndDate)}`}
                </p>
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors flex items-center gap-1"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <p className="text-lg text-zinc-400">Pick the best plan for you. No hidden fees — charged immediately upon purchase.</p>
          <div className="mt-6 inline-flex max-w-2xl items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100">
            <ShieldCheck className="h-5 w-5 shrink-0 text-amber-400" />
            <span>Your PREMIUM subscription will take effect when you sign in to the mobile app with this same email address.</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
                <div 
                    key={plan.id}
                    className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-amber-500/50 shadow-2xl shadow-amber-500/10 relative z-10 scale-105 bg-gradient-to-b from-[#0C0C0E] to-[#120f09]' : 'border-white/5 bg-[#0C0C0E]'} flex flex-col ${
                      isPremium && userData?.subscriptionType === plan.id ? 'border-green-500/50' : ''
                    }`}
                >
                    {plan.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>Most Popular</span>
                        </div>
                    )}
                    
                    {/* Current Plan Badge */}
                    {isPremium && userData?.subscriptionType === plan.id && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Current Plan</span>
                        </div>
                    )}
                     
                    <h3 className="text-xl font-semibold mb-2 text-zinc-300">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-extrabold tracking-tight text-white">{plan.price}</span>
                        <span className="text-zinc-500 text-sm font-medium">{plan.interval}</span>
                    </div>

                    {/* Current Plan Info */}
                    {isPremium && userData?.subscriptionType === plan.id && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>{userData?.isLifetime ? 'Lifetime access active' : `Current period ends ${formatDate(userData?.premiumEndDate)}`}</span>
                            </div>
                            {premiumStatus === 'CANCELING' && (
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>Auto-renewal is stopped</span>
                                </div>
                            )}
                        </div>
                    )}

                    <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-amber-500 shrink-0" />
                                <span className="text-zinc-300 text-sm">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loading === plan.id || (isPremium && userData?.subscriptionType === plan.id)}
                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                          isPremium && userData?.subscriptionType === plan.id
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                            : plan.popular 
                              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5'
                        } disabled:opacity-50`}
                    >
                        {loading === plan.id ? 'Loading...' : (
                          isPremium && userData?.subscriptionType === plan.id
                            ? 'Current Plan'
                            : 'Get Started'
                        )}
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
