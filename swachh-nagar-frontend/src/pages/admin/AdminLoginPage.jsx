import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLoginPage = () => {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [banner, setBanner]     = useState('');
  const [shake, setShake]       = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const { login, logout }       = useAuth();
  const navigate                = useNavigate();

  const triggerShake = () => {
    setShake(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setBanner('');
    setLoading(true);
    try {
      const user = await login(form);
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        await logout();
        setBanner('Access denied. This portal is for admins only.');
        triggerShake();
        return;
      }
      navigate('/admin', { replace: true });
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Swachh Nagar Management System</p>
        </div>

        {/* Card */}
        <div
          className={`bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 ${shake ? 'shake' : ''}`}
          onAnimationEnd={() => setShake(false)}
        >
          {/* Banner error (access denied / network) */}
          {banner && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {banner}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email" required autoComplete="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setPwdError(''); }}
                  className={`w-full px-4 py-2.5 rounded-lg bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition pr-10
                    ${pwdError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-emerald-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
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
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{pwdError}</span>
                </div>
              )}

              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in to Admin Panel'}
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <p className="text-slate-500">
            No account yet?{' '}
            <Link to="/admin/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Create admin account
            </Link>
          </p>
          <p className="text-slate-600">
            Not an admin?{' '}
            <Link to="/login" className="text-slate-500 hover:text-slate-400 font-medium">
              Go to user login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
