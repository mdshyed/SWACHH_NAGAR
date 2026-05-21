import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';
import { useNotifications } from '../../context/NotificationContext';

const STATUS_STYLES = {
  pending:    'bg-red-100 text-red-800 border border-red-200',
  assigned:   'bg-blue-100 text-blue-800 border border-blue-200',
  in_progress:'bg-yellow-100 text-yellow-800 border border-yellow-200',
  resolved:   'bg-green-100 text-green-800 border border-green-200',
  rejected:   'bg-gray-100 text-gray-600 border border-gray-200',
  escalated:  'bg-orange-100 text-orange-700 border border-orange-200',
};

const ALL_STATUSES = ['pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'rejected'];
const STATUS_TRANSITIONS = Object.fromEntries(
  ALL_STATUSES.map((s) => [s, ALL_STATUSES.filter((x) => x !== s)])
);

const ACTION_STYLES = {
  in_progress: 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100',
  resolved: 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100',
  rejected: 'bg-gray-50 text-gray-600 border border-gray-300 hover:bg-gray-100',
};

const ACTION_LABELS = {
  in_progress: 'In Progress',
  resolved: 'Resolve',
  rejected: 'Reject',
};

const DONE_STATUSES = new Set(['resolved', 'rejected']);

const getSLADisplay = (c) => {
  if (!c.slaDeadline || DONE_STATUSES.has(c.status)) return null;
  const diff = new Date(c.slaDeadline) - Date.now();
  if (diff < 0) return { label: 'Overdue', overdue: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { label: `${h}h ${m}m`, overdue: false };
};

const ComplaintsManagePage = () => {
  const { success, error } = useNotifications();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', ward: '' });
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [wards, setWards] = useState([]);

  useEffect(() => {
    api.get('/wards').then((r) => setWards(r.data.data || [])).catch(() => {});
  }, []);

  const fetchComplaints = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15 });
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.ward) params.set('ward', filters.ward);
    if (sortBy === 'urgency') params.set('sort', 'urgency');

    api.get(`/complaints?${params}`)
      .then((r) => { setComplaints(r.data.data.data || []); setPagination(r.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page, sortBy]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    setUpdatingId(complaintId);
    try {
      const res = await api.patch(`/complaints/admin/${complaintId}/status`, { status: newStatus });
      const updated = res.data.data;
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? { ...c, status: updated.status } : c))
      );
      success(`Complaint marked as ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Manage Complaints</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSortBy((s) => (s === 'urgency' ? 'createdAt' : 'urgency')); setPage(1); }}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                sortBy === 'urgency'
                  ? 'bg-orange-50 text-orange-700 border-orange-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {sortBy === 'urgency' ? '🔥 Urgency Sort' : '📅 Sort by Urgency'}
            </button>
            <Link to="/admin" className="btn-secondary text-sm">← Dashboard</Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6 flex flex-wrap gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input w-48" value={filters.category} onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(1); }}>
              <option value="">All</option>
              {['garbage_dumping', 'overflowing_bin', 'road_dirt', 'drainage_overflow', 'dead_animal', 'construction_debris', 'water_logging', 'other'].map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          {wards.length > 0 && (
            <div>
              <label className="label">Ward</label>
              <select className="input w-40" value={filters.ward} onChange={(e) => { setFilters((f) => ({ ...f, ward: e.target.value })); setPage(1); }}>
                <option value="">All wards</option>
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>{w.wardName?.en || `Ward ${w.wardNumber}`}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Status</label>
            <select className="input w-40" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
              <option value="">All</option>
              {['pending', 'assigned', 'in_progress', 'escalated', 'resolved', 'rejected'].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['ID', 'Title', 'Category', 'Reporter', 'Status', 'SLA', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {complaints.map((c) => {
                    const nextStatuses = STATUS_TRANSITIONS[c.status] || [];
                    const isUpdating = updatingId === c._id;
                    const sla = getSLADisplay(c);

                    return (
                      <tr key={c._id} className={`transition-colors ${sla?.overdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.complaintId}</td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate font-medium text-gray-900">{c.title}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize text-xs">{c.category?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{c.isAnonymous ? 'Anonymous' : c.reporter?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                            {c.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {sla ? (
                            <span className={`font-medium ${sla.overdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                              {sla.overdue ? '🔴 Overdue' : `⏱ ${sla.label}`}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isUpdating ? (
                              <Spinner size="sm" />
                            ) : (
                              nextStatuses.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusUpdate(c._id, s)}
                                  disabled={isUpdating}
                                  className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${ACTION_STYLES[s]}`}
                                >
                                  {ACTION_LABELS[s] || s.replace(/_/g, ' ')}
                                </button>
                              ))
                            )}
                            <Link
                              to={`/complaints/${c._id}`}
                              className="text-primary-600 hover:underline text-xs font-medium ml-1"
                            >
                              View →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {complaints.length === 0 && (
                <div className="text-center py-12 text-gray-500">No complaints found</div>
              )}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
                <span>Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => p - 1)} disabled={!pagination.hasPrevPage} className="btn-secondary px-3 py-1.5 text-sm">← Prev</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage} className="btn-secondary px-3 py-1.5 text-sm">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ComplaintsManagePage;
