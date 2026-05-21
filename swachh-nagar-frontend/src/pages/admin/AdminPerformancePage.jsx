import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell,
} from 'recharts';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const PALETTE = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const grade = (rate) => {
  if (rate >= 80) return { label: 'A', color: 'text-green-600 bg-green-50 border-green-200' };
  if (rate >= 60) return { label: 'B', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (rate >= 40) return { label: 'C', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
  return { label: 'D', color: 'text-red-600 bg-red-50 border-red-200' };
};

const AdminPerformancePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/admin-performance')
      .then((r) => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resolvedChart = data.map((d, i) => ({
    name: d.name?.split(' ')[0] || `Admin ${i + 1}`,
    resolved: d.resolved,
    total: d.total,
    fill: PALETTE[i % PALETTE.length],
  }));

  const avgHours = data.filter((d) => d.avgResolutionHours != null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Performance</h1>
            <p className="text-sm text-gray-500 mt-0.5">Resolution rates, SLA compliance, and handling metrics per admin</p>
          </div>
          <Link to="/admin" className="btn-secondary text-sm">← Dashboard</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : data.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-medium">No performance data yet.</p>
            <p className="text-sm mt-1">Assign complaints to admins to see their stats here.</p>
          </div>
        ) : (
          <>
            {/* Leaderboard table */}
            <div className="card overflow-hidden p-0 mb-6">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Admin Leaderboard</h2>
                <span className="text-xs text-gray-400">{data.length} admin{data.length !== 1 ? 's' : ''} tracked</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Rank', 'Admin', 'Total Handled', 'Resolved', 'Resolution Rate', 'Avg Resolution', 'Overdue', 'Grade'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((row, i) => {
                      const g = grade(row.resolutionRate);
                      return (
                        <tr key={row.adminId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{row.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{row.email}</p>
                          </td>
                          <td className="px-4 py-3 font-medium">{row.total}</td>
                          <td className="px-4 py-3 text-green-600 font-medium">{row.resolved}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(row.resolutionRate, 100)}%` }} />
                              </div>
                              <span className="text-xs font-medium">{Math.round(row.resolutionRate)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {row.avgResolutionHours != null ? `${row.avgResolutionHours}h` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {row.overdue > 0 ? (
                              <span className="text-red-600 font-bold text-xs">{row.overdue} 🔴</span>
                            ) : (
                              <span className="text-green-600 text-xs font-medium">0 ✅</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${g.color}`}>
                              {g.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Resolved vs Total bar chart */}
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Resolved vs Total per Admin</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={resolvedChart} margin={{ left: -10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" radius={[4, 4, 0, 0]}>
                      {resolvedChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Avg resolution time bar */}
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Avg Resolution Time (hours)</h2>
                {avgHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={avgHours.map((d, i) => ({
                        name: d.name?.split(' ')[0] || `Admin ${i + 1}`,
                        hours: d.avgResolutionHours,
                        fill: PALETTE[i % PALETTE.length],
                      }))}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} unit="h" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip formatter={(v) => [`${v}h`, 'Avg time']} />
                      <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                        {avgHours.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-16 text-sm">No resolved complaints with timestamps yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPerformancePage;
