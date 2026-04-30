import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'motion/react';
import { Check, Zap, ArrowRight, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/utils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51LxR9sA8GFmNq8FQqh6UiQKB9aYs0wxOhAnNAOLSgn4IYgI6o3pRTWmQMFeb44ypfMs1F32P7Pcg1oSJtTsaqDFt00uDygs1R0');

const plans = [
    {
        id: 'price_monthly',
        name: 'Monthly',
        price: '$9.99',
        interval: '/month',
        features: ['7-day free trial', 'Zero Ads', 'Premium Features', 'Priority Support']
    },
    {
        id: 'price_yearly',
        name: 'Yearly',
        price: '$79.99',
        interval: '/year',
        features: ['7-day free trial', '2 months free', 'Zero Ads', 'Premium Features'],
        popular: true
    },
    {
        id: 'price_lifetime',
        name: 'Lifetime',
        price: '$199.99',
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
  const isPremiumTrial = premiumStatus === 'PREMIUM_TRIAL';

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
        navigate('/login');
        return;
    }

    if (userData?.premiumStatus === 'PREMIUM' || userData?.premiumStatus === 'PREMIUM_TRIAL') {
        alert("You are already on the PREMIUM tier!");
        return;
    }

    setLoading(priceId);
    
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId,
                userId: user.uid
            }),
        });
        
        const session = await response.json();
        
        if (session.error) {
            throw new Error(session.error);
        }

        if (session.id === 'mock') {
            alert('Stripe key not configured. Mocking success checkout.');
            window.location.href = session.url;
            return;
        }

        if (session.url) {
            // Open Stripe Checkout in a new tab to avoid iframe restrictions
            const newWindow = window.open(session.url, '_blank');
            if (!newWindow) {
                // Fallback if popup blocked
                setCheckoutUrl(session.url);
            }
        } else {
            throw new Error("No checkout URL returned from server.");
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
                  {premiumStatus === 'PREMIUM_TRIAL' ? 'Trial Active' : 'Premium Active'}
                </p>
                <p className="text-green-300 text-sm">
                  {daysRemaining} days remaining • Expires {formatDate(userData?.premiumEndDate)}
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

          <p className="text-lg text-zinc-400">Pick the best plan for you. All recurring plans include a 7-day free trial.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
                <div 
                    key={plan.id}
                    className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-amber-500/50 shadow-2xl shadow-amber-500/10 relative z-10 scale-105 bg-gradient-to-b from-[#0C0C0E] to-[#120f09]' : 'border-white/5 bg-[#0C0C0E]'} flex flex-col ${
                      isPremium && userData?.subscriptionType === plan.id.replace('price_', '') ? 'border-green-500/50' : ''
                    }`}
                >
                    {plan.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>Most Popular</span>
                        </div>
                    )}
                    
                    {/* Current Plan Badge */}
                    {isPremium && userData?.subscriptionType === plan.id.replace('price_', '') && (
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
                    {isPremium && userData?.subscriptionType === plan.id.replace('price_', '') && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>Current period ends {formatDate(userData?.premiumEndDate)}</span>
                            </div>
                            {premiumStatus === 'PREMIUM_TRIAL' && (
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>{daysRemaining} days left in trial</span>
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
                        disabled={loading === plan.id || (isPremium && userData?.subscriptionType === plan.id.replace('price_', ''))}
                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                          isPremium && userData?.subscriptionType === plan.id.replace('price_', '')
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                            : plan.popular 
                              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5'
                        } disabled:opacity-50`}
                    >
                        {loading === plan.id ? 'Loading...' : (
                          isPremium && userData?.subscriptionType === plan.id.replace('price_', '')
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
