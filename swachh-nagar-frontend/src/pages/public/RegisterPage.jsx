import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const getStrength = (pwd) => {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};

const strengthMeta = [
  null,
  { label: 'Weak',        bar: 'bg-red-500',    text: 'text-red-500'    },
  { label: 'Fair',        bar: 'bg-orange-400',  text: 'text-orange-500' },
  { label: 'Good',        bar: 'bg-yellow-400',  text: 'text-yellow-600' },
  { label: 'Strong',      bar: 'bg-emerald-400', text: 'text-emerald-600'},
  { label: 'Very Strong', bar: 'bg-emerald-500', text: 'text-emerald-600'},
];

const requirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const RegisterPage = () => {
  const [tab, setTab]                 = useState('citizen');
  const [form, setForm]               = useState({ name: '', email: '', password: '', confirmPassword: '', adminCode: '' });
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCode, setShowCode]       = useState(false);
  const [error, setError]             = useState('');
  const [touched, setTouched]         = useState({});
  const { register, logout }          = useAuth();
  const navigate                      = useNavigate();

  const isAdmin = tab === 'admin';

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setTouched({});
  };

  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const strength        = getStrength(form.password);
  const meta            = strengthMeta[strength];
  const pwdTooShort     = form.password.length > 0 && form.password.length < 8;
  const noMatch         = form.confirmPassword.length > 0 && form.confirmPassword !== form.password;
  const confirmMatches  = form.confirmPassword.length > 0 && form.confirmPassword === form.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fields = { name: true, email: true, password: true, confirmPassword: true };
    if (isAdmin) fields.adminCode = true;
    setTouched(fields);
    if (form.password.length < 8 || noMatch) return;
    if (isAdmin && !form.adminCode) return;
    setError('');
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password };
      if (isAdmin) payload.adminCode = form.adminCode;
      const user = await register(payload);
      if (isAdmin) {
        if (user?.role !== 'admin' && user?.role !== 'super_admin') {
          await logout();
          setError('Invalid admin invite code. Please check the code and try again.');
          return;
        }
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:bg-primary-700 transition-colors">
              <span className="text-white font-bold text-sm">SN</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Swachh Nagar</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Create your account</h1>
          <p className="text-gray-600 text-sm mt-1">
            {isAdmin ? 'Register as a Swachh Nagar administrator' : 'Join thousands of citizens making a difference'}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => switchTab('citizen')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'citizen'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Citizen
          </button>
          <button
            type="button"
            onClick={() => switchTab('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'admin'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Admin
          </button>
        </div>

        <div className="card">

          {/* API error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <input
                type="text" required placeholder="Rahul Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={touch('name')}
                className={`input ${touched.name && !form.name ? '!border-red-400 focus:!ring-red-400' : ''}`}
              />
              {touched.name && !form.name && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Full name is required.
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" required placeholder="rahul@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={touch('email')}
                className="input"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onBlur={touch('password')}
                  className={`input pr-10 ${touched.password && pwdTooShort ? '!border-red-400 focus:!ring-red-400' : ''}`}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Password strength</span>
                    {meta && <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>}
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? meta?.bar : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {requirements.map(({ label, test }) => {
                      const met = test(form.password);
                      return (
                        <li key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {met
                            ? <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
                            : <svg className="w-3.5 h-3.5 shrink-0 opacity-30" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>
                          }
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} required
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  onBlur={touch('confirmPassword')}
                  className={`input pr-10 ${noMatch ? '!border-red-400 focus:!ring-red-400' : confirmMatches ? '!border-emerald-400 focus:!ring-emerald-400' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {noMatch && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  Passwords do not match.
                </p>
              )}
              {confirmMatches && (
                <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd"/></svg>
                  Passwords match.
                </p>
              )}
            </div>

            {/* Admin invite code */}
            {isAdmin && (
              <div>
                <label className="label">Admin Invite Code</label>
                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    required={isAdmin}
                    placeholder="Enter the admin invite code"
                    value={form.adminCode}
                    onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
                    onBlur={touch('adminCode')}
                    className={`input pr-10 ${touched.adminCode && !form.adminCode ? '!border-red-400 focus:!ring-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowCode((v) => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showCode ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.adminCode && !form.adminCode && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    Invite code is required.
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-400">Required to create an admin account.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pwdTooShort || noMatch || (isAdmin && !form.adminCode)}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : isAdmin ? 'Create Admin Account' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to={isAdmin ? '/admin/login' : '/login'}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
