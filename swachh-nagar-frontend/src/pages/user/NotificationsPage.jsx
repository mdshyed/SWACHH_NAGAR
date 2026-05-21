import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';
import { useNotifications } from '../../context/NotificationContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useNotifications();

  useEffect(() => {
    api.get('/notifications?limit=30').then((r) => {
      setNotifications(r.data.data.notifications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <button onClick={markAllRead} className="text-sm text-primary-600 hover:underline">Mark all read</button>
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-gray-500">No notifications yet.</p>
              </div>
            ) : notifications.map((n) => (
              <div key={n._id} className={`card py-4 px-4 flex items-start gap-3 ${!n.isRead ? 'border-primary-200 bg-primary-50/30' : ''}`}>
                {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                <div className={!n.isRead ? '' : 'ml-5'}>
                  <p className="text-sm font-medium text-gray-900">{n.title?.en}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body?.en}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
