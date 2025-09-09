import React, { useState, useEffect } from 'react';
import './FederatedLearningSimulator.css';

interface FLRound {
  round_number: number;
  start_time: string;
  end_time: string;
  participating_clients: number;
  global_accuracy: number;
  convergence_score: number;
  privacy_cost: number;
  client_contributions: ClientContribution[];
  simulation?: boolean;
}

interface ClientContribution {
  client_id: string;
  local_accuracy: number;
  data_size: number;
  contribution_weight: number;
}

interface FLStatus {
  server_status: string;
  active_clients: number;
  total_clients: number;
  clients: any[];
  fl_rounds: number;
  current_round: number;
}

const FederatedLearningSimulator: React.FC = () => {
  const [status, setStatus] = useState<FLStatus | null>(null);
  const [rounds, setRounds] = useState<FLRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [simulationParams, setSimulationParams] = useState({
    num_clients: 3,
    rounds: 1
  });

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch FL status:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/history');
      const data = await response.json();
      if (data.success) {
        setRounds(data.fl_rounds);
      }
    } catch (err) {
      console.error('Failed to fetch FL history:', err);
    }
  };

  const startServer = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/start-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: 'localhost',
          port: 8765
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to start FL server');
    } finally {
      setLoading(false);
    }
  };

  const stopServer = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/stop-server', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to stop FL server');
    } finally {
      setLoading(false);
    }
  };

  const startClient = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/start-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: `client_${Date.now()}`
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to start FL client');
    } finally {
      setLoading(false);
    }
  };

  const stopClients = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/stop-clients', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to stop FL clients');
    } finally {
      setLoading(false);
    }
  };

  const simulateRound = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationParams),
      });

      const data = await response.json();
      if (data.success) {
        setRounds(prev => [...prev, ...data.round_results]);
        await fetchStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to simulate FL round');
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/federated-learning/reset', {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setRounds([]);
        await fetchStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reset FL system');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#4caf50';
      case 'stopped':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  return (
    <div className="fl-simulator">
      <div className="fl-header">
        <h2>Federated Learning Simulator</h2>
        <p>Simulate distributed machine learning for biodiversity analysis</p>
      </div>

      <div className="fl-content">
        <div className="fl-controls">
          <div className="server-controls">
            <h3>Server Management</h3>
            <div className="control-buttons">
              <button
                onClick={startServer}
                disabled={loading || status?.server_status === 'running'}
                className="control-button start-button"
              >
                Start FL Server
              </button>
              <button
                onClick={stopServer}
                disabled={loading || status?.server_status === 'stopped'}
                className="control-button stop-button"
              >
                Stop FL Server
              </button>
            </div>
          </div>

          <div className="client-controls">
            <h3>Client Management</h3>
            <div className="control-buttons">
              <button
                onClick={startClient}
                disabled={loading || status?.server_status === 'stopped'}
                className="control-button start-button"
              >
                Add Client
              </button>
              <button
                onClick={stopClients}
                disabled={loading || status?.active_clients === 0}
                className="control-button stop-button"
              >
                Stop All Clients
              </button>
            </div>
          </div>

          <div className="simulation-controls">
            <h3>Simulation Parameters</h3>
            <div className="parameter-inputs">
              <div className="parameter-input">
                <label>Number of Clients:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={simulationParams.num_clients}
                  onChange={(e) => setSimulationParams(prev => ({
                    ...prev,
                    num_clients: parseInt(e.target.value)
                  }))}
                />
              </div>
              <div className="parameter-input">
                <label>Number of Rounds:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={simulationParams.rounds}
                  onChange={(e) => setSimulationParams(prev => ({
                    ...prev,
                    rounds: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>
            <div className="control-buttons">
              <button
                onClick={simulateRound}
                disabled={loading}
                className="control-button simulate-button"
              >
                Simulate FL Round
              </button>
              <button
                onClick={resetSystem}
                disabled={loading}
                className="control-button reset-button"
              >
                Reset System
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="fl-status">
          <h3>System Status</h3>
          {status ? (
            <div className="status-cards">
              <div className="status-card">
                <h4>Server Status</h4>
                <div className="status-indicator">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(status.server_status) }}
                  ></span>
                  <span className="status-text">{status.server_status}</span>
                </div>
              </div>

              <div className="status-card">
                <h4>Active Clients</h4>
                <div className="status-value">{status.active_clients}</div>
              </div>

              <div className="status-card">
                <h4>Total Clients</h4>
                <div className="status-value">{status.total_clients}</div>
              </div>

              <div className="status-card">
                <h4>FL Rounds</h4>
                <div className="status-value">{status.fl_rounds}</div>
              </div>

              <div className="status-card">
                <h4>Current Round</h4>
                <div className="status-value">{status.current_round}</div>
              </div>
            </div>
          ) : (
            <p>Loading status...</p>
          )}
        </div>

        <div className="fl-results">
          <h3>Federated Learning Results</h3>
          <div className="rounds-list">
            {rounds.length === 0 ? (
              <p>No FL rounds completed yet.</p>
            ) : (
              rounds.map((round) => (
                <div key={round.round_number} className="round-card">
                  <div className="round-header">
                    <h4>Round {round.round_number}</h4>
                    <span className="round-status">
                      {round.simulation ? 'Simulated' : 'Real'}
                    </span>
                  </div>

                  <div className="round-metrics">
                    <div className="metric">
                      <label>Global Accuracy:</label>
                      <span className="metric-value">
                        {(round.global_accuracy * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="metric">
                      <label>Convergence Score:</label>
                      <span className="metric-value">
                        {(round.convergence_score * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="metric">
                      <label>Participants:</label>
                      <span className="metric-value">
                        {round.participating_clients}
                      </span>
                    </div>
                    <div className="metric">
                      <label>Privacy Cost:</label>
                      <span className="metric-value">
                        {round.privacy_cost.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div className="client-contributions">
                    <h5>Client Contributions:</h5>
                    <div className="contributions-grid">
                      {round.client_contributions.map((client, index) => (
                        <div key={index} className="contribution-card">
                          <div className="client-id">{client.client_id}</div>
                          <div className="contribution-metrics">
                            <div>Accuracy: {(client.local_accuracy * 100).toFixed(1)}%</div>
                            <div>Data Size: {client.data_size}</div>
                            <div>Weight: {client.contribution_weight.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="round-timing">
                    <small>
                      Started: {new Date(round.start_time).toLocaleString()}
                      <br />
                      Completed: {new Date(round.end_time).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FederatedLearningSimulator;
