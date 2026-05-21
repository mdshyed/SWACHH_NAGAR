import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899'];

const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byWard, setByWard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/trends?days=30'),
      api.get('/analytics/by-category'),
      api.get('/analytics/by-ward'),
    ]).then(([ov, tr, cat, ward]) => {
      setOverview(ov.data.data);
      setTrends(tr.data.data);
      setByCategory(cat.data.data);
      setByWard(ward.data.data.slice(0, 10));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center py-16"><Spinner size="xl" /></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

        {/* KPIs */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: overview?.total || 0 },
            { label: 'Resolved', value: overview?.resolved || 0 },
            { label: 'Pending', value: overview?.pending || 0 },
            { label: 'In Progress', value: overview?.inProgress || 0 },
            { label: 'Rejected', value: overview?.rejected || 0 },
            { label: 'Resolution %', value: `${overview?.resolutionRate || 0}%` },
          ].map((kpi) => (
            <div key={kpi.label} className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Daily Trend (30 days)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} name="Complaints" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCategory} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n?.replace(/_/g, ' ')]} />
                <Legend formatter={(v) => v.replace(/_/g, ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward breakdown */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top Wards by Complaint Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byWard} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="ward.wardName.en" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" />
              <Bar dataKey="resolved" fill="#22c55e" radius={[0, 4, 4, 0]} name="Resolved" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
