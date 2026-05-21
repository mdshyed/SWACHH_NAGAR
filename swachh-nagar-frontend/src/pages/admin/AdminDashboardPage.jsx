import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];

const KPICard = ({ label, value, icon, color, sub }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-3">
      <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color}`}>{icon}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500 mt-1">{label}</div>
    {sub && <div className="text-xs text-primary-600 mt-1">{sub}</div>}
  </div>
);

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/trends?days=14'),
      api.get('/analytics/by-category'),
    ]).then(([ov, tr, cat]) => {
      setOverview(ov.data.data);
      setTrends(tr.data.data);
      setByCategory(cat.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center items-center h-64"><Spinner size="xl" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Platform overview and analytics</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/admin/complaints" className="btn-primary text-sm">Manage Complaints</Link>
            <Link to="/admin/analytics" className="btn-secondary text-sm">Full Analytics</Link>
            <button
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  const res = await api.get('/reports/download', { responseType: 'blob' });
                  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `swachh-nagar-report-${Date.now()}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  alert('Failed to download report. Please try again.');
                } finally {
                  setDownloading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? <Spinner size="sm" /> : '📄'} {downloading ? 'Generating...' : 'Download Report'}
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard label="Total Complaints" value={overview?.total || 0} icon="📋" color="bg-blue-100" />
          <KPICard label="Resolved" value={overview?.resolved || 0} icon="✅" color="bg-green-100" sub={`${overview?.resolutionRate}% rate`} />
          <KPICard label="Pending" value={overview?.pending || 0} icon="⏳" color="bg-amber-100" />
          <KPICard label="In Progress" value={overview?.inProgress || 0} icon="⚙️" color="bg-purple-100" />
          <KPICard label="Active Users" value={overview?.totalUsers || 0} icon="👥" color="bg-primary-100" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Trend Chart */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Complaints Trend (14 days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} name="Complaints" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Donut */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byCategory} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name?.replace(/_/g, ' ')]} />
                <Legend formatter={(val) => val.replace(/_/g, ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Manage Complaints', desc: 'Review and update complaint statuses', link: '/admin/complaints', icon: '📋' },
            { title: 'Manage Users', desc: 'Promote admins and manage accounts', link: '/admin/users', icon: '👥' },
            { title: 'Analytics', desc: 'Deep dive into performance metrics', link: '/admin/analytics', icon: '📊' },
            { title: 'Admin Performance', desc: 'Resolution rates and SLA compliance per admin', link: '/admin/performance', icon: '🏆' },
            { title: 'Map View', desc: 'See all complaints on the city map', link: '/map', icon: '🗺️' },
          ].map((item) => (
            <Link key={item.link} to={item.link} className="card hover:shadow-card-hover transition-shadow">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
