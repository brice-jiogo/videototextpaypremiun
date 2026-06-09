import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Settings, CreditCard, LogOut, Receipt, ExternalLink, ArrowRight, RefreshCw, Ban, ShieldCheck } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { formatDate, formatCurrency } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { showToast } from '../components/Toast';

export default function Dashboard() {
  const { user, userData, isPremium, daysRemaining } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [syncingCheckout, setSyncingCheckout] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  
  const premiumStatus = userData?.premiumStatus || 'FREE';

  useEffect(() => {
     if (searchParams.get('success') === 'true' && user) {
         syncCheckoutSession();
     }
  }, [searchParams, user]);

  useEffect(() => {
    if (user) {
      loadPaymentHistory();
      if (isPremium) {
        loadSubscriptionDetails();
      }
    }
  }, [user, isPremium]);

  const loadPaymentHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const token = await user.getIdToken(true);
      const res = await apiFetch('/api/billing-history', { headers: { Authorization: `Bearer ${token}` } });
      const data = res.json || {};
      if (!res.ok) {
        throw new Error(data.error || data.raw || 'Failed to load payment history');
      }

      const payments = data.payments || [];

      // If API returned nothing but userData has a last payment, build a synthetic entry
      if (payments.length === 0 && userData?.lastPaymentAmount && userData?.lastPaymentDate) {
        payments.push({
          id: 'local-last-payment',
          type: userData?.subscriptionType || 'subscription',
          amount: userData.lastPaymentAmount,
          currency: userData.lastPaymentCurrency || 'usd',
          status: 'paid',
          createdAt: userData.lastPaymentDate,
          date: userData.lastPaymentDate,
          receiptUrl: userData.lastReceiptUrl || null,
          invoiceUrl: userData.lastInvoiceUrl || null,
        });
      }

      setPaymentHistory(payments);
    } catch (err: any) {
      console.error('Failed to load payment history:', err);
      // Fallback: build history from userData stored in Firestore
      if (userData?.lastPaymentAmount && userData?.lastPaymentDate) {
        setPaymentHistory([{
          id: 'local-last-payment',
          type: userData?.subscriptionType || 'subscription',
          amount: userData.lastPaymentAmount,
          currency: userData.lastPaymentCurrency || 'usd',
          status: 'paid',
          createdAt: userData.lastPaymentDate,
          date: userData.lastPaymentDate,
          receiptUrl: userData.lastReceiptUrl || null,
          invoiceUrl: userData.lastInvoiceUrl || null,
        }]);
      } else {
        showToast('Failed to load payment history', 'error');
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSubscriptionDetails = async () => {
    if (!user) return;
    
    setLoadingSubscription(true);
    try {
      const token = await user.getIdToken(true);
      const res = await apiFetch('/api/subscription-details', { headers: { Authorization: `Bearer ${token}` } });
      const data = res.json || {};
      if (res.ok && data.subscription) setSubscriptionDetails(data.subscription);
    } catch (err: any) {
      console.error('Failed to load subscription details:', err);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const syncCheckoutSession = async () => {
    if (!user || syncingCheckout) return;

    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      showToast('Payment confirmed, but Stripe did not return a session id.', 'warning');
      window.history.replaceState({}, '', '/dashboard');
      return;
    }

    setSyncingCheckout(true);
    try {
      const token = await user.getIdToken(true);
      const res = await apiFetch('/api/sync-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = res.json || {};
      if (!res.ok) throw new Error(data.error || data.raw || 'Failed to activate premium');

      showToast('Premium activated. Your subscription data has been updated.', 'success');
      await loadPaymentHistory();
    } catch (err: any) {
      console.error('Checkout sync error:', err);
      showToast(err.message || 'Payment confirmed, but premium sync failed', 'error');
    } finally {
      setSyncingCheckout(false);
      window.history.replaceState({}, '', '/dashboard');
    }
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const token = await user.getIdToken(true);
      const res = await apiFetch('/api/sync-latest-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = res.json || {};
      if (!res.ok) throw new Error(data.error || data.raw || 'No completed Stripe checkout found for this account');
      await loadPaymentHistory();
      await loadSubscriptionDetails();
      showToast('Premium status synchronized from Stripe', 'success');
    } catch (err: any) {
      console.error('Failed to refresh status:', err);
      showToast(err.message || 'Failed to refresh status', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageBilling = async () => {
      setLoading(true);
      try {
          const token = await user?.getIdToken(true);
          const res = await apiFetch('/api/create-portal-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
          });
          const data = res.json || {};
          if (!res.ok) {
            if (userData?.lastInvoiceUrl) {
              showToast('Billing portal not configured. Opening your last invoice instead.', 'warning');
              window.open(userData.lastInvoiceUrl, '_blank');
              return;
            }
            throw new Error(data.error || data.raw || 'Failed to load billing portal');
          }
          if (data.url) {
              // If fallback mode (portal not configured), show a info toast
              if (data.fallback) {
                showToast(data.message || 'Opening your invoice (billing portal not configured).', 'warning');
              }
              const newWindow = window.open(data.url, '_blank');
              if (!newWindow) {
                 setPortalUrl(data.url);
              }
          } else {
              throw new Error("Failed to load billing portal");
          }
      } catch (err: any) {
          console.error(err);
          // Last resort fallback: open invoice URL directly
          if (userData?.lastInvoiceUrl) {
            showToast('Opening your last invoice as a fallback.', 'warning');
            window.open(userData.lastInvoiceUrl, '_blank');
          } else {
            showToast(err.message || 'Failed to load billing portal', 'error');
          }
      } finally {
          setLoading(false);
      }
  };


  const handleCancelSubscription = async () => {
      if (!user) return;
      setCanceling(true);
      try {
          const token = await user.getIdToken(true);
          const res = await apiFetch('/api/cancel-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
          });
          const data = res.json || {};
          if (!res.ok) throw new Error(data.error || data.raw || 'Failed to stop auto-renewal');
          showToast('Auto-renewal stopped. Premium remains active until the current period ends.', 'success');
          await loadSubscriptionDetails();
      } catch (err: any) {
          console.error(err);
          showToast(err.message || 'Failed to stop auto-renewal', 'error');
      } finally {
          setCanceling(false);
      }
  };

  const handleViewReceipt = () => {
    if (userData?.lastReceiptUrl) {
      window.open(userData.lastReceiptUrl, '_blank');
    } else if (userData?.stripeCustomerId) {
      showToast("No receipt available yet. Complete a payment to generate a receipt.", 'info');
    } else {
      showToast("No payment history available", 'info');
    }
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
          navigate('/login');
          showToast('Logged out successfully', 'success');
      } catch (err: any) {
        console.error('Logout error:', err);
        showToast('Failed to logout', 'error');
      }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full relative">
        {portalUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                <div className="bg-[#0C0C0E] border border-amber-500/50 p-8 rounded-2xl flex flex-col items-center max-w-sm text-center">
                    <Settings className="w-12 h-12 text-amber-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Billing Portal</h3>
                    <p className="text-zinc-400 mb-6 text-sm">Your browser blocked the popup. Click below to open the billing portal securely in a new tab.</p>
                    <a 
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setPortalUrl(null)}
                        className="w-full bg-amber-500 text-black font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                        Open Billing Portal
                    </a>
                    <button 
                        onClick={() => setPortalUrl(null)}
                        className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">
              {syncingCheckout ? 'Activating your premium subscription...' : `Welcome back, ${user?.email}`}
            </p>
          </div>
          <button 
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Premium Status Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 p-8 rounded-2xl mb-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Premium Status</h2>
                    {premiumStatus === 'PREMIUM' && (
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-500" />
                            <span className="text-green-500 font-semibold">Premium Active</span>
                            {daysRemaining > 0 && (
                              <span className="text-zinc-400 text-sm">({daysRemaining} days remaining)</span>
                            )}
                        </div>
                    )}
                    {userData?.isLifetime && (
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-500 font-semibold">Lifetime Access</span>
                        </div>
                    )}
                    {premiumStatus === 'CANCELING' && (
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-500 font-semibold">Premium Active - Renewal Stopped</span>
                            {daysRemaining > 0 && (
                              <span className="text-zinc-400 text-sm">({daysRemaining} days remaining)</span>
                            )}
                        </div>
                    )}
                    {premiumStatus === 'FREE' && (
                        <span className="text-zinc-400">You are on the FREE tier</span>
                    )}
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border ${
                  premiumStatus === 'PREMIUM' || premiumStatus === 'CANCELING' || userData?.isLifetime
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-white/10'
                }`}>
                    <span>{userData?.isLifetime ? 'LIFETIME' : premiumStatus === 'CANCELING' ? 'ENDING' : premiumStatus === 'PREMIUM' ? 'ACTIVE' : 'FREE'}</span>
                </div>
            </div>

            {isPremium && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    <p>{userData?.premiumActivationMessage || 'Your PREMIUM subscription will take effect when you sign in to the mobile app with this same email address.'}</p>
                </div>
            )}

            <hr className="border-white/10" />

            {/* Subscription Details */}
            {isPremium && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-zinc-500 text-sm mb-1">Subscription Type</p>
                            <p className="text-white font-semibold capitalize">
                              {subscriptionDetails?.plan?.interval === 'month' && 'Monthly'}
                              {subscriptionDetails?.plan?.interval === 'year' && 'Yearly'}
                              {userData?.isLifetime && 'Lifetime'}
                              {!subscriptionDetails && userData?.subscriptionType && userData.subscriptionType}
                            </p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-sm mb-1">Billing Amount</p>
                            <p className="text-white font-semibold">
                              {subscriptionDetails?.plan?.amount 
                                ? formatCurrency(subscriptionDetails.plan.amount / 100, subscriptionDetails.plan.currency?.toUpperCase() || 'USD')
                                : userData?.lastPaymentAmount 
                                ? formatCurrency(userData.lastPaymentAmount / 100, 'USD')
                                : 'N/A'
                              }
                            </p>
                        </div>
                    </div>

                    {/* Auto-renewal Information */}
                    {!userData?.isLifetime && subscriptionDetails && (
                        <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-green-300 font-semibold text-sm">
                                        {subscriptionDetails.autoRenewal ? 'Auto-Renewal Enabled' : 'Auto-Renewal Disabled'}
                                    </p>
                                    <p className="text-green-200/70 text-xs mt-1">
                                        {subscriptionDetails.autoRenewal 
                                            ? `Your subscription will automatically renew on ${formatDate(subscriptionDetails.nextBillingDate)} (in ${subscriptionDetails.daysUntilNextBilling} days)`
                                            : `Your subscription will end on ${formatDate(subscriptionDetails.currentPeriodEnd)}`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-green-500/10 rounded px-3 py-2">
                                    <p className="text-green-300/70">Current Period</p>
                                    <p className="text-green-300 font-semibold">{formatDate(subscriptionDetails.currentPeriodStart)}</p>
                                </div>
                                <div className="bg-green-500/10 rounded px-3 py-2">
                                    <p className="text-green-300/70">Renews On</p>
                                    <p className="text-green-300 font-semibold">{formatDate(subscriptionDetails.nextBillingDate)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Original Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-zinc-500 mb-1">Last Payment Date</p>
                            <p className="text-white font-semibold">{formatDate(userData?.lastPaymentDate || subscriptionDetails?.currentPeriodStart)}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500 mb-1">Account Created</p>
                            <p className="text-white font-semibold">{formatDate(userData?.premiumStartDate)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
                {isPremium && (
                    <button 
                        onClick={handleManageBilling}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-white text-black font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Settings className="w-4 h-4" />
                        {loading ? 'Loading...' : 'Manage Billing'}
                    </button>
                )}
                {isPremium && !userData?.isLifetime && (subscriptionDetails?.autoRenewal || (!subscriptionDetails && userData?.subscriptionCancelAtPeriodEnd === false && userData?.stripeSubscriptionId)) && (
                    <button 
                        onClick={handleCancelSubscription}
                        disabled={canceling}
                        className="flex-1 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-300 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Ban className="w-4 h-4" />
                        {canceling ? 'Stopping...' : 'Stop Auto-Renewal'}
                    </button>
                )}
                {isPremium && (
                    <button 
                        onClick={handleViewReceipt}
                        disabled={!userData?.lastReceiptUrl && !userData?.stripeCustomerId}
                        className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Receipt className="w-4 h-4" />
                        View Receipt
                    </button>
                )}
                {!isPremium && (
                    <button 
                        onClick={() => navigate('/pricing')}
                        className="flex-1 px-4 py-3 bg-amber-500 text-black font-bold rounded-lg text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                        <CreditCard className="w-4 h-4" />
                        Upgrade to Premium
                    </button>
                )}
                <button 
                    onClick={handleLogout}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </div>

        {/* Payment History - Only show for premium users */}
        {isPremium && (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 p-8 rounded-2xl mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Payment History</h2>
                {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </div>
                ) : paymentHistory.length > 0 ? (
                    <div className="space-y-4">
                        {paymentHistory.map((payment, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold capitalize">{String(payment.type || 'payment').replace('_', ' ')}</p>
                                        <p className="text-zinc-400 text-sm">{formatDate(payment.createdAt || payment.date)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          payment.status === 'paid' || payment.status === 'succeeded' 
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-zinc-700 text-zinc-400'
                                        }`}>{payment.status || 'paid'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency((payment.amount || 0) / 100, String(payment.currency || 'USD').toUpperCase())}</p>
                                    {(payment.receiptUrl || payment.invoiceUrl) && (
                                        <button 
                                            onClick={() => window.open(payment.receiptUrl || payment.invoiceUrl, '_blank')}
                                            className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 mt-1"
                                        >
                                            View Receipt <ExternalLink className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-zinc-400 mb-4">No payment history found</p>
                        <button
                            onClick={loadPaymentHistory}
                            disabled={loadingHistory}
                            className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                            Retry loading
                        </button>
                        {userData?.lastReceiptUrl && (
                            <button
                                onClick={() => window.open(userData.lastReceiptUrl, '_blank')}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 mx-auto mt-2"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View last receipt directly
                            </button>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Free User CTA */}
        {!isPremium && (
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-8 rounded-2xl text-center">
                <Zap className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Unlock Premium Features</h3>
                <p className="text-zinc-400 mb-6">Upgrade to access premium features, remove ads, and get priority support.</p>
                <button 
                    onClick={() => navigate('/pricing')}
                    className="bg-amber-500 text-black font-bold py-3 px-6 rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2 mx-auto"
                >
                    View Plans <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        )}
    </div>
  );
}
