// frontend/src/components/TrainingDashboard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TrainingJob {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  logs: Array<{ type: string; message: string; timestamp: string }>;
  results?: any;
  error?: string;
}

interface TrainingHistory {
  id: number;
  timestamp: string;
  model_type: string;
  dataset_size: number;
  accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  training_time: number;
  model_path: string;
  model_hash: string;
}

const TrainingDashboard: React.FC = () => {
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [isRetraining, setIsRetraining] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<any>(null);

  useEffect(() => {
    fetchTrainingJobs();
    fetchTrainingHistory();
    
    // Poll for job updates every 5 seconds
    const interval = setInterval(() => {
      if (activeJobs.some(job => job.status === 'running')) {
        fetchTrainingJobs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeJobs.length]);

  const fetchTrainingJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/training/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setActiveJobs(response.data.jobs);
      }
    } catch (error: any) {
      console.error('Failed to fetch training jobs:', error);
      if (error.response?.status === 401) {
        console.warn('Authentication required for training jobs');
      } else if (error.response?.status === 404) {
        console.warn('Training jobs endpoint not available');
      }
      // Set empty jobs array to prevent further errors
      setActiveJobs([]);
    }
  };

  const fetchTrainingHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/training/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTrainingHistory(response.data.history);
      }
    } catch (error: any) {
      console.error('Failed to fetch training history:', error);
      if (error.response?.status === 401) {
        console.warn('Authentication required for training history');
      } else if (error.response?.status === 404) {
        console.warn('Training history endpoint not available');
      }
      // Set empty history array to prevent further errors
      setTrainingHistory([]);
    }
  };

  const startRetraining = async () => {
    setIsRetraining(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }

      const response = await axios.post('http://localhost:5001/api/training/retrain', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`Training job started: ${response.data.jobId}`);
        fetchTrainingJobs();
      }
    } catch (error: any) {
      console.error('Failed to start retraining:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        alert('Retraining endpoint not available. This is a demo feature.');
      } else {
        alert('Failed to start retraining job');
      }
    } finally {
      setIsRetraining(false);
    }
  };

  const fetchJobStatus = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/training/status/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setJobLogs(response.data.job);
        setSelectedJob(jobId);
      }
    } catch (error: any) {
      console.error('Failed to fetch job status:', error);
      if (error.response?.status === 401) {
        console.warn('Authentication required for job status');
      } else if (error.response?.status === 404) {
        console.warn('Job status endpoint not available');
      }
    }
  };

  const addAnnotationFeedback = async (sequenceId: string, originalPrediction: string, userFeedback: string, confidence: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }

      await axios.post('http://localhost:5001/api/training/feedback', {
        sequenceId,
        originalPrediction,
        userFeedback,
        confidenceScore: confidence
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Annotation feedback added for future training');
    } catch (error: any) {
      console.error('Failed to add feedback:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else {
        alert('Failed to add annotation feedback');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#ffa500';
      case 'completed': return '#00ff88';
      case 'failed': return '#ff4444';
      default: return '#666';
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="training-dashboard">
      <div className="dashboard-header">
        <h2>🤖 AI Training Pipeline Dashboard</h2>
        <button 
          className="retrain-btn"
          onClick={startRetraining}
          disabled={isRetraining}
        >
          {isRetraining ? '🔄 Starting...' : '🚀 Start Retraining'}
        </button>
      </div>

      <div className="dashboard-content">
        {/* Active Training Jobs */}
        <div className="jobs-section">
          <h3>Active Training Jobs</h3>
          {activeJobs.length === 0 ? (
            <div className="no-jobs">
              <p>No active training jobs</p>
              <p>Click "Start Retraining" to begin a new training session</p>
            </div>
          ) : (
            <div className="jobs-list">
              {activeJobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <span className="job-id">{job.id}</span>
                    <span 
                      className="job-status"
                      style={{ color: getStatusColor(job.status) }}
                    >
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="job-details">
                    <p>Started: {new Date(job.startTime).toLocaleString()}</p>
                    {job.duration && (
                      <p>Duration: {formatDuration(job.duration)}</p>
                    )}
                    {job.error && (
                      <p className="error">Error: {job.error}</p>
                    )}
                  </div>
                  <button 
                    className="view-logs-btn"
                    onClick={() => fetchJobStatus(job.id)}
                  >
                    View Logs
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Training History */}
        <div className="history-section">
          <h3>Training History</h3>
          {trainingHistory.length === 0 ? (
            <p>No training history available</p>
          ) : (
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Model Type</th>
                    <th>Dataset Size</th>
                    <th>Accuracy</th>
                    <th>F1 Score</th>
                    <th>Training Time</th>
                    <th>Model Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingHistory.slice(0, 10).map(record => (
                    <tr key={record.id}>
                      <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                      <td>{record.model_type}</td>
                      <td>{record.dataset_size}</td>
                      <td>{(record.accuracy * 100).toFixed(2)}%</td>
                      <td>{(record.f1_score * 100).toFixed(2)}%</td>
                      <td>{record.training_time.toFixed(1)}s</td>
                      <td className="hash">{record.model_hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="metrics-section">
          <h3>Model Performance Metrics</h3>
          {trainingHistory.length > 0 && (
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Latest Accuracy</h4>
                <div className="metric-value">
                  {(trainingHistory[0]?.accuracy * 100 || 0).toFixed(2)}%
                </div>
              </div>
              <div className="metric-card">
                <h4>Average F1 Score</h4>
                <div className="metric-value">
                  {trainingHistory.length > 0 
                    ? (trainingHistory.reduce((sum, r) => sum + r.f1_score, 0) / trainingHistory.length * 100).toFixed(2)
                    : 0}%
                </div>
              </div>
              <div className="metric-card">
                <h4>Total Models Trained</h4>
                <div className="metric-value">
                  {trainingHistory.length}
                </div>
              </div>
              <div className="metric-card">
                <h4>Avg Training Time</h4>
                <div className="metric-value">
                  {trainingHistory.length > 0 
                    ? (trainingHistory.reduce((sum, r) => sum + r.training_time, 0) / trainingHistory.length).toFixed(1)
                    : 0}s
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Annotation Feedback Form */}
        <div className="feedback-section">
          <h3>Add Training Feedback</h3>
          <div className="feedback-form">
            <input 
              type="text" 
              placeholder="Sequence ID" 
              id="sequenceId"
            />
            <input 
              type="text" 
              placeholder="Original Prediction" 
              id="originalPrediction"
            />
            <input 
              type="text" 
              placeholder="Correct Species" 
              id="userFeedback"
            />
            <input 
              type="number" 
              placeholder="Confidence (0-1)" 
              step="0.1" 
              min="0" 
              max="1"
              id="confidence"
            />
            <button 
              onClick={() => {
                const sequenceId = (document.getElementById('sequenceId') as HTMLInputElement).value;
                const originalPrediction = (document.getElementById('originalPrediction') as HTMLInputElement).value;
                const userFeedback = (document.getElementById('userFeedback') as HTMLInputElement).value;
                const confidence = parseFloat((document.getElementById('confidence') as HTMLInputElement).value);
                
                if (sequenceId && originalPrediction && userFeedback && confidence) {
                  addAnnotationFeedback(sequenceId, originalPrediction, userFeedback, confidence);
                  // Clear form
                  (document.getElementById('sequenceId') as HTMLInputElement).value = '';
                  (document.getElementById('originalPrediction') as HTMLInputElement).value = '';
                  (document.getElementById('userFeedback') as HTMLInputElement).value = '';
                  (document.getElementById('confidence') as HTMLInputElement).value = '';
                }
              }}
            >
              Add Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Job Logs Modal */}
      {selectedJob && jobLogs && (
        <div className="logs-modal">
          <div className="logs-content">
            <div className="logs-header">
              <h3>Job Logs: {selectedJob}</h3>
              <button onClick={() => setSelectedJob(null)}>×</button>
            </div>
            <div className="logs-body">
              <div className="job-info">
                <p><strong>Status:</strong> {jobLogs.status}</p>
                <p><strong>Start Time:</strong> {new Date(jobLogs.startTime).toLocaleString()}</p>
                {jobLogs.endTime && (
                  <p><strong>End Time:</strong> {new Date(jobLogs.endTime).toLocaleString()}</p>
                )}
                {jobLogs.duration && (
                  <p><strong>Duration:</strong> {formatDuration(jobLogs.duration)}</p>
                )}
              </div>
              
              {jobLogs.results && (
                <div className="job-results">
                  <h4>Training Results:</h4>
                  <pre>{JSON.stringify(jobLogs.results, null, 2)}</pre>
                </div>
              )}
              
              <div className="logs-list">
                <h4>Logs:</h4>
                <div className="logs-container">
                  {jobLogs.logs?.map((log: any, index: number) => (
                    <div key={index} className={`log-entry ${log.type}`}>
                      <span className="log-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .training-dashboard {
          padding: 20px;
          background: #1a1a1a;
          color: white;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #333;
          padding-bottom: 20px;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #00ff88;
        }

        .retrain-btn {
          background: linear-gradient(135deg, #00ff88, #00cc66);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .retrain-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .retrain-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dashboard-content {
          display: grid;
          gap: 30px;
        }

        .jobs-section, .history-section, .metrics-section, .feedback-section {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #333;
        }

        .jobs-section h3, .history-section h3, .metrics-section h3, .feedback-section h3 {
          margin-top: 0;
          color: #00ff88;
        }

        .no-jobs {
          text-align: center;
          padding: 40px;
          color: #888;
        }

        .jobs-list {
          display: grid;
          gap: 15px;
        }

        .job-card {
          background: #333;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #444;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .job-id {
          font-family: monospace;
          font-size: 14px;
        }

        .job-status {
          font-weight: bold;
          font-size: 12px;
        }

        .job-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .error {
          color: #ff4444;
        }

        .view-logs-btn {
          background: #444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }

        .view-logs-btn:hover {
          background: #555;
        }

        .history-table {
          overflow-x: auto;
        }

        .history-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .history-table th,
        .history-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #444;
        }

        .history-table th {
          background: #333;
          color: #00ff88;
        }

        .hash {
          font-family: monospace;
          font-size: 12px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background: #333;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .metric-card h4 {
          margin: 0 0 10px 0;
          color: #888;
          font-size: 14px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #00ff88;
        }

        .feedback-form {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr auto;
          gap: 10px;
          align-items: center;
        }

        .feedback-form input {
          padding: 10px;
          border: 1px solid #444;
          border-radius: 4px;
          background: #333;
          color: white;
        }

        .feedback-form button {
          background: #00ff88;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .logs-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .logs-content {
          background: #2a2a2a;
          border-radius: 12px;
          max-width: 80vw;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #444;
        }

        .logs-header h3 {
          margin: 0;
          color: #00ff88;
        }

        .logs-header button {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }

        .logs-body {
          padding: 20px;
          overflow-y: auto;
        }

        .job-info {
          margin-bottom: 20px;
        }

        .job-results {
          margin-bottom: 20px;
        }

        .job-results pre {
          background: #333;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .logs-container {
          max-height: 300px;
          overflow-y: auto;
          background: #333;
          border-radius: 4px;
          padding: 10px;
        }

        .log-entry {
          display: flex;
          gap: 10px;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .log-entry.stderr {
          color: #ff4444;
        }

        .log-time {
          color: #888;
          min-width: 80px;
        }

        .log-message {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default TrainingDashboard;
