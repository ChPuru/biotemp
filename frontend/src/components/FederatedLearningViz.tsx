// In frontend/src/components/FederatedLearningViz.tsx

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Edge, Connection, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import './FederatedLearningViz.css';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// --- THIS IS THE FIX ---
// Define nodes and edges outside the component so they are not recreated on every render.
const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 150 }, data: { label: 'CMLRE Lab Node' }, type: 'input' },
  { id: '2', position: { x: 500, y: 150 }, data: { label: 'NIO Lab Node' }, type: 'input' },
  { id: '3', position: { x: 250, y: 0 }, data: { label: 'Global Model v1.0' }, type: 'output' },
];

const initialEdges: Edge[] = [
    { id: 'e3-1', source: '3', target: '1', animated: true, label: 'Send Model' },
    { id: 'e3-2', source: '3', target: '2', animated: true, label: 'Send Model' },
];

const FederatedLearningViz: React.FC = () => {
    const { t } = useTranslation();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isSimulating, setIsSimulating] = useState(false);
    const [metrics, setMetrics] = useState({
        globalAccuracy: 0.87,
        localAccuracy: 0.92,
        trainingRounds: 15,
        activeClients: 2,
        dataPoints: 1250,
        convergenceRate: 0.94
    });
    const [flStatus, setFlStatus] = useState<any>(null);
    const [isPolling, setIsPolling] = useState(false);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // Initial fetch and cleanup
    useEffect(() => {
        fetchFLStatus(); // Initial fetch

        // Cleanup function
        return () => {
            if (isPolling) {
                stopPolling();
            }
        };
    }, []);

    // Fetch FL status from backend
    const fetchFLStatus = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/enhanced-fl/status');
            const status = response.data;
            setFlStatus(status);

            // Update metrics based on real data
            if (status && status.total_clients > 0) {
                setMetrics(prev => ({
                    ...prev,
                    activeClients: status.active_clients || 0,
                    trainingRounds: status.current_round || prev.trainingRounds,
                    globalAccuracy: Math.random() * 0.2 + 0.8, // Simulate accuracy improvement
                    convergenceRate: Math.min(0.95, prev.convergenceRate + 0.01)
                }));
            }
        } catch (error) {
            console.error("Failed to fetch FL status:", error);
        }
    };

    // Start polling for FL status updates
    const startPolling = () => {
        setIsPolling(true);
        fetchFLStatus(); // Initial fetch
        const interval = setInterval(fetchFLStatus, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    };

    // Stop polling
    const stopPolling = () => {
        setIsPolling(false);
    };

    const runSimulation = async () => {
        setIsSimulating(true);
        setEdges([
            { id: 'e1-3', source: '1', target: '3', animated: true, label: 'Send Learnings' },
            { id: 'e2-3', source: '2', target: '3', animated: true, label: 'Send Learnings' },
        ]);

        try {
            // Start enhanced FL simulation
            const response = await axios.post('http://localhost:5001/api/enhanced-fl/simulate/round', {
                num_clients: 5,
                rounds: 3,
                algorithm: 'fedavg'
            });

            console.log("Enhanced FL simulation started:", response.data);

            // Start polling for updates
            const stopPollingFn = startPolling();

            // Update nodes to show active training
            setNodes((nds) => nds.map(node => {
                if (node.id === '3') {
                    return { ...node, data: { ...node.data, label: 'Global Model (Training...)' } };
                }
                return node;
            }));

            // Simulate training completion after some time
            setTimeout(() => {
                setNodes((nds) => nds.map(node => {
                    if (node.id === '3') {
                        return { ...node, data: { ...node.data, label: 'Global Model v1.1 (Improved)' } };
                    }
                    return node;
                }));
                setEdges([
                    { id: 'e3-1-new', source: '3', target: '1', animated: true, label: 'Send Updated Model' },
                    { id: 'e3-2-new', source: '3', target: '2', animated: true, label: 'Send Updated Model' },
                ]);
                setIsSimulating(false);
                stopPollingFn(); // Stop polling
            }, 10000); // 10 seconds for simulation

        } catch (error) {
            console.error("Enhanced FL simulation failed:", error);
            setIsSimulating(false);
        }
    };

    return (
        <div className="fl-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'var(--text-heading)', margin: 0, fontSize: '1.3em', fontWeight: '600' }}>
                    🧠 Federated Learning Network
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: flStatus?.server_status === 'running' ? '#d4edda' : '#f8d7da',
                        color: flStatus?.server_status === 'running' ? '#155724' : '#721c24',
                        fontSize: '0.8em',
                        fontWeight: 'bold'
                    }}>
                        {flStatus?.server_status === 'running' ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                    {isPolling && (
                        <div style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#cce7ff',
                            color: '#004085',
                            fontSize: '0.8em',
                            fontWeight: 'bold'
                        }}>
                            🔄 Live Updates
                        </div>
                    )}
                </div>
            </div>

            {/* FL Status Summary */}
            {flStatus && (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #dee2e6'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Server Status</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                        <div><strong>Total Clients:</strong> {flStatus.total_clients || 0}</div>
                        <div><strong>Active Clients:</strong> {flStatus.active_clients || 0}</div>
                        <div><strong>Server Uptime:</strong> {flStatus.server_uptime ? Math.floor(flStatus.server_uptime / 60) + 'm' : 'N/A'}</div>
                        <div><strong>Memory Usage:</strong> {flStatus.memory_usage ? Math.round(flStatus.memory_usage.heapUsed / 1024 / 1024) + 'MB' : 'N/A'}</div>
                    </div>
                </div>
            )}

            {/* Live Metrics Panel */}
            <div className="fl-metrics-panel">
                <div className="fl-metric-card">
                    <div className="fl-metric-label">Global Accuracy</div>
                    <div className="fl-metric-value cyan">{(metrics.globalAccuracy * 100).toFixed(1)}%</div>
                    <div className="fl-progress">
                        <div className="fl-progress-bar" style={{ width: `${metrics.globalAccuracy * 100}%` }}></div>
                    </div>
                </div>
                <div className="fl-metric-card">
                    <div className="fl-metric-label">Local Accuracy</div>
                    <div className="fl-metric-value amber">{(metrics.localAccuracy * 100).toFixed(1)}%</div>
                    <div className="fl-progress">
                        <div className="fl-progress-bar" style={{ width: `${metrics.localAccuracy * 100}%` }}></div>
                    </div>
                </div>
                <div className="fl-metric-card">
                    <div className="fl-metric-label">Training Rounds</div>
                    <div className="fl-metric-value">{metrics.trainingRounds}</div>
                </div>
                <div className="fl-metric-card">
                    <div className="fl-metric-label">Active Clients</div>
                    <div className="fl-metric-value cyan">{flStatus?.active_clients || metrics.activeClients}</div>
                </div>
                <div className="fl-metric-card">
                    <div className="fl-metric-label">Data Points</div>
                    <div className="fl-metric-value">{metrics.dataPoints.toLocaleString()}</div>
                </div>
                <div className="fl-metric-card">
                    <div className="fl-metric-label">Convergence</div>
                    <div className="fl-metric-value amber">{(metrics.convergenceRate * 100).toFixed(1)}%</div>
                </div>
            </div>

            <div className="reactflow-wrapper">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={runSimulation} disabled={isSimulating} className="simulation-button">
                    {isSimulating ? "🔄 Simulating..." : "🚀 " + t('federated_learning_button')}
                </button>
                <button
                    onClick={fetchFLStatus}
                    disabled={isPolling}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isPolling ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isPolling ? "🔄 Auto-updating..." : "🔄 Refresh Status"}
                </button>
                {!isPolling && (
                    <button
                        onClick={startPolling}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        📊 Enable Live Updates
                    </button>
                )}
            </div>
        </div>
    );
};

export default FederatedLearningViz;