import { createPortal } from 'react-dom';
import { useNotifications } from '../../context/NotificationContext';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts } = useNotifications();
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => <Toast key={toast.id} {...toast} />)}
    </div>,
    document.body
  );
};

export default ToastContainer;
