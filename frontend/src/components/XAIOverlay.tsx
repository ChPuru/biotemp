import React, { useState, useRef, useEffect } from 'react';
import './XAIOverlay.css';

interface FeatureImportance {
  feature: string;
  importance: number;
  contribution: number;
  position?: number;
  nucleotide?: string;
}

interface XAIOverlayProps {
  sequence: string;
  features: FeatureImportance[];
  prediction: string;
  confidence: number;
  onClose: () => void;
}

const XAIOverlay: React.FC<XAIOverlayProps> = ({
  sequence,
  features,
  prediction,
  confidence,
  onClose
}) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureImportance | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sort features by importance
  const sortedFeatures = [...features].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));

  const getFeatureColor = (importance: number) => {
    const absImportance = Math.abs(importance);
    if (absImportance > 0.7) return 'var(--accent-secondary)'; // High importance - amber
    if (absImportance > 0.4) return 'var(--accent-primary)'; // Medium importance - cyan
    return 'var(--accent-teal)'; // Low importance - teal
  };

  const getFeatureGlow = (importance: number) => {
    const absImportance = Math.abs(importance);
    if (absImportance > 0.7) return '0 0 12px rgba(244, 162, 97, 0.6)';
    if (absImportance > 0.4) return '0 0 12px rgba(0, 170, 255, 0.6)';
    return '0 0 8px rgba(42, 157, 143, 0.4)';
  };

  const handleSequenceClick = (position: number) => {
    const feature = features.find(f => f.position === position);
    if (feature) {
      setSelectedFeature(feature);
      setShowDetails(true);
    }
  };

  const handleFeatureClick = (feature: FeatureImportance) => {
    setSelectedFeature(feature);
    setShowDetails(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="xai-overlay-backdrop">
      <div className="xai-overlay" ref={overlayRef}>
        <div className="xai-header">
          <h3>🧠 Explainable AI - Feature Importance Analysis</h3>
          <button className="xai-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="xai-content">
          <div className="xai-prediction-summary">
            <div className="prediction-card">
              <h4>Prediction</h4>
              <div className="prediction-value">{prediction}</div>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <div className="confidence-text">{(confidence * 100).toFixed(1)}% confidence</div>
            </div>
          </div>

          <div className="xai-sequence-container">
            <h4>DNA Sequence with Feature Importance</h4>
            <div className="sequence-display">
              {sequence.split('').map((nucleotide, index) => {
                const feature = features.find(f => f.position === index);
                const importance = feature?.importance || 0;
                const isHovered = hoveredPosition === index;
                const isSelected = selectedFeature?.position === index;

                return (
                  <span
                    key={index}
                    className={`nucleotide ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                    style={{
                      backgroundColor: getFeatureColor(importance),
                      boxShadow: getFeatureGlow(importance),
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1
                    }}
                    onClick={() => handleSequenceClick(index)}
                    onMouseEnter={() => setHoveredPosition(index)}
                    onMouseLeave={() => setHoveredPosition(null)}
                    title={`Position ${index}: ${nucleotide} (Importance: ${(importance * 100).toFixed(1)}%)`}
                  >
                    {nucleotide}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="xai-features-panel">
            <h4>Top Contributing Features</h4>
            <div className="features-grid">
              {sortedFeatures.slice(0, 10).map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card ${selectedFeature === feature ? 'selected' : ''}`}
                  onClick={() => handleFeatureClick(feature)}
                  style={{
                    borderColor: getFeatureColor(feature.importance),
                    boxShadow: getFeatureGlow(feature.importance)
                  }}
                >
                  <div className="feature-rank">#{index + 1}</div>
                  <div className="feature-name">{feature.feature}</div>
                  <div className="feature-importance">
                    {(feature.importance * 100).toFixed(1)}%
                  </div>
                  <div className="feature-contribution">
                    Contribution: {(feature.contribution * 100).toFixed(1)}%
                  </div>
                  {feature.position !== undefined && (
                    <div className="feature-position">
                      Position: {feature.position}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showDetails && selectedFeature && (
            <div className="xai-details-panel">
              <h4>Feature Details</h4>
              <div className="details-content">
                <div className="detail-item">
                  <span className="detail-label">Feature:</span>
                  <span className="detail-value">{selectedFeature.feature}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Importance:</span>
                  <span className="detail-value">
                    {(selectedFeature.importance * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contribution:</span>
                  <span className="detail-value">
                    {(selectedFeature.contribution * 100).toFixed(2)}%
                  </span>
                </div>
                {selectedFeature.position !== undefined && (
                  <div className="detail-item">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">{selectedFeature.position}</span>
                  </div>
                )}
                {selectedFeature.nucleotide && (
                  <div className="detail-item">
                    <span className="detail-label">Nucleotide:</span>
                    <span className="detail-value">{selectedFeature.nucleotide}</span>
                  </div>
                )}
              </div>
              <button 
                className="close-details-btn"
                onClick={() => setShowDetails(false)}
              >
                Close Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XAIOverlay;
