import React, { useState, useEffect, useCallback } from 'react';
import InteractiveChart from './InteractiveChart';
import ProgressIndicator from './ProgressIndicator';
import ExportOptions from './ExportOptions';
import './BenchmarkDashboard.css';

interface BenchmarkResult {
  id: string;
  name: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    runtime: number; // in seconds
    memoryUsage: number; // in MB
    cpuUsage: number; // percentage
    cost: number; // in USD
    throughput: number; // samples per second
  };
  pipeline: {
    name: string;
    version: string;
    configuration: any;
  };
  dataset: {
    name: string;
    size: number;
    samples: number;
    features: number;
  };
  environment: {
    hardware: string;
    os: string;
    pythonVersion: string;
    dependencies: any;
  };
}

interface CostAnalysis {
  totalCost: number;
  breakdown: {
    compute: number;
    storage: number;
    network: number;
    personnel: number;
    infrastructure: number;
  };
  costPerSample: number;
  costPerHour: number;
  projectedMonthly: number;
  recommendations: string[];
}

interface PerformanceMetrics {
  averageAccuracy: number;
  averageRuntime: number;
  averageCost: number;
  bestPerforming: string;
  worstPerforming: string;
  improvement: {
    accuracy: number;
    runtime: number;
    cost: number;
  };
}

