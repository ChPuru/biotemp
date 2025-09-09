import React from 'react';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  type?: 'linear' | 'circular' | 'step';
  steps?: string[];
  currentStep?: number;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status,
  message,
  showPercentage = true,
  size = 'medium',
  type = 'linear',
  steps = [],
  currentStep = 0,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return '⏸️';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'var(--text-secondary)';
      case 'running':
        return 'var(--accent-primary)';
      case 'completed':
        return 'var(--accent-success)';
      case 'error':
        return 'var(--accent-danger)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const renderLinear = () => (
    <div className={`progress-linear ${size} ${className}`}>
      <div className="progress-header">
        <span className="progress-icon">{getStatusIcon()}</span>
        <span className="progress-message">{message || 'Processing...'}</span>
        {showPercentage && (
          <span className="progress-percentage">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: getStatusColor()
          }}
        />
      </div>
    </div>
  );

  const renderCircular = () => (
    <div className={`progress-circular ${size} ${className}`}>
      <div className="progress-circle-container">
        <svg className="progress-circle" viewBox="0 0 36 36">
          <path
            className="progress-circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="progress-circle-fill"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            style={{ stroke: getStatusColor() }}
          />
        </svg>
        <div className="progress-circle-content">
          <span className="progress-icon">{getStatusIcon()}</span>
          {showPercentage && (
            <span className="progress-percentage">{Math.round(progress)}%</span>
          )}
        </div>
      </div>
      {message && (
        <div className="progress-message">{message}</div>
      )}
    </div>
  );

  const renderStep = () => (
    <div className={`progress-step ${size} ${className}`}>
      <div className="progress-header">
        <span className="progress-icon">{getStatusIcon()}</span>
        <span className="progress-message">{message || 'Processing...'}</span>
      </div>
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`progress-step-item ${
              index < currentStep ? 'completed' :
              index === currentStep ? 'active' : 'pending'
            }`}
          >
            <div className="progress-step-indicator">
              {index < currentStep ? '✅' : index === currentStep ? '🔄' : '⏸️'}
            </div>
            <div className="progress-step-label">{step}</div>
            {index < steps.length - 1 && (
              <div className="progress-step-connector" />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  switch (type) {
    case 'circular':
      return renderCircular();
    case 'step':
      return renderStep();
    default:
      return renderLinear();
  }
};

export default ProgressIndicator;
