import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const ProfilePage = () => {
  const { user } = useAuth();
  const { success, error } = useNotifications();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/users/profile', form);
      success('Profile updated successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
        <div className="card">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 capitalize">{user?.role}</span>
                <span className="text-xs text-gray-500">⭐ {user?.points} points</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">Email (readonly)</label><input className="input bg-gray-50" value={user?.email} readOnly /></div>
            <div><label className="label">Phone</label><input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
