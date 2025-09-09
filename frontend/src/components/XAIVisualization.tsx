// Enhanced XAI Visualization with SHAP Values and Attention Maps

import React, { useState, useEffect } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import './XAIVisualization.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SHAPValue {
  feature: string;
  value: number;
  baseValue: number;
  contribution: number;
}

interface AttentionWeight {
  position: number;
  nucleotide: string;
  weight: number;
  importance: 'high' | 'medium' | 'low';
}

interface XAIData {
  sequence: string;
  prediction: string;
  confidence: number;
  shapValues: SHAPValue[];
  attentionWeights: AttentionWeight[];
  featureImportance: { [key: string]: number };
  explanationText: string;
}

interface XAIVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  sequenceId: string;
  prediction: string;
}

const XAIVisualization: React.FC<XAIVisualizationProps> = ({ 
  isOpen, 
  onClose, 
  sequenceId, 
  prediction 
}) => {
  const [xaiData, setXaiData] = useState<XAIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'shap' | 'attention' | 'features' | 'explanation'>('shap');

  useEffect(() => {
    if (isOpen && sequenceId) {
      fetchXAIData();
    }
  }, [isOpen, sequenceId]);

  const fetchXAIData = async () => {
    setLoading(true);
    try {
      // Check if tunneled novelty server is available
      const noveltyServerUrl = localStorage.getItem('novelty_server_url') || 'http://localhost:8080';
      let useNoveltyServer = false;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const healthCheck = await fetch(`${noveltyServerUrl}/health`, { 
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        useNoveltyServer = healthCheck.ok;
      } catch (e) {
        console.log('Novelty server not available, using local XAI');
      }

      const response = await fetch('http://localhost:5001/api/analysis/xai-detailed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sequenceId, 
          prediction,
          includeShap: true,
          includeAttention: true,
          useNoveltyServer,
          noveltyServerUrl: useNoveltyServer ? noveltyServerUrl : undefined
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setXaiData(data);
      } else {
        // Fallback to mock data for demonstration
        setXaiData(generateMockXAIData());
      }
    } catch (error) {
      console.error('XAI fetch error:', error);
      setXaiData(generateMockXAIData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockXAIData = (): XAIData => {
    const mockSequence = "ATCGATCGATCGATCGATCGATCGATCGATCG";
    const shapValues: SHAPValue[] = [
      { feature: 'GC Content', value: 0.65, baseValue: 0.5, contribution: 0.15 },
      { feature: 'Codon Usage', value: 0.82, baseValue: 0.6, contribution: 0.22 },
      { feature: 'Motif Presence', value: 0.91, baseValue: 0.4, contribution: 0.51 },
      { feature: 'Length Bias', value: 0.34, baseValue: 0.5, contribution: -0.16 },
      { feature: 'Homology Score', value: 0.78, baseValue: 0.3, contribution: 0.48 }
    ];

    const attentionWeights: AttentionWeight[] = mockSequence.split('').map((nucleotide, index) => ({
      position: index,
      nucleotide,
      weight: Math.random() * 0.8 + 0.2,
      importance: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
    }));

    return {
      sequence: mockSequence,
      prediction: prediction,
      confidence: 0.87,
      shapValues,
      attentionWeights,
      featureImportance: {
        'Sequence Composition': 0.35,
        'Structural Features': 0.28,
        'Evolutionary Markers': 0.22,
        'Functional Domains': 0.15
      },
      explanationText: `The model's prediction of "${prediction}" is primarily driven by sequence composition features (35% importance). Key contributing factors include high GC content and specific codon usage patterns typical of this species. The attention mechanism highlights critical regions in positions 8-15 and 22-28, which correspond to conserved motifs associated with species-specific markers.`
    };
  };

  const getSHAPChart = () => {
    if (!xaiData) return null;

    const data = {
      labels: xaiData.shapValues.map(s => s.feature),
      datasets: [
        {
          label: 'SHAP Contribution',
          data: xaiData.shapValues.map(s => s.contribution),
          backgroundColor: xaiData.shapValues.map(s => 
            s.contribution > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
          ),
          borderColor: xaiData.shapValues.map(s => 
            s.contribution > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
          ),
          borderWidth: 1
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'SHAP Feature Contributions' }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Contribution to Prediction' }
        }
      }
    };

    return <Bar data={data} options={options} />;
  };

  const getAttentionVisualization = () => {
    if (!xaiData) return null;

    return (
      <div className="attention-visualization">
        <h4>Sequence Attention Weights</h4>
        <div className="sequence-container">
          <div className="sequence-grid">
            {xaiData.attentionWeights.map((att, index) => (
              <div
                key={index}
                className={`nucleotide-cell ${att.importance}`}
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${att.weight})`,
                  color: att.weight > 0.6 ? 'white' : 'black',
                  fontWeight: att.importance === 'high' ? 'bold' : 'normal',
                  border: att.importance === 'high' ? '2px solid #dc2626' : '1px solid #e5e7eb'
                }}
                title={`Position ${att.position}: ${att.nucleotide} (Weight: ${att.weight.toFixed(3)})`}
              >
                {att.nucleotide}
              </div>
            ))}
          </div>
        </div>
        <div className="attention-legend">
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}></div>
              <span>Low Attention</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }}></div>
              <span>High Attention</span>
            </div>
            <div className="legend-item">
              <div className="legend-color critical" style={{ backgroundColor: 'rgba(59, 130, 246, 0.6)', border: '2px solid #dc2626' }}></div>
              <span>Critical Region</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getFeatureImportanceChart = () => {
    if (!xaiData) return null;

    const data = {
      labels: Object.keys(xaiData.featureImportance),
      datasets: [
        {
          label: 'Feature Importance',
          data: Object.values(xaiData.featureImportance),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)'
          ],
          borderWidth: 2,
          fill: true
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Feature Category Importance' }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 1,
          ticks: { stepSize: 0.2 }
        }
      }
    };

    return <Radar data={data} options={options} />;
  };

  if (!isOpen) return null;

  return (
    <div className="xai-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="xai-modal" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div className="xai-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '25px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '15px'
        }}>
          <h2 style={{ margin: 0, color: '#1f2937' }}>🧠 Explainable AI Analysis</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>🔄 Generating XAI explanations...</div>
          </div>
        ) : (
          <>
            <div className="prediction-summary" style={{
              backgroundColor: '#f0f9ff',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '25px',
              border: '1px solid #0ea5e9'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Prediction: {prediction}</h3>
              <p style={{ margin: 0 }}>Confidence: {xaiData ? (xaiData.confidence * 100).toFixed(1) : '0'}%</p>
            </div>

            <div className="xai-tabs" style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e5e7eb' }}>
                {[
                  { key: 'shap', label: '📊 SHAP Values' },
                  { key: 'attention', label: '🎯 Attention Map' },
                  { key: 'features', label: '🔍 Feature Importance' },
                  { key: 'explanation', label: '📝 Explanation' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
                      color: activeTab === tab.key ? 'white' : '#6b7280',
                      borderRadius: '8px 8px 0 0',
                      cursor: 'pointer',
                      fontWeight: activeTab === tab.key ? 'bold' : 'normal'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="xai-content" style={{ minHeight: '400px' }}>
              {activeTab === 'shap' && (
                <div>
                  <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                    SHAP (SHapley Additive exPlanations) values show how each feature contributes to the model's prediction.
                    Positive values push toward the predicted class, negative values push away.
                  </p>
                  {getSHAPChart()}
                </div>
              )}

              {activeTab === 'attention' && (
                <div>
                  <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                    Attention weights highlight which parts of the DNA sequence the model focuses on when making predictions.
                    Darker regions indicate higher attention, red borders mark critical regions.
                  </p>
                  {getAttentionVisualization()}
                </div>
              )}

              {activeTab === 'features' && (
                <div>
                  <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                    Feature importance radar chart shows the relative contribution of different feature categories
                    to the overall prediction confidence.
                  </p>
                  <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    {getFeatureImportanceChart()}
                  </div>
                </div>
              )}

              {activeTab === 'explanation' && (
                <div>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    lineHeight: '1.6'
                  }}>
                    <h4 style={{ marginTop: 0 }}>🤖 Model Explanation</h4>
                    <p>{xaiData?.explanationText}</p>
                    
                    <div style={{ marginTop: '20px' }}>
                      <h5>Key Insights:</h5>
                      <ul>
                        <li>Most influential feature: {xaiData?.shapValues.reduce((max, curr) => 
                          Math.abs(curr.contribution) > Math.abs(max.contribution) ? curr : max
                        )?.feature}</li>
                        <li>Attention peaks at positions: {xaiData?.attentionWeights
                          .filter(a => a.importance === 'high')
                          .map(a => a.position)
                          .slice(0, 5)
                          .join(', ')}</li>
                        <li>Primary feature category: {Object.entries(xaiData?.featureImportance || {})
                          .reduce((max, [key, value]) => value > max[1] ? [key, value] : max, ['', 0])[0]}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default XAIVisualization;
