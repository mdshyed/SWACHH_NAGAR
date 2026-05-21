import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';
import SLATimer from '../../components/common/SLATimer';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending:    'bg-red-100 text-red-800 border border-red-200',
  assigned:   'bg-blue-100 text-blue-800 border border-blue-200',
  in_progress:'bg-yellow-100 text-yellow-800 border border-yellow-200',
  resolved:   'bg-green-100 text-green-800 border border-green-200',
  rejected:   'bg-gray-100 text-gray-600 border border-gray-200',
  escalated:  'bg-orange-100 text-orange-700 border border-orange-200',
};

const STATUS_ICONS = { pending: '⏳', assigned: '👤', in_progress: '⚙️', resolved: '✅', rejected: '❌', escalated: '🚨' };

const VALID_TRANSITIONS = {
  pending:    ['assigned', 'in_progress', 'resolved', 'rejected'],
  assigned:   ['in_progress', 'resolved', 'rejected'],
  in_progress:['resolved', 'rejected'],
  escalated:  ['in_progress', 'resolved', 'rejected'],
  resolved:   [],
  rejected:   [],
};

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const { success, error } = useNotifications();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [afterImageFile, setAfterImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    api.get(`/complaints/${id}`).then((r) => setComplaint(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/complaints/admin/${id}/status`, { status: newStatus, comment });
      const refreshed = await api.get(`/complaints/${id}`);
      setComplaint(refreshed.data.data);
      success('Status updated successfully');
      setNewStatus(''); setComment('');
    } catch (err) {
      error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const handleVote = async (voteType) => {
    try {
      const res = await api.post(`/complaints/${id}/vote`, { voteType });
      const { upvoteCount, downvoteCount, userVote, isSuspicious, priority } = res.data.data;
      setComplaint((c) => ({
        ...c,
        upvoteCount,
        downvoteCount,
        isSuspicious,
        priority,
        upvotes: userVote === 'up' ? [user?._id] : [],
        downvotes: userVote === 'down' ? [user?._id] : [],
      }));
    } catch {}
  };

  const handleReopen = async () => {
    if (!window.confirm('Reopen this complaint? It will return to pending status for re-investigation.')) return;
    setUpdating(true);
    try {
      await api.post(`/complaints/${id}/reopen`);
      const refreshed = await api.get(`/complaints/${id}`);
      setComplaint(refreshed.data.data);
      success('Complaint reopened — back to pending');
    } catch (err) {
      error(err.response?.data?.message || 'Could not reopen complaint');
    } finally { setUpdating(false); }
  };

  const handleAfterImageUpload = async () => {
    if (!afterImageFile) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('image', afterImageFile);
      const res = await api.post(`/complaints/admin/${id}/after-image`, form);
      const newImg = res.data.data;
      setComplaint((c) => ({
        ...c,
        images: [...(c.images?.filter((img) => img.type !== 'after') || []), newImg],
      }));
      success('After image uploaded');
      setAfterImageFile(null);
    } catch (err) {
      error(err.response?.data?.message || 'Upload failed');
    } finally { setUploadingImage(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-16"><Spinner size="xl" /></div>
    </div>
  );
  if (!complaint) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="text-center py-16">
        <p className="text-gray-500">Complaint not found.</p>
        <Link to="/complaints" className="btn-primary mt-4 inline-block">Go Back</Link>
      </div>
    </div>
  );

  const beforeImages = complaint.images?.filter((img) => img.type !== 'after') || [];
  const afterImages = complaint.images?.filter((img) => img.type === 'after') || [];
  const uid = user?._id;
  const userUpvoted = complaint.upvotes?.some((v) => v === uid || v?.toString() === uid);
  const userDownvoted = complaint.downvotes?.some((v) => v === uid || v?.toString() === uid);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/complaints" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6">← Back to Complaints</Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs text-gray-500 font-mono">#{complaint.complaintId}</span>
                  <h1 className="text-xl font-bold text-gray-900 mt-1">{complaint.title}</h1>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[complaint.status]}`}>
                  {STATUS_ICONS[complaint.status]} {complaint.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {complaint.slaDeadline && (
                <div className="mb-3">
                  <SLATimer deadline={complaint.slaDeadline} status={complaint.status} />
                </div>
              )}

              <p className="text-gray-600 text-sm leading-relaxed">{complaint.description}</p>

              {complaint.status === 'escalated' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 font-medium">
                  🚨 This complaint was automatically escalated because it exceeded the SLA deadline without resolution.
                </div>
              )}
              {complaint.isSuspicious && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ This complaint has been flagged as suspicious by the community.
                </div>
              )}
              {(complaint.clusterCount > 1) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  🔗 {complaint.clusterCount} similar complaints have been reported in this area and merged into this cluster.
                </div>
              )}
              {complaint.reopenCount > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  🔁 This complaint has been reopened {complaint.reopenCount} time{complaint.reopenCount > 1 ? 's' : ''}.
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 capitalize">{complaint.category?.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleVote('up')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      userUpvoted ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-500 border-gray-300 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    👍 {complaint.upvoteCount || 0}
                  </button>
                  <button
                    onClick={() => handleVote('down')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      userDownvoted ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-600'
                    }`}
                  >
                    👎 {complaint.downvoteCount || 0}
                  </button>
                </div>
              </div>
            </div>

            {/* Before images */}
            {beforeImages.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-3">
                  Before Photos
                  <span className="ml-2 text-xs font-normal text-gray-400">Evidence submitted</span>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {beforeImages.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt={`Before ${i + 1}`} className="w-full rounded-lg object-cover aspect-video hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* After images */}
            {afterImages.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-semibold text-gray-900">After Cleaning</h2>
                  <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">✅ Proof of resolution</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {afterImages.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt={`After ${i + 1}`} className="w-full rounded-lg object-cover aspect-video hover:opacity-90 transition-opacity ring-2 ring-green-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-side comparison */}
            {beforeImages.length > 0 && afterImages.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-3">Before vs After</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Before</p>
                    <img src={beforeImages[0].url} alt="Before" className="w-full rounded-lg object-cover aspect-video" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-2">After ✅</p>
                    <img src={afterImages[0].url} alt="After" className="w-full rounded-lg object-cover aspect-video ring-2 ring-green-300" />
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
              <div className="space-y-4">
                {complaint.statusHistory?.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">{STATUS_ICONS[entry.status]}</div>
                      {i < complaint.statusHistory.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900 capitalize">{entry.status?.replace(/_/g, ' ')}</p>
                      {entry.comment && <p className="text-xs text-gray-600 mt-0.5">{entry.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(entry.timestamp).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Reopen — shown to reporter when resolved */}
            {complaint.status === 'resolved' && (user?._id === complaint.reporter?._id || user?._id === complaint.reporter) && (
              <div className="card border-blue-200 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">Issue not actually fixed?</h3>
                <p className="text-xs text-gray-500 mb-3">Reopen this complaint if the problem persists after resolution.</p>
                <button
                  onClick={handleReopen}
                  disabled={updating}
                  className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {updating ? <Spinner size="sm" /> : '🔁 Reopen Complaint'}
                </button>
              </div>
            )}

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Reporter</span>
                  <span className="font-medium">{complaint.isAnonymous ? 'Anonymous' : complaint.reporter?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Priority</span>
                  <span className={`font-medium capitalize ${complaint.priority === 'critical' ? 'text-red-600' : complaint.priority === 'high' ? 'text-orange-600' : 'text-gray-700'}`}>
                    {complaint.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Votes</span>
                  <span className="font-medium text-xs">👍 {complaint.upvoteCount || 0} · 👎 {complaint.downvoteCount || 0}</span>
                </div>
                {complaint.location?.address && (
                  <div>
                    <span className="text-gray-500">Location</span>
                    <p className="font-medium text-xs mt-0.5">{complaint.location.address}</p>
                  </div>
                )}
                {complaint.resolutionNote && (
                  <div>
                    <span className="text-gray-500">Resolution note</span>
                    <p className="font-medium text-xs mt-0.5">{complaint.resolutionNote}</p>
                  </div>
                )}
                {complaint.rejectionReason && (
                  <div>
                    <span className="text-gray-500">Rejection reason</span>
                    <p className="font-medium text-xs mt-0.5 text-red-600">{complaint.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <>
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  {(VALID_TRANSITIONS[complaint.status] || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No further transitions available.</p>
                  ) : (
                    <>
                      <select className="input mb-3" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                        <option value="">Select new status...</option>
                        {(VALID_TRANSITIONS[complaint.status] || []).map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <textarea
                        className="input resize-none mb-3"
                        rows={2}
                        placeholder="Add a comment (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button onClick={handleStatusUpdate} disabled={!newStatus || updating} className="btn-primary w-full">
                        {updating ? <Spinner size="sm" /> : 'Update Status'}
                      </button>
                    </>
                  )}
                </div>

                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-2">Upload After Photo</h3>
                  <p className="text-xs text-gray-500 mb-3">Proof that the issue has been resolved.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAfterImageFile(e.target.files[0] || null)}
                    className="w-full text-xs text-gray-600 mb-3 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  />
                  <button
                    onClick={handleAfterImageUpload}
                    disabled={!afterImageFile || uploadingImage}
                    className="btn-primary w-full text-sm"
                  >
                    {uploadingImage ? <Spinner size="sm" /> : '📸 Upload After Photo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailPage;
