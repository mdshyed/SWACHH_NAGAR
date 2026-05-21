import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const STATUS_PALETTE = {
  pending:    '#ef4444',
  in_progress:'#f59e0b',
  escalated:  '#f97316',
  resolved:   '#22c55e',
  rejected:   '#6b7280',
};

const CATEGORY_PALETTE = ['#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444'];

const StatCard = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const PublicDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/public')
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner size="xl" />
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Failed to load statistics.</p>
    </div>
  );

  const statusPieData = [
    { name: 'Pending',     value: stats.pending,    color: STATUS_PALETTE.pending },
    { name: 'In Progress', value: stats.inProgress, color: STATUS_PALETTE.in_progress },
    { name: 'Escalated',   value: stats.escalated,  color: STATUS_PALETTE.escalated },
    { name: 'Resolved',    value: stats.resolved,   color: STATUS_PALETTE.resolved },
  ].filter((d) => d.value > 0);

  const categoryData = (stats.byCategory || []).map((c, i) => ({
    name: c._id.replace(/_/g, ' '),
    count: c.count,
    fill: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏙️</span>
            <span className="font-bold text-gray-900 text-lg">Swachh Nagar</span>
            <span className="hidden sm:inline text-sm text-gray-400 ml-2">· Public Transparency Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
            <Link to="/register" className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors">Report Issue</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">City Cleanliness Report</h1>
          <p className="text-gray-500 text-sm">Live civic data — updated in real time. No account needed.</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Complaints" value={stats.total} />
          <StatCard label="Resolved" value={stats.resolved} color="text-green-600" sub={`${stats.resolutionRate}% resolution rate`} />
          <StatCard label="Pending" value={stats.pending} color="text-red-500" />
          <StatCard label="In Progress" value={stats.inProgress} color="text-yellow-600" />
          <StatCard label="Escalated" value={stats.escalated} color="text-orange-500" sub="SLA breached" />
        </div>

        {/* Resolution rate bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900">Overall Resolution Rate</p>
            <span className={`text-lg font-bold ${stats.resolutionRate >= 70 ? 'text-green-600' : stats.resolutionRate >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
              {stats.resolutionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${stats.resolutionRate}%`,
                background: stats.resolutionRate >= 70 ? '#22c55e' : stats.resolutionRate >= 40 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.resolved} resolved out of {stats.total} total complaints</p>
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Complaint status pie */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Complaints by Status</h2>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Complaints']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-10">No data yet</p>
            )}
          </div>

          {/* Complaints by category bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Top Issue Categories</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v) => [v, 'Complaints']} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-10">No data yet</p>
            )}
          </div>
        </div>

        {/* Ward tables */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Most problematic areas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">⚠️ Most Problematic Areas</h2>
            <p className="text-xs text-gray-400 mb-4">Wards with highest unresolved complaints</p>
            {stats.topProblematic?.length > 0 ? (
              <div className="space-y-3">
                {stats.topProblematic.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{w.wardName}</span>
                    <span className="text-sm font-bold text-red-500">{w.unresolved} unresolved</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No ward data available yet</p>
            )}
          </div>

          {/* Cleanest areas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-1">✅ Cleanest Areas</h2>
            <p className="text-xs text-gray-400 mb-4">Wards with best resolution rate (min 3 complaints)</p>
            {stats.topClean?.length > 0 ? (
              <div className="space-y-3">
                {stats.topClean.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{w.wardName}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${w.rate}%` }} />
                      </div>
                      <span className="text-sm font-bold text-green-600">{w.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No ward data available yet</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">See an issue in your area?</h3>
          <p className="text-primary-100 text-sm mb-4">Report it in under 2 minutes. Your complaint gets tracked publicly.</p>
          <Link to="/register" className="inline-block bg-white text-primary-700 font-semibold px-6 py-2 rounded-xl hover:bg-primary-50 transition-colors text-sm">
            Report an Issue →
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Data refreshes on page load · Swachh Nagar Civic Platform
        </p>
      </div>
    </div>
  );
};

export default PublicDashboardPage;
