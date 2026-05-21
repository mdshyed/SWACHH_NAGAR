import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];
const strengthText  = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400', 'text-emerald-400'];

const requirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const inputBase = 'w-full px-4 py-2.5 rounded-lg bg-slate-700 border text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition';

const AdminRegisterPage = () => {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '', adminCode: '' });
  const [touched, setTouched]   = useState({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [showCode, setShowCode] = useState(false);
  const { register, logout }  = useAuth();
  const navigate              = useNavigate();

  const set   = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const touch = (field) => ()  => setTouched((t) => ({ ...t, [field]: true }));

  const pwdStrength   = getStrength(form.password);
  const pwdTooShort   = form.password.length > 0 && form.password.length < 8;
  const confirmNoMatch = form.confirm.length > 0 && form.confirm !== form.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirm: true, adminCode: true });

    if (form.password.length < 8) return;
    if (form.password !== form.confirm) return;

    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, adminCode: form.adminCode });
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        await logout();
        setError('Invalid admin invite code. Please check the code and try again.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 className="text-2xl font-bold text-white">Create Admin Account</h1>
          <p className="text-slate-400 text-sm mt-1">Swachh Nagar Management System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">

          {/* API error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
              <input
                type="text" required placeholder="Your full name"
                value={form.name} onChange={set('name')} onBlur={touch('name')}
                className={`${inputBase} ${touched.name && !form.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-emerald-500'}`}
              />
              {touched.name && !form.name && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Full name is required.
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email" required placeholder="admin@example.com"
                value={form.email} onChange={set('email')} onBlur={touch('email')}
                className={`${inputBase} ${touched.email && !form.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-emerald-500'}`}
              />
              <p className="mt-1.5 text-xs text-slate-500">This will be your admin account email.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required placeholder="Min. 8 characters"
                  value={form.password} onChange={set('password')} onBlur={touch('password')}
                  className={`${inputBase} pr-10 ${touched.password && pwdTooShort ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-emerald-500'}`}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPwd
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>

              {/* Strength bar — shown once user starts typing */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwdStrength ? strengthColor[pwdStrength] : 'bg-slate-600'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthText[pwdStrength]}`}>{strengthLabel[pwdStrength]}</p>
                </div>
              )}

              {/* Inline error */}
              {touched.password && pwdTooShort && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Password must be at least 8 characters.
                </p>
              )}

              {/* Requirements checklist — shown while typing */}
              {form.password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {requirements.map(({ label, test }) => {
                    const met = test(form.password);
                    return (
                      <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {met
                          ? <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
                          : <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" className="opacity-30"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/></svg>
                        }
                        {label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showCfm ? 'text' : 'password'} required placeholder="Re-enter your password"
                  value={form.confirm} onChange={set('confirm')} onBlur={touch('confirm')}
                  className={`${inputBase} pr-10 ${confirmNoMatch ? 'border-red-500 focus:ring-red-500' : form.confirm && form.confirm === form.password ? 'border-emerald-500 focus:ring-emerald-500' : 'border-slate-600 focus:ring-emerald-500'}`}
                />
                <button type="button" onClick={() => setShowCfm((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showCfm
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {confirmNoMatch && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Passwords do not match.
                </p>
              )}
              {form.confirm && form.confirm === form.password && (
                <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
                  Passwords match.
                </p>
              )}
            </div>

            {/* Admin invite code */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin invite code</label>
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'} required placeholder="Enter the admin invite code"
                  value={form.adminCode} onChange={set('adminCode')} onBlur={touch('adminCode')}
                  className={`${inputBase} pr-10 ${touched.adminCode && !form.adminCode ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-emerald-500'}`}
                />
                <button type="button" onClick={() => setShowCode((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showCode
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {touched.adminCode && !form.adminCode && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Invite code is required.
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-500">Required to create an admin account.</p>
            </div>

            <button
              type="submit"
              disabled={loading || pwdTooShort || confirmNoMatch}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </>
              ) : 'Create Admin Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/admin/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
