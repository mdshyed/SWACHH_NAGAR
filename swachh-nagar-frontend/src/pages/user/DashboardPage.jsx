import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const StatCard = ({ label, value, icon, color }) => (
  <div className={`card flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'badge-status-pending',
    assigned: 'badge-status-assigned',
    in_progress: 'badge-status-in_progress',
    resolved: 'badge-status-resolved',
    rejected: 'badge-status-rejected',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/complaints/mine?limit=5');
        const data = res.data.data;
        setComplaints(data.data || []);
        const all = data.pagination?.total || 0;
        const resolved = (data.data || []).filter(c => c.status === 'resolved').length;
        const pending = (data.data || []).filter(c => c.status === 'pending').length;
        setStats({ total: all, resolved, pending });
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Here's what's happening with your reports</p>
          </div>
          <Link to="/report" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Report
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label={t('dashboard.total_complaints')} value={stats.total} icon="📋" color="bg-blue-100" />
          <StatCard label={t('dashboard.resolved')} value={stats.resolved} icon="✅" color="bg-green-100" />
          <StatCard label={t('dashboard.pending')} value={stats.pending} icon="⏳" color="bg-amber-100" />
          <StatCard label={t('dashboard.points')} value={user?.points || 0} icon="⭐" color="bg-purple-100" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Complaints */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t('dashboard.recent_activity')}</h2>
              <Link to="/complaints" className="text-sm text-primary-600 hover:underline">View all →</Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500 text-sm">No complaints yet. Be the change!</p>
                <Link to="/report" className="btn-primary mt-4 text-sm">Report First Issue</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((c) => (
                  <Link key={c._id} to={`/complaints/${c._id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🗑️</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.quick_report')}</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Garbage', icon: '🗑️', cat: 'garbage_dumping' },
                  { label: 'Overflowing Bin', icon: '♻️', cat: 'overflowing_bin' },
                  { label: 'Road Dirt', icon: '🚧', cat: 'road_dirt' },
                  { label: 'Drainage', icon: '💧', cat: 'drainage_overflow' },
                ].map((item) => (
                  <Link key={item.cat} to={`/report?category=${item.cat}`}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-center">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">⭐</div>
                <div>
                  <div className="text-2xl font-bold">{user?.points || 0}</div>
                  <div className="text-primary-100 text-sm">Total Points</div>
                </div>
              </div>
              <Link to="/leaderboard" className="text-sm text-primary-100 hover:text-white underline">View Leaderboard →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
