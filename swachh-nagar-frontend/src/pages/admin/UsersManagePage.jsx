import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const ROLE_STYLES = {
  user: 'bg-gray-100 text-gray-600 border border-gray-200',
  admin: 'bg-green-100 text-green-700 border border-green-200',
  super_admin: 'bg-purple-100 text-purple-700 border border-purple-200',
};

const ROLE_LABELS = { user: 'Citizen', admin: 'Admin', super_admin: 'Super Admin' };

const UsersManagePage = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useNotifications();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    api.get(`/users/admin/all?page=${page}&limit=15`)
      .then((r) => {
        setUsers(r.data.data.data || []);
        setPagination(r.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setUpdatingId(userId);
    try {
      await api.patch(`/users/admin/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      success(`Role updated to ${ROLE_LABELS[newRole]}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBanToggle = async (userId, isBanned) => {
    setUpdatingId(userId);
    try {
      const res = await api.patch(`/users/admin/${userId}/ban`, { isBanned });
      const updated = res.data.data;
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBanned: updated.isBanned } : u))
      );
      success(`User ${updated.isBanned ? 'banned' : 'unbanned'} successfully`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update ban status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-sm text-gray-500 mt-1">Promote citizens to admin or ban abusive accounts</p>
          </div>
          <Link to="/admin" className="btn-secondary text-sm">← Dashboard</Link>
        </div>

        {/* Security notice */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <div className="text-sm text-amber-800">
            <strong>Backend enforced:</strong> Role changes take effect immediately on the server. Users must log out and back in to see their updated role in the UI.
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
                    {['User', 'Email', 'Role', 'Points', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const isUpdating = updatingId === u._id;

                    return (
                      <tr key={u._id} className={`hover:bg-gray-50 ${isSelf ? 'bg-primary-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                              {isSelf && <span className="text-xs text-primary-600 font-medium">You</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[u.role]}`}>
                            {u.role === 'admin' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />}
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-medium">⭐ {u.points}</td>
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Banned</span>
                          ) : u.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          {isUpdating ? (
                            <Spinner size="sm" />
                          ) : isSelf || u.role === 'super_admin' ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRoleToggle(u._id, u.role)}
                                className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
                                  u.role === 'admin'
                                    ? 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                                    : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                }`}
                              >
                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleBanToggle(u._id, u.isBanned)}
                                className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
                                  u.isBanned
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                    : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                }`}
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">No users found</div>
              )}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
                <span>Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total} users</span>
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

export default UsersManagePage;
