// frontend/src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TrainingDashboard from '../components/TrainingDashboard';

interface IAnnotation {
    _id: string;
    sequenceId: string;
    originalPrediction: string;
    userFeedback: string;
    scientistId: string;
    timestamp: string;
}

const AdminPage: React.FC = () => {
    const [annotations, setAnnotations] = useState<IAnnotation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'training'>('overview');

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get('http://localhost:5001/api/analysis/admin/annotations', { 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        })
            .then(res => setAnnotations(res.data))
            .catch(err => console.error("Failed to fetch annotations:", err));
    }, []);

    const handleRetrain = async () => {
        if (!window.confirm("Are you sure you want to trigger a new local model training run? This will retrain the AI model with current annotation feedback.")) {
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5001/api/training/retrain', {}, { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                } 
            });
            alert(res.data.message);
        } catch (err) {
            alert("Failed to start retraining job.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Admin Panel - The Self-Improving Ecosystem</h1>
                <div className="tab-navigation">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'training' ? 'active' : ''}`}
                        onClick={() => setActiveTab('training')}
                    >
                        🤖 AI Training
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="overview-tab">
                    <p>Review expert annotations from the Human-in-the-Loop system and trigger a new AI model training run with the validated data.</p>
                    <button onClick={handleRetrain} disabled={isLoading} className="retrain-button">
                        {isLoading ? "Triggering Kaggle Run..." : "🚀 Trigger New AI Training Run"}
                    </button>
                    
                    <h3 className="section-title">Recent Annotations</h3>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Sequence ID</th>
                                <th>Original Prediction</th>
                                <th>Feedback</th>
                                <th>Scientist</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {annotations.map(ann => (
                                <tr key={ann._id}>
                                    <td>{ann.sequenceId}</td>
                                    <td>{ann.originalPrediction}</td>
                                    <td>{ann.userFeedback}</td>
                                    <td>{ann.scientistId}</td>
                                    <td>{new Date(ann.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'training' && (
                <TrainingDashboard />
            )}

            <style>{`
                .admin-page {
                    padding: 20px;
                    background: #1a1a1a;
                    color: white;
                    min-height: 100vh;
                }

                .admin-header {
                    margin-bottom: 30px;
                }

                .admin-header h1 {
                    margin-bottom: 20px;
                    color: #00ff88;
                }

                .tab-navigation {
                    display: flex;
                    gap: 10px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 10px;
                }

                .tab-btn {
                    background: none;
                    border: none;
                    color: #888;
                    padding: 10px 20px;
                    cursor: pointer;
                    border-radius: 5px 5px 0 0;
                    transition: all 0.2s;
                }

                .tab-btn.active {
                    background: #333;
                    color: #00ff88;
                }

                .tab-btn:hover {
                    background: #2a2a2a;
                    color: white;
                }

                .overview-tab {
                    background: #2a2a2a;
                    padding: 20px;
                    border-radius: 0 12px 12px 12px;
                }

                .section-title {
                    margin-top: 30px;
                    color: #00ff88;
                }

                .retrain-button {
                    background: linear-gradient(135deg, #00ff88, #00cc66);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .retrain-button:hover:not(:disabled) {
                    transform: scale(1.05);
                }

                .retrain-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                .results-table th,
                .results-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #444;
                }

                .results-table th {
                    background: #333;
                    color: #00ff88;
                }

                .results-table tr:hover {
                    background: #333;
                }
            `}</style>
        </div>
    );
};
export default AdminPage;