const BenchmarkDashboard: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkResult | null>(null);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: 'all',
    pipeline: 'all',
    dateRange: '7d'
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockBenchmarks: BenchmarkResult[] = [
      {
        id: '1',
        name: 'BioMapper vs QIIME2 Comparison',
        timestamp: new Date().toISOString(),
        status: 'completed',
        metrics: {
          accuracy: 94.2,
          precision: 92.8,
          recall: 95.1,
          f1Score: 93.9,
          runtime: 120.5,
          memoryUsage: 2048,
          cpuUsage: 85.2,
          cost: 12.50,
          throughput: 8.3
        },
        pipeline: {
          name: 'BioMapper',
          version: '1.0.0',
          configuration: { batchSize: 32, epochs: 100 }
        },
        dataset: {
          name: 'Marine Biodiversity Dataset',
          size: 1024,
          samples: 10000,
          features: 256
        },
        environment: {
          hardware: 'NVIDIA RTX 4090',
          os: 'Ubuntu 22.04',
          pythonVersion: '3.9.7',
          dependencies: { tensorflow: '2.10.0', 'scikit-learn': '1.1.0' }
        }
      },
      {
        id: '2',
        name: 'Performance Optimization Test',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
        metrics: {
          accuracy: 91.5,
          precision: 89.2,
          recall: 93.8,
          f1Score: 91.4,
          runtime: 95.2,
          memoryUsage: 1536,
          cpuUsage: 78.5,
          cost: 8.75,
          throughput: 10.5
        },
        pipeline: {
          name: 'QIIME2',
          version: '2022.8',
          configuration: { threads: 8, memory: '4GB' }
        },
        dataset: {
          name: 'Soil Microbiome Dataset',
          size: 512,
          samples: 5000,
          features: 128
        },
        environment: {
          hardware: 'Intel i7-12700K',
          os: 'Windows 11',
          pythonVersion: '3.8.10',
          dependencies: { qiime2: '2022.8.0', pandas: '1.4.0' }
        }
      },
      {
        id: '3',
        name: 'Cost Analysis Benchmark',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'running',
        metrics: {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          runtime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          cost: 0,
          throughput: 0
        },
        pipeline: {
          name: 'nf-core/ampliseq',
          version: '2.0.0',
          configuration: { profile: 'docker', max_cpus: 16 }
        },
        dataset: {
          name: 'Freshwater Metagenomics',
          size: 2048,
          samples: 20000,
          features: 512
        },
        environment: {
          hardware: 'AWS c5.4xlarge',
          os: 'Amazon Linux 2',
          pythonVersion: '3.9.0',
          dependencies: { nextflow: '22.10.0', singularity: '3.8.0' }
        }
      }
    ];

    setBenchmarks(mockBenchmarks);

    // Mock cost analysis
    setCostAnalysis({
      totalCost: 1250.75,
      breakdown: {
        compute: 650.25,
        storage: 180.50,
        network: 95.00,
        personnel: 250.00,
        infrastructure: 75.00
      },
      costPerSample: 0.125,
      costPerHour: 15.75,
      projectedMonthly: 3780.00,
      recommendations: [
        'Switch to spot instances for non-critical workloads',
        'Implement data compression to reduce storage costs',
        'Use reserved instances for predictable workloads',
        'Optimize batch sizes to improve GPU utilization'
      ]
    });

    // Mock performance metrics
    setPerformanceMetrics({
      averageAccuracy: 92.85,
      averageRuntime: 107.85,
      averageCost: 10.625,
      bestPerforming: 'BioMapper',
      worstPerforming: 'QIIME2',
      improvement: {
        accuracy: 2.7,
        runtime: -25.3,
        cost: -3.75
      }
    });
  }, []);

  const filteredBenchmarks = benchmarks.filter(benchmark => {
    const statusMatch = filter.status === 'all' || benchmark.status === filter.status;
    const pipelineMatch = filter.pipeline === 'all' || benchmark.pipeline.name === filter.pipeline;
    return statusMatch && pipelineMatch;
  });

  const getChartData = () => {
    const completedBenchmarks = benchmarks.filter(b => b.status === 'completed');
    
    return {
      accuracy: completedBenchmarks.map(b => ({
        id: b.id,
        label: b.pipeline.name,
        value: b.metrics.accuracy,
        color: b.pipeline.name === 'BioMapper' ? '#4CAF50' : '#2196F3'
      })),
      runtime: completedBenchmarks.map(b => ({
        id: b.id,
        label: b.pipeline.name,
        value: b.metrics.runtime,
        color: b.pipeline.name === 'BioMapper' ? '#4CAF50' : '#2196F3'
      })),
      cost: completedBenchmarks.map(b => ({
        id: b.id,
        label: b.pipeline.name,
        value: b.metrics.cost,
        color: b.pipeline.name === 'BioMapper' ? '#4CAF50' : '#2196F3'
      }))
    };
  };

  const handleBenchmarkClick = useCallback((benchmark: BenchmarkResult) => {
    setSelectedBenchmark(benchmark);
  }, []);

  const handleExport = useCallback((format: string, data: any) => {
    console.log(`Exporting benchmark data as ${format}:`, data);
    // Implement actual export logic here
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'var(--accent-success)';
      case 'running': return 'var(--accent-primary)';
      case 'failed': return 'var(--accent-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const chartData = getChartData();

  return (
    <div className="benchmark-dashboard">
      <div className="dashboard-header">
        <h2>Benchmark Dashboard</h2>
        <div className="dashboard-controls">
          <div className="filter-controls">
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filter.pipeline}
              onChange={(e) => setFilter(prev => ({ ...prev, pipeline: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Pipelines</option>
              <option value="BioMapper">BioMapper</option>
              <option value="QIIME2">QIIME2</option>
              <option value="nf-core/ampliseq">nf-core/ampliseq</option>
            </select>
          </div>
          <ExportOptions
            data={benchmarks}
            filename="benchmark-results"
            onExport={handleExport}
          />
        </div>
      </div>

      <div className="dashboard-content">
        {/* Performance Overview */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <h3>Average Accuracy</h3>
              <span className="metric-icon">🎯</span>
            </div>
            <div className="metric-value">
              {performanceMetrics?.averageAccuracy.toFixed(1)}%
            </div>
            <div className="metric-change positive">
              +{performanceMetrics?.improvement.accuracy.toFixed(1)}% vs baseline
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3>Average Runtime</h3>
              <span className="metric-icon">⏱️</span>
            </div>
            <div className="metric-value">
              {performanceMetrics?.averageRuntime.toFixed(1)}s
            </div>
            <div className="metric-change positive">
              {performanceMetrics?.improvement.runtime.toFixed(1)}s faster
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3>Average Cost</h3>
              <span className="metric-icon">💰</span>
            </div>
            <div className="metric-value">
              ${performanceMetrics?.averageCost.toFixed(2)}
            </div>
            <div className="metric-change positive">
              ${performanceMetrics?.improvement.cost.toFixed(2)} savings
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <h3>Best Performer</h3>
              <span className="metric-icon">🏆</span>
            </div>
            <div className="metric-value">
              {performanceMetrics?.bestPerforming}
            </div>
            <div className="metric-change">
              Leading in all metrics
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <InteractiveChart
              data={chartData.accuracy}
              type="bar"
              title="Accuracy Comparison"
              height={300}
            />
          </div>
          <div className="chart-container">
            <InteractiveChart
              data={chartData.runtime}
              type="bar"
              title="Runtime Comparison (seconds)"
              height={300}
            />
          </div>
          <div className="chart-container">
            <InteractiveChart
              data={chartData.cost}
              type="pie"
              title="Cost Distribution"
              height={300}
            />
          </div>
        </div>

        {/* Cost Analysis */}
        {costAnalysis && (
          <div className="cost-analysis">
            <h3>Cost Analysis</h3>
            <div className="cost-breakdown">
              <div className="cost-chart">
                <InteractiveChart
                  data={Object.entries(costAnalysis.breakdown).map(([key, value]) => ({
                    id: key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    value: value,
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`
                  }))}
                  type="pie"
                  title="Cost Breakdown"
                  height={250}
                />
              </div>
              <div className="cost-metrics">
                <div className="cost-metric">
                  <span className="cost-label">Total Cost:</span>
                  <span className="cost-value">${costAnalysis.totalCost.toFixed(2)}</span>
                </div>
                <div className="cost-metric">
                  <span className="cost-label">Cost per Sample:</span>
                  <span className="cost-value">${costAnalysis.costPerSample.toFixed(3)}</span>
                </div>
                <div className="cost-metric">
                  <span className="cost-label">Cost per Hour:</span>
                  <span className="cost-value">${costAnalysis.costPerHour.toFixed(2)}</span>
                </div>
                <div className="cost-metric">
                  <span className="cost-label">Projected Monthly:</span>
                  <span className="cost-value">${costAnalysis.projectedMonthly.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="recommendations">
              <h4>Cost Optimization Recommendations</h4>
              <ul>
                {costAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Benchmark Results Table */}
        <div className="benchmark-results">
          <h3>Benchmark Results</h3>
          <div className="results-table">
            <div className="table-header">
              <div className="header-cell">Pipeline</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Accuracy</div>
              <div className="header-cell">Runtime</div>
              <div className="header-cell">Cost</div>
              <div className="header-cell">Actions</div>
            </div>
            {filteredBenchmarks.map(benchmark => (
              <div
                key={benchmark.id}
                className="table-row"
                onClick={() => handleBenchmarkClick(benchmark)}
              >
                <div className="table-cell">
                  <div className="pipeline-info">
                    <span className="pipeline-name">{benchmark.pipeline.name}</span>
                    <span className="pipeline-version">v{benchmark.pipeline.version}</span>
                  </div>
                </div>
                <div className="table-cell">
                  <span
                    className="status-badge"
                    style={{ color: getStatusColor(benchmark.status) }}
                  >
                    {getStatusIcon(benchmark.status)} {benchmark.status}
                  </span>
                </div>
                <div className="table-cell">
                  {benchmark.status === 'completed' ? `${benchmark.metrics.accuracy.toFixed(1)}%` : '-'}
                </div>
                <div className="table-cell">
                  {benchmark.status === 'completed' ? `${benchmark.metrics.runtime.toFixed(1)}s` : '-'}
                </div>
                <div className="table-cell">
                  {benchmark.status === 'completed' ? `$${benchmark.metrics.cost.toFixed(2)}` : '-'}
                </div>
                <div className="table-cell">
                  <button className="action-button">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benchmark Detail Modal */}
      {selectedBenchmark && (
        <div className="benchmark-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedBenchmark.name}</h3>
              <button
                className="close-button"
                onClick={() => setSelectedBenchmark(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="benchmark-details">
                <div className="detail-section">
                  <h4>Metrics</h4>
                  <div className="metrics-grid-small">
                    <div className="metric-item">
                      <span className="metric-label">Accuracy:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Precision:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.precision.toFixed(1)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Recall:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.recall.toFixed(1)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">F1 Score:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.f1Score.toFixed(1)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Runtime:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.runtime.toFixed(1)}s</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Memory Usage:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.memoryUsage}MB</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">CPU Usage:</span>
                      <span className="metric-value">{selectedBenchmark.metrics.cpuUsage.toFixed(1)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Cost:</span>
                      <span className="metric-value">${selectedBenchmark.metrics.cost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Environment</h4>
                  <div className="environment-info">
                    <div className="env-item">
                      <span className="env-label">Hardware:</span>
                      <span className="env-value">{selectedBenchmark.environment.hardware}</span>
                    </div>
                    <div className="env-item">
                      <span className="env-label">OS:</span>
                      <span className="env-value">{selectedBenchmark.environment.os}</span>
                    </div>
                    <div className="env-item">
                      <span className="env-label">Python Version:</span>
                      <span className="env-value">{selectedBenchmark.environment.pythonVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Dataset</h4>
                  <div className="dataset-info">
                    <div className="dataset-item">
                      <span className="dataset-label">Name:</span>
                      <span className="dataset-value">{selectedBenchmark.dataset.name}</span>
                    </div>
                    <div className="dataset-item">
                      <span className="dataset-label">Size:</span>
                      <span className="dataset-value">{selectedBenchmark.dataset.size}MB</span>
                    </div>
                    <div className="dataset-item">
                      <span className="dataset-label">Samples:</span>
                      <span className="dataset-value">{selectedBenchmark.dataset.samples.toLocaleString()}</span>
                    </div>
                    <div className="dataset-item">
                      <span className="dataset-label">Features:</span>
                      <span className="dataset-value">{selectedBenchmark.dataset.features}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkDashboard;