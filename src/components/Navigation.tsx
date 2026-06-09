import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Zap, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navigation() {
  const { user, userData, isPremium, daysRemaining, isTrialActive, daysRemainingInTrial, premiumStatus } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0C0C0E] border-b border-white/10 z-50 px-8 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-yellow-200 rounded-lg flex items-center justify-center font-bold text-black text-sm">P</div>
          <span className="text-xl font-semibold tracking-tight">PREMIUM<span className="text-amber-500">.</span></span>
        </Link>
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link>
          {user && <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>}
        </div>
      </div>

      {/* Auth State */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {/* Status Badge */}
            {isTrialActive ? (
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                <Zap className="w-3 h-3" />
                <span>Trial ({daysRemainingInTrial}d left)</span>
              </div>
            ) : premiumStatus === 'PREMIUM' || premiumStatus === 'CANCELING' ? (
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-500">
                <Zap className="w-3 h-3" />
                <span>{premiumStatus === 'CANCELING' ? 'Ending' : 'Premium'} ({userData?.isLifetime ? 'Life' : `${daysRemaining}d`})</span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white">
                <span>Free Tier</span>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xs font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0C0C0E] border border-white/10 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-zinc-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/pricing"
                    className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                  >
                    Plans
                  </Link>
                  <hr className="border-white/10" />
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-4 text-sm font-medium">
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">Log in</Link>
            <Link 
              to="/login" 
              className="px-4 py-2 bg-white text-black font-bold rounded-md text-xs hover:bg-zinc-200 transition-colors shadow-sm"
            >
              UPGRADE
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
