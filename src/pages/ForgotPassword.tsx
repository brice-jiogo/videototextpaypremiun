import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { showToast } from '../components/Toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setSuccess(true);
      showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (err: any) {
      const errorMap: { [key: string]: string } = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-not-found': 'No account found with this email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(errorMap[err.code] || err.message || 'Failed to send reset email');
      showToast(errorMap[err.code] || 'Failed to send reset email', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center flex-1 bg-[#09090B] px-4 py-8">
        <div className="w-full max-w-md bg-[#0C0C0E] p-8 rounded-2xl border border-white/10 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Check Your Email</h2>
          <p className="text-zinc-400 mb-8">
            We've sent a password reset link to<br />
            <span className="text-amber-500">{email}</span>
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-amber-500 text-black font-bold py-3 px-4 rounded-lg text-sm hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
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
        <h2 className="text-2xl font-semibold text-center mb-2 text-white">Reset Password</h2>
        <p className="text-center text-zinc-400 text-sm mb-8">
          Enter your email to receive a password reset link.
        </p>

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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-black font-bold py-3 px-4 rounded-lg text-sm hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="w-full mt-4 bg-zinc-900 border border-white/10 text-white font-semibold py-3 px-4 rounded-lg text-sm hover:bg-zinc-800 transition-colors"
          disabled={loading}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
