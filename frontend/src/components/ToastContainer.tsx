import React, { useState, useCallback } from 'react';
import ToastNotification, { Toast } from './ToastNotification';
import './ToastContainer.css';

interface ToastContainerProps {
  children: React.ReactNode;
}

export const ToastContext = React.createContext<{
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message: string, options?: Partial<Toast>) => void;
  showError: (title: string, message: string, options?: Partial<Toast>) => void;
  showWarning: (title: string, message: string, options?: Partial<Toast>) => void;
  showInfo: (title: string, message: string, options?: Partial<Toast>) => void;
}>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
});

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    showToast({ type: 'success', title, message, ...options });
  }, [showToast]);

  const showError = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    showToast({ type: 'error', title, message, ...options });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    showToast({ type: 'warning', title, message, ...options });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Toast>) => {
    showToast({ type: 'info', title, message, ...options });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const contextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContainer;
