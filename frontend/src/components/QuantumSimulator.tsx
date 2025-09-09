import React, { useState, useEffect } from 'react';
import './QuantumSimulator.css';

interface QuantumJob {
  job_id: string;
  algorithm: string;
  parameters: any;
  status: string;
  result?: any;
  error?: string;
  submitted_at: string;
  completed_at?: string;
}

interface QuantumAlgorithm {
  name: string;
  description: string;
  use_cases: string[];
}

const QuantumSimulator: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<QuantumAlgorithm[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [parameters, setParameters] = useState<any>({});
  const [jobs, setJobs] = useState<QuantumJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAlgorithms();
    fetchJobs();
  }, []);

  const fetchAlgorithms = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/quantum/algorithms');
      const data = await response.json();
      if (data.success) {
        setAlgorithms(data.algorithms);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch algorithms');
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/quantum/jobs');
      const data = await response.json();
      if (data.success) {
        setJobs([...data.active_jobs, ...data.job_history]);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const submitJob = async () => {
    if (!selectedAlgorithm) {
      setError('Please select an algorithm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/quantum/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          parameters: parameters,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setJobs(prev => [data, ...prev]);
        setParameters({});
        setSelectedAlgorithm('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit quantum job');
    } finally {
      setLoading(false);
    }
  };

  const getAlgorithmParameters = (algorithm: string) => {
    const paramTemplates = {
      grover_search: {
        database_size: 1000,
        target_species: 'Panthera tigris',
        search_criteria: {
          habitat: 'forest',
          status: 'endangered'
        }
      },
      quantum_annealing: {
        problem_type: 'habitat_optimization',
        n_variables: 15,
        constraints: {
          max_habitats: 7,
          min_distance: 2
        }
      },
      vqe: {
        molecule: 'H2O',
        basis_set: 'sto-3g',
        n_qubits: 4
      },
      qaoa: {
        problem_graph: {
          nodes: Array.from({length: 10}, (_, i) => i)
        },
        p_layers: 3,
        optimization_method: 'COBYLA'
      },
      qml: {
        dataset_size: 100,
        n_features: 8,
        n_classes: 5
      }
    };

    return paramTemplates[algorithm as keyof typeof paramTemplates] || {};
  };

  const handleAlgorithmChange = (algorithm: string) => {
    setSelectedAlgorithm(algorithm);
    setParameters(getAlgorithmParameters(algorithm));
  };

  const updateParameter = (key: string, value: any) => {
    setParameters((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const renderParameterInput = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="parameter-group">
          <label>{key}:</label>
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="parameter-subgroup">
              <label>{subKey}:</label>
              <input
                type="text"
                value={subValue as string}
                placeholder={`Enter ${subKey}`}
                aria-label={`${key} ${subKey}`}
                onChange={(e) => {
                  const newValue = { ...value, [subKey]: e.target.value };
                  updateParameter(key, newValue);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div key={key} className="parameter-input">
        <label>{key}:</label>
        <input
          type={typeof value === 'number' ? 'number' : 'text'}
          value={value}
          placeholder={`Enter ${key}`}
          aria-label={key}
          onChange={(e) => {
            const newValue = typeof value === 'number' ? parseFloat(e.target.value) : e.target.value;
            updateParameter(key, newValue);
          }}
        />
      </div>
    );
  };

  return (
    <div className="quantum-simulator">
      <div className="quantum-header">
        <h2>Quantum Computing Simulator</h2>
        <p>Simulate quantum algorithms for biodiversity analysis and optimization</p>
      </div>

      <div className="quantum-content">
        <div className="quantum-controls">
          <div className="algorithm-selection">
            <h3>Select Quantum Algorithm</h3>
            <select
              value={selectedAlgorithm}
              aria-label="Select quantum algorithm"
              onChange={(e) => handleAlgorithmChange(e.target.value)}
            >
              <option value="">Choose an algorithm...</option>
              {algorithms.map((alg) => (
                <option key={alg.name} value={alg.name}>
                  {alg.name.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>

            {selectedAlgorithm && (
              <div className="algorithm-info">
                <h4>Algorithm Description</h4>
                <p>{algorithms.find(alg => alg.name === selectedAlgorithm)?.description}</p>
                
                <h4>Use Cases</h4>
                <ul>
                  {algorithms.find(alg => alg.name === selectedAlgorithm)?.use_cases.map((useCase, index) => (
                    <li key={index}>{useCase}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {selectedAlgorithm && (
            <div className="parameters-section">
              <h3>Algorithm Parameters</h3>
              {Object.entries(parameters).map(([key, value]) => 
                renderParameterInput(key, value)
              )}
            </div>
          )}

          <div className="submit-section">
            <button
              onClick={submitJob}
              disabled={loading || !selectedAlgorithm}
              className="submit-button"
            >
              {loading ? 'Submitting...' : 'Submit Quantum Job'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="quantum-results">
          <h3>Quantum Job Results</h3>
          <div className="jobs-list">
            {jobs.length === 0 ? (
              <p>No quantum jobs submitted yet.</p>
            ) : (
              jobs.map((job) => (
                <div key={job.job_id} className="job-card">
                  <div className="job-header">
                    <h4>{job.algorithm.replace(/_/g, ' ').toUpperCase()}</h4>
                    <span className={`job-status ${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="job-details">
                    <p><strong>Job ID:</strong> {job.job_id}</p>
                    <p><strong>Submitted:</strong> {new Date(job.submitted_at).toLocaleString()}</p>
                    {job.completed_at && (
                      <p><strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}</p>
                    )}
                  </div>

                  {job.result && (
                    <div className="job-result">
                      <h5>Results:</h5>
                      <pre>{JSON.stringify(job.result, null, 2)}</pre>
                    </div>
                  )}

                  {job.error && (
                    <div className="job-error">
                      <h5>Error:</h5>
                      <p>{job.error}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumSimulator;
