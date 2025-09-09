import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'chart' | 'list' | 'button';
  lines?: number;
  height?: string;
  width?: string;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  lines = 1,
  height,
  width,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`skeleton-card ${className}`} style={{ height, width }}>
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-content"></div>
            <div className="skeleton-line skeleton-content short"></div>
          </div>
        );
      
      case 'table':
        return (
          <div className={`skeleton-table ${className}`} style={{ height, width }}>
            <div className="skeleton-table-header">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-line skeleton-header"></div>
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="skeleton-table-row">
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <div key={colIndex} className="skeleton-line skeleton-cell"></div>
                ))}
              </div>
            ))}
          </div>
        );
      
      case 'chart':
        return (
          <div className={`skeleton-chart ${className}`} style={{ height, width }}>
            <div className="skeleton-chart-title"></div>
            <div className="skeleton-chart-content">
              <div className="skeleton-bars">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-bar" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className={`skeleton-list ${className}`} style={{ height, width }}>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="skeleton-list-item">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-list-content">
                  <div className="skeleton-line skeleton-title"></div>
                  <div className="skeleton-line skeleton-content"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'button':
        return (
          <div className={`skeleton-button ${className}`} style={{ height, width }}>
            <div className="skeleton-line"></div>
          </div>
        );
      
      default: // text
        return (
          <div className={`skeleton-text ${className}`} style={{ height, width }}>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className={`skeleton-line ${i === lines - 1 ? 'short' : ''}`}></div>
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;