import React from 'react';

interface ErrorNotificationProps {
  error: {
    isError: boolean;
    errorMessage: string;
  };
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (autoClose && error.isError) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [error.isError, autoClose, duration, onClose]);

  if (!error.isError) return null;

  return (
    <div className="error-notification">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <strong>Error:</strong> {error.errorMessage}
        </div>
        <button 
          className="error-close"
          onClick={onClose}
          aria-label="Close error notification"
        >
          ✕
        </button>
      </div>

      <style>{`
        .error-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
          animation: slideIn 0.3s ease-out;
        }

        .error-content {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .error-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .error-text {
          flex: 1;
          color: #721c24;
          font-size: 14px;
          line-height: 1.4;
        }

        .error-close {
          background: none;
          border: none;
          font-size: 18px;
          color: #721c24;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .error-close:hover {
          background: #fcc;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ErrorNotification;
