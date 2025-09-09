// In frontend/src/components/FederatedLearningViz.tsx

import React, { useState, useCallback } from 'react';
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

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const runSimulation = async () => {
        setIsSimulating(true);
        setEdges([
            { id: 'e1-3', source: '1', target: '3', animated: true, label: 'Send Learnings' },
            { id: 'e2-3', source: '2', target: '3', animated: true, label: 'Send Learnings' },
        ]);

        try {
            await axios.post('http://localhost:5001/api/analysis/federated-learning/start');
        } catch (error) {
            console.error("FL simulation failed:", error);
        }

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
        }, 3000);
    };

    return (
        <>
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
            <button onClick={runSimulation} disabled={isSimulating} className="simulation-button">
                {isSimulating ? "Simulating..." : t('federated_learning_button')}
            </button>
        </>
    );
};

export default FederatedLearningViz;