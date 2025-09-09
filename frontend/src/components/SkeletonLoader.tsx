import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'avatar' | 'chart';
  lines?: number;
  width?: string;
  height?: string;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'text', 
  lines = 1, 
  width, 
  height, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={`skeleton ${className}`} style={{ width, height }}>
            {Array.from({ length: lines }).map((_, index) => (
              <div 
                key={index}
                className={`skeleton-text ${index === lines - 1 ? 'narrow' : index === 0 ? 'wide' : 'medium'}`}
              />
            ))}
          </div>
        );

      case 'card':
        return (
          <div className={`skeleton-card ${className}`} style={{ width, height }}>
            <div className="skeleton-text wide" />
            <div className="skeleton-text medium" />
            <div className="skeleton-text narrow" />
          </div>
        );

      case 'avatar':
        return (
          <div className={`skeleton skeleton-avatar ${className}`} style={{ width, height }} />
        );

      case 'table':
        return (
          <table className={`skeleton-table ${className}`} style={{ width, height }}>
            <thead>
              <tr>
                <th><div className="skeleton skeleton-text narrow" /></th>
                <th><div className="skeleton skeleton-text medium" /></th>
                <th><div className="skeleton skeleton-text narrow" /></th>
                <th><div className="skeleton skeleton-text medium" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: lines }).map((_, index) => (
                <tr key={index}>
                  <td><div className="skeleton skeleton-text narrow" /></td>
                  <td><div className="skeleton skeleton-text wide" /></td>
                  <td><div className="skeleton skeleton-text medium" /></td>
                  <td><div className="skeleton skeleton-text narrow" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'chart':
        return (
          <div className={`skeleton ${className}`} style={{ width, height: height || '200px' }}>
            <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '100%', padding: '20px' }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div 
                  key={index}
                  className="skeleton"
                  style={{ 
                    flex: 1, 
                    height: `${Math.random() * 60 + 40}%`,
                    borderRadius: '4px 4px 0 0'
                  }} 
                />
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className={`skeleton ${className}`} style={{ width, height }} />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
