import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate password
  const isValidPassword = (pass: string) => {
    if (isLogin) return pass.length >= 6;
    // For signup: min 8 chars, at least one uppercase, one lowercase, one number
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /\d/.test(pass);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        // If popup blocked, attempt redirect fallback
        if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
      showToast('Welcome! Signed in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      // Provide clearer guidance for unauthorized domain in production
      if (err?.code === 'auth/unauthorized-domain') {
        setError('Google sign-in blocked: your production domain is not authorized in Firebase Auth. Add your domain (e.g. videototextservices.vercel.app) to Authorized domains in the Firebase Console.');
        showToast('Google sign-in blocked: unauthorized domain. Check Firebase Console.', 'error');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      if (isLogin) {
        setError('Password must be at least 6 characters');
      } else {
        setError('Password must be at least 8 characters with uppercase, lowercase, and number');
      }
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back! Signed in successfully', 'success');
        navigate('/dashboard');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created successfully! Welcome aboard.', 'success');

        // Attempt to mark email as verified on the server using Firebase Admin
        try {
          const token = await cred.user.getIdToken(true);
          await fetch('/api/mark-email-verified', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
        } catch (markErr) {
          console.warn('Could not mark email verified on server:', markErr);
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMap: { [key: string]: string } = {
        'auth/operation-not-allowed': 'Email/Password auth is not enabled. Please contact support.',
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Incorrect email or password. Please try again.',
        'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      };
      
      setError(errorMap[err.code] || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      showToast('Password reset email sent! Check your inbox.', 'success');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      const errorMap: { [key: string]: string } = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-not-found': 'No account found with this email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(errorMap[err.code] || err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="flex items-center justify-center flex-1 bg-[#09090B] px-4 py-8">
        <div className="w-full max-w-md bg-[#0C0C0E] p-8 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold text-center mb-2 text-white">Reset Password</h2>
          <p className="text-center text-zinc-400 text-sm mb-8">Enter your email to receive a password reset link.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Email</label>
              <input 
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="you@example.com"
                disabled={resetLoading}
              />
            </div>
            <button 
              type="submit"
              disabled={resetLoading}
              className="w-full bg-amber-500 text-black font-bold py-3 px-4 rounded-lg text-sm hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>

          <button 
            onClick={() => { setShowForgotPassword(false); setError(null); setResetEmail(''); }}
            className="w-full mt-4 bg-zinc-900 border border-white/10 text-white font-semibold py-3 px-4 rounded-lg text-sm hover:bg-zinc-800 transition-colors"
            disabled={resetLoading}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center flex-1 bg-[#09090B] px-4 py-8">
      <div className="w-full max-w-md bg-[#0C0C0E] p-8 rounded-2xl border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-semibold text-center mb-2 text-white">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="text-center text-zinc-400 text-sm mb-8">
          {isLogin ? 'Sign in to manage your PREMIUM account.' : 'Sign up and get instant access to Premium.'}
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-400">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors pr-10"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-zinc-500 mt-1">Min 8 chars, uppercase, lowercase, number</p>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-black font-bold py-3 px-4 rounded-lg text-sm hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0C0C0E] px-2 text-zinc-500 font-semibold tracking-wider uppercase">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors text-white font-semibold text-sm py-3 px-4 rounded-lg disabled:opacity-50 mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google Logo" />
          Google
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-amber-500 hover:text-amber-400 font-semibold transition-colors bg-transparent border-none p-0 cursor-pointer"
            type="button"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
