import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t, toggleLanguage, locale } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const navLinks = isAuthenticated
    ? isAdmin
      ? [
          { to: '/admin', label: 'Dashboard' },
          { to: '/admin/complaints', label: 'Complaints' },
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/analytics', label: 'Analytics' },
          { to: '/map', label: t('nav.map') },
        ]
      : [
          { to: '/dashboard', label: t('nav.home') },
          { to: '/complaints', label: t('nav.complaints') },
          { to: '/map', label: t('nav.map') },
          { to: '/leaderboard', label: t('nav.leaderboard') },
          { to: '/schedule', label: t('nav.schedule') },
        ]
    : [
        { to: '/transparency', label: '📊 City Stats' },
        { to: '/schedule', label: t('nav.schedule') },
      ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SN</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">Swachh Nagar</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
            >
              {locale === 'en' ? 'हिंदी' : 'EN'}
            </button>

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {!isAdmin && (
                  <Link to="/report" className="btn-primary text-sm px-3 py-1.5 hidden sm:inline-flex">
                    + Report
                  </Link>
                )}

                <div className="relative group">
                  <Link to="/profile" className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100">
                    <div className="relative">
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                      {isAdmin && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" title="Admin" />
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col leading-tight">
                      <span className="text-xs font-medium text-gray-800 max-w-[80px] truncate">{user?.name?.split(' ')[0]}</span>
                      <span className={`text-xs font-semibold ${isAdmin ? 'text-green-600' : 'text-gray-400'}`}>
                        {isAdmin ? 'Admin' : 'Citizen'}
                      </span>
                    </div>
                  </Link>
                </div>

                <button onClick={handleLogout} className="hidden sm:flex btn-secondary text-sm px-3 py-1.5">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-3 py-1.5">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm px-3 py-1.5">{t('nav.register')}</Link>
              </>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                {t('nav.logout')}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
