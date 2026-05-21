import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const STATUS_OPTIONS = ['all', 'pending', 'assigned', 'in_progress', 'resolved', 'rejected'];
const STATUS_STYLES = {
  pending: 'badge-status-pending', assigned: 'badge-status-assigned',
  in_progress: 'badge-status-in_progress', resolved: 'badge-status-resolved', rejected: 'badge-status-rejected'
};

const ComplaintCard = ({ complaint }) => (
  <Link to={`/complaints/${complaint._id}`} className="card hover:shadow-card-hover transition-shadow block">
    <div className="flex items-start gap-4">
      {complaint.images?.[0] ? (
        <img src={complaint.images[0].url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🗑️</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 truncate">{complaint.title}</h3>
          <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[complaint.status]}`}>
            {complaint.status?.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{complaint.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span>#{complaint.complaintId}</span>
          <span>{new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="capitalize">{complaint.category?.replace(/_/g, ' ')}</span>
        </div>
      </div>
    </div>
  </Link>
);

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10 });
    if (status !== 'all') params.set('status', status);

    api.get(`/complaints/mine?${params}`)
      .then((res) => { setComplaints(res.data.data.data || []); setPagination(res.data.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <Link to="/report" className="btn-primary text-sm">+ New Report</Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : complaints.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-semibold text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {status !== 'all' ? `No ${status.replace(/_/g, ' ')} complaints.` : 'Start by reporting your first issue!'}
            </p>
            <Link to="/report" className="btn-primary">Report an Issue</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {complaints.map((c) => <ComplaintCard key={c._id} complaint={c} />)}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrevPage} className="btn-secondary px-3 py-1.5 text-sm">← Prev</button>
                <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="btn-secondary px-3 py-1.5 text-sm">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyComplaintsPage;
