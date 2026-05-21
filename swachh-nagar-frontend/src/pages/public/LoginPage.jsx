import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

const LoginPage = () => {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [banner, setBanner]     = useState('');
  const [shake, setShake]       = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const from                    = location.state?.from || '/dashboard';

  const triggerShake = () => setShake(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setBanner('');
    setLoading(true);
    try {
      const user = await login(form);
      if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setPwdError('Incorrect password. Please try again.');
      } else if (status === 403) {
        setBanner(err.response?.data?.message || 'Account suspended or deactivated.');
      } else {
        setBanner('Something went wrong. Please try again.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SN</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Swachh Nagar</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Welcome back</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to your account</p>
        </div>

        <div
          className={`card ${shake ? 'shake' : ''}`}
          onAnimationEnd={() => setShake(false)}
        >
          {/* Banner error (suspended / network) */}
          {banner && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {banner}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                type="email" required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setPwdError(''); }}
                  className={`input pr-10 ${pwdError ? '!border-red-400 !ring-red-400 focus:!ring-red-400' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>

              {/* Inline password error */}
              {pwdError && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{pwdError}</span>
                </div>
              )}

              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">Create one</Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center text-sm text-gray-400">
            Are you an admin?{' '}
            <Link to="/admin/login" className="font-medium text-gray-500 hover:text-gray-700">Admin portal →</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
