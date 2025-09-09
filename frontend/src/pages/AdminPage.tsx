// frontend/src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TrainingDashboard from '../components/TrainingDashboard';
import './AdminPage.css';

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
        if (!token) {
            console.warn("No authentication token found");
            return;
        }

        axios.get('http://localhost:5001/api/analysis/admin/annotations', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => setAnnotations(res.data))
            .catch(err => {
                console.error("Failed to fetch annotations:", err);
                if (err.response?.status === 401) {
                    alert("Authentication required. Please log in again.");
                }
            });
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

        </div>
    );
};
export default AdminPage;