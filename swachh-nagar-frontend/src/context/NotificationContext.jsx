import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSocket } from '../config/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => removeToast(id), duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, title = 'Success') => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((message, title = 'Error') => addToast({ type: 'error', title, message }), [addToast]);
  const info = useCallback((message, title = 'Info') => addToast({ type: 'info', title, message }), [addToast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (notification) => {
      setUnreadCount((c) => c + 1);
      addToast({
        type: 'info',
        title: notification.title?.en || 'Notification',
        message: notification.body?.en || '',
      });
    };

    const handleStatusChanged = ({ complaintRef, previousStatus, newStatus }) => {
      addToast({
        type: 'success',
        title: 'Complaint Updated',
        message: `${complaintRef}: ${previousStatus.replace(/_/g, ' ')} → ${newStatus.replace(/_/g, ' ')}`,
      });
    };

    socket.on('notification', handleNotification);
    socket.on('complaint:status_changed', handleStatusChanged);
    return () => {
      socket.off('notification', handleNotification);
      socket.off('complaint:status_changed', handleStatusChanged);
    };
  }, [isAuthenticated, addToast]);

  return (
    <NotificationContext.Provider value={{ toasts, removeToast, addToast, success, error, info, unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
