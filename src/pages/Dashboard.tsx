import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Settings, CreditCard, LogOut, Receipt, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { updateDoc, doc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { formatDate, formatCurrency, checkPremiumStatus } from '../lib/utils';
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
  
  const premiumStatus = userData?.premiumStatus || 'FREE';
  const isPremiumTrial = premiumStatus === 'PREMIUM_TRIAL';

  useEffect(() => {
     if (searchParams.get('success') === 'true' && user) {
         if (searchParams.get('mock') === 'true') {
             showToast("Mock checkout successful! Upgrading to PREMIUM_TRIAL mode for this preview.", 'success');
         }
         updateDoc(doc(db, 'users', user.uid), { premiumStatus: 'PREMIUM_TRIAL' })
           .then(() => {
             showToast('Premium trial activated!', 'success');
           })
          .catch((err: any) => {
              console.error(err);
              showToast('Failed to activate premium trial', 'error');
          });
         window.history.replaceState({}, '', '/dashboard');
     }
     if (searchParams.get('mockCancel') === 'true' && user) {
         showToast("Mock cancel successful! Downgrading to FREE mode.", 'info');
         updateDoc(doc(db, 'users', user.uid), { premiumStatus: 'FREE' })
           .catch(console.error);
         window.history.replaceState({}, '', '/dashboard');
     }
  }, [searchParams, user]);

  useEffect(() => {
    if (user) {
      loadPaymentHistory();
    }
  }, [user]);

  const loadPaymentHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const history = [];
      
      if (userData?.lastPaymentDate && userData?.lastPaymentAmount) {
        history.push({
          date: userData.lastPaymentDate,
          amount: userData.lastPaymentAmount,
          type: 'Payment',
          receiptUrl: userData.lastReceiptUrl,
        });
      }
      
      if (premiumStatus !== 'FREE' && history.length === 0) {
        history.push({
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          amount: premiumStatus === 'PREMIUM_TRIAL' ? 0 : 999,
          type: premiumStatus === 'PREMIUM_TRIAL' ? 'Trial Start' : 'Payment',
          receiptUrl: null,
        });
      }
      
      setPaymentHistory(history);
      } catch (err: any) {
        console.error('Failed to load payment history:', err);
        showToast('Failed to load payment history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Premium status refreshed', 'success');
    } catch (err: any) {
      console.error('Failed to refresh status:', err);
      showToast('Failed to refresh status', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageBilling = async () => {
      setLoading(true);
      try {
          if (!userData?.stripeCustomerId) {
              showToast("No active Stripe subscription found", 'warning');
              setLoading(false);
              return;
          }

          const res = await fetch('/api/create-portal-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerId: userData.stripeCustomerId })
          });
          const data = await res.json();
          if (data.url) {
              const newWindow = window.open(data.url, '_blank');
              if (!newWindow) {
                 setPortalUrl(data.url);
              }
          } else {
              throw new Error("Failed to load billing portal");
          }
      } catch (err: any) {
          console.error(err);
          showToast(err.message || 'Failed to load billing portal', 'error');
      } finally {
          setLoading(false);
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
            <p className="text-zinc-400">Welcome back, {user?.email}</p>
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
                    {premiumStatus === 'PREMIUM_TRIAL' && (
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-500 font-semibold">Free Trial Active</span>
                            <span className="text-zinc-400 text-sm">({daysRemaining} days remaining)</span>
                        </div>
                    )}
                    {premiumStatus === 'PREMIUM' && (
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-500" />
                            <span className="text-green-500 font-semibold">Premium Active</span>
                            <span className="text-zinc-400 text-sm">({daysRemaining} days remaining)</span>
                        </div>
                    )}
                    {premiumStatus === 'FREE' && (
                        <span className="text-zinc-400">You are on the FREE tier</span>
                    )}
                </div>
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border ${
                  premiumStatus === 'PREMIUM_TRIAL' 
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : premiumStatus === 'PREMIUM'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-white/10'
                }`}>
                    <span>{premiumStatus === 'PREMIUM_TRIAL' ? 'TRIAL' : premiumStatus === 'PREMIUM' ? 'ACTIVE' : 'FREE'}</span>
                </div>
            </div>

            <hr className="border-white/10" />

            {/* Subscription Details */}
            {isPremium && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-zinc-500 text-sm mb-1">Subscription Type</p>
                        <p className="text-white font-semibold capitalize">{userData?.subscriptionType?.toLowerCase()}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-sm mb-1">Next Payment Date</p>
                        <p className="text-white font-semibold">{formatDate(userData?.premiumEndDate)}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-sm mb-1">Last Payment</p>
                        <p className="text-white font-semibold">{userData?.lastPaymentAmount ? formatCurrency(userData.lastPaymentAmount / 100, 'USD') : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-sm mb-1">Started On</p>
                        <p className="text-white font-semibold">{formatDate(userData?.premiumStartDate)}</p>
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
                                        {payment.type === 'Trial Start' ? (
                                            <Zap className="w-5 h-5 text-amber-500" />
                                        ) : (
                                            <CreditCard className="w-5 h-5 text-amber-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{payment.type}</p>
                                        <p className="text-zinc-400 text-sm">{formatDate(payment.date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency(payment.amount / 100, 'USD')}</p>
                                    {payment.receiptUrl && (
                                        <button 
                                            onClick={() => window.open(payment.receiptUrl, '_blank')}
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
                    <p className="text-zinc-400 text-center py-8">No payment history available</p>
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
