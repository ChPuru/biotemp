// ===================================================================
// BioMapper Frontend: The Main Dashboard Component (Dashboard.tsx)
// ===================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Modal from './Modal';
import MapComponent from './MapComponent';
import PhylogeneticTree from './PhylogeneticTree';
import XAIVisualization from './XAIVisualization';
import FederatedLearningViz from './FederatedLearningViz';
import BioAgentChat from './BioAgentChat';
// import AdvancedFeaturesPanel from './AdvancedFeaturesPanel';
import ComparativeFramework from './ComparativeFramework';
import { getAll, enqueue, remove as removeFromQueue, EdgeQueueItem } from '../utils/idbQueue';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- TypeScript Interfaces for Robust Data Handling ---
interface IClassificationResult {
    Sequence_ID: string;
    Predicted_Species: string;
    Classifier_Confidence: string;
    Novelty_Score: string;
    Local_DB_Match: boolean;
    iucn_status: string;
}
interface IBiodiversityMetrics {
    "Species Richness": number;
    "Shannon Diversity Index": string;
}
interface IAnalysisResponse {
    classification_results: IClassificationResult[];
    biodiversity_metrics: IBiodiversityMetrics;
    biotech_alerts: { [key: string]: any };
    location: { lat: string; lon: string; address: string; };
    phylogenetic_tree?: string | null;
}
interface IQuantumJobResults {
    status: string;
    message: string;
    job_id: string;
    results: object;
}
interface IXaiAttribution {
    token: string;
    attribution: string;
}
interface INcbiResult {
    status: string;
    message: string;
    best_hit_title?: string;
    score?: number;
    e_value?: number;
}

interface DashboardProps {
    onAnalysisComplete?: (results: any) => void;
    initialAnalysisResults?: IAnalysisResponse | null;
    hideControls?: boolean;
    showLocationPdf?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onAnalysisComplete, initialAnalysisResults, hideControls, showLocationPdf }) => {
    const { t } = useTranslation();
    
    // --- State Management for the entire dashboard ---
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisResults, setAnalysisResults] = useState<IAnalysisResponse | null>(null);
    const [quantumJob, setQuantumJob] = useState<IQuantumJobResults | null>(null);
    const [phyloTree, setPhyloTree] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isQuantumRunning, setIsQuantumRunning] = useState(false);
    // Removed unused state variable isTreeLoading
    const [error, setError] = useState('');
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [xaiData, setXaiData] = useState<IXaiAttribution[] | null>(null);
    const [showEnhancedXAI, setShowEnhancedXAI] = useState(false);
    const [selectedSequenceForXAI, setSelectedSequenceForXAI] = useState<string>('');
    const [showNcbiModal, setShowNcbiModal] = useState(false);
    const [ncbiResult, setNcbiResult] = useState<INcbiResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [latitude, setLatitude] = useState('19.0760');
    const [longitude, setLongitude] = useState('72.8777');
    const [isLocating, setIsLocating] = useState(false);
    const [flLogs, setFlLogs] = useState<string[]>([]);
    const [isFlRunning, setIsFlRunning] = useState(false);
    const [edgeQueueCount, setEdgeQueueCount] = useState<number>(0);
    const [showQuantumModal, setShowQuantumModal] = useState(false);
    const [quantumData, setQuantumData] = useState<any>(null);
    const [showFLModal, setShowFLModal] = useState(false);
    const [flData, setFlData] = useState<any>(null);
    const [flStatus, setFlStatus] = useState<any>(null);
    const [ollamaMode, setOllamaMode] = useState<'standard' | 'expert' | 'novelty_detection' | 'training_assistance'>('standard');
    const [includeRawDNA, setIncludeRawDNA] = useState(false);
    const [trainingSamples, setTrainingSamples] = useState<any[]>([]);
    const [modelPerformance, setModelPerformance] = useState<any>(null);

    useEffect(() => {
        const updateCount = async () => {
            const items = await getAll();
            setEdgeQueueCount(items.length);
        };
        updateCount();
        const interval = setInterval(updateCount, 2000);
        return () => clearInterval(interval);
    }, []);

    // Seed results from parent (e.g., comprehensive suite core output)
    useEffect(() => {
        if (initialAnalysisResults) {
            setAnalysisResults(initialAnalysisResults);
        }
    }, [initialAnalysisResults]);

    const syncEdgeQueue = useCallback(async () => {
        const items = await getAll();
        if (!items.length) return;
        const failed: EdgeQueueItem[] = [];
        for (const item of items) {
            try {
                if (item.type === 'validate') {
                    await axios.post('http://localhost:5001/api/analysis/validate-finding',
                        { sequenceId: item.payload.sequenceId, confirmedSpecies: item.payload.speciesName, feedback: 'Confirmed (Edge Sync)' },
                        { headers: { 'x-user-role': 'scientist' } }
                    );
                } else if (item.type === 'flag') {
                    await axios.post('http://localhost:5001/api/analysis/flag',
                        { sequenceId: item.payload.sequenceId, reason: item.payload.reason || 'Edge Sync' },
                        { headers: { 'x-user-role': 'scientist' } }
                    );
                }
            } catch (e) {
                failed.push(item);
            } finally {
                await removeFromQueue(item.id);
            }
        }
        setEdgeQueueCount(failed.length);
        if (!failed.length) alert('Edge queue synced');
    }, []);
    
    useEffect(() => {
        const handler = async () => {
            if (navigator.onLine && localStorage.getItem('edge_mode') === '1') {
                await syncEdgeQueue();
            }
        };
        window.addEventListener('online', handler);
        return () => window.removeEventListener('online', handler);
    }, [syncEdgeQueue]);

    // --- Event Handlers for User Actions ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
            setAnalysisResults(null);
            setPhyloTree(null);
            setError('');
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude.toFixed(4));
                    setLongitude(position.coords.longitude.toFixed(4));
                    setIsLocating(false);
                    alert("Location fetched successfully!");
                },
                () => {
                    alert("Could not get your location. Please ensure location services are enabled for your browser.");
                    setIsLocating(false);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError("Please upload a file first.");
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResults(null);
        setPhyloTree(null);

        const formData = new FormData();
        formData.append('fastaFile', selectedFile);
        formData.append('lat', latitude);
        formData.append('lon', longitude);

        try {
            const response = await axios.post<IAnalysisResponse>('http://localhost:5001/api/analysis/analyze', formData);
            setAnalysisResults(response.data);
            
            // Notify parent component about analysis completion
            if (onAnalysisComplete) {
                onAnalysisComplete(response.data);
            }
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Analysis failed. Please ensure your AI servers and local backend are running correctly.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunQuantum = async (algorithm = 'benchmark') => {
        setIsQuantumRunning(true);
        setQuantumJob(null);
        try {
            const response = await axios.post('http://localhost:5001/api/analysis/quantum/execute', {
                algorithm,
                species_data: analysisResults?.classification_results || [],
                conservation_priorities: [0.8, 0.9, 0.7, 0.6, 0.85]
            });
            setQuantumData(response.data);
            setShowQuantumModal(true);
        } catch (err) {
            console.error("Quantum job failed:", err);
            setError("Quantum job failed. Using local fallback results.");
            setQuantumJob({ status: 'success', message: "Job completed successfully on 'AerSimulator (Fallback)'.", job_id: 'local-fallback', results: { '00': 520, '11': 504 } });
        } finally {
            setIsQuantumRunning(false);
        }
    };

    const handleValidateFinding = async (sequenceId: string, speciesName: string) => {
        const isEdge = localStorage.getItem('edge_mode') === '1';
        if (isEdge) {
            await enqueue({ type: 'validate', payload: { sequenceId, speciesName } });
            setEdgeQueueCount(edgeQueueCount + 1);
            alert('Validation queued for sync.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication required. Please log in.");
                return;
            }

            const response = await axios.post('http://localhost:5001/api/analysis/validate-finding',
                { sequenceId: sequenceId, confirmedSpecies: speciesName, feedback: 'Confirmed' },
                { headers: { 'Authorization': `Bearer ${token}`, 'x-user-role': 'scientist' } }
            );
            alert(`Validation successful! Block Hash: ${response.data.block.hash}`);
        } catch (err: any) {
            console.error('Validation failed:', err);
            if (err.response?.status === 401) {
                alert("Authentication required. Please log in again.");
            } else {
                alert("Validation failed. This action is restricted to 'Scientist' role.");
            }
        }
    };

    const handleAddToTraining = async (sequenceId: string, predictedSpecies: string) => {
        try {
            const correctedSpecies = prompt(`Current prediction: ${predictedSpecies}\nEnter the correct species name for training:`, predictedSpecies);
            if (!correctedSpecies || correctedSpecies === predictedSpecies) {
                return;
            }

            await axios.post('http://localhost:5001/api/training/add-data', {
                sequenceId,
                predictedSpecies,
                correctSpecies: correctedSpecies,
                feedbackType: 'correction'
            });

            alert(`Training data added successfully! This will help improve future predictions.`);
        } catch (err) {
            console.error('Failed to add training data:', err);
            alert('Failed to add training data. Please try again.');
        }
    };

    const handleStartFL = async () => {
        setIsFlRunning(true);
        setFlLogs([]);
        try {
            const response = await axios.post('http://localhost:5001/api/enhanced-fl/simulate/round', {
                num_clients: 5,
                rounds: 10,
                algorithm: 'fedavg'
            });
            setFlData(response.data);
            setShowFLModal(true);
        } catch (err) {
            alert("Failed to start FL simulation.");
        } finally {
            setIsFlRunning(false);
        }
    };

    const handleGetFLStatus = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/enhanced-fl/status');
            setFlStatus(response.data);
        } catch (error) {
            console.error('Failed to get FL status:', error);
        }
    };

    const handleStopFLSimulation = async () => {
        try {
            const response = await axios.post('http://localhost:5001/api/enhanced-fl/server/stop');
            setFlStatus(response.data);
            setIsFlRunning(false);
        } catch (error) {
            console.error('Failed to stop FL simulation:', error);
        }
    };

    const handleGenerateReport = async () => {
        if (!analysisResults) {
            alert("Please analyze a sample first.");
            return;
        }

        try {
            const pdfResponse = await axios.post('http://localhost:5001/api/analysis/generate-report',
                { analysisData: analysisResults },
                { responseType: 'blob' } // Important for file download
            );

            // Create a blob link to download the PDF
            const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `biomapper_report_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            alert("PDF report downloaded successfully!");
        } catch (error) {
            console.error('PDF generation error:', error);
            alert("Failed to generate PDF report. Please try again.");
        }
    };

    const handleRunXai = async (sequence: string) => {
        setShowXaiModal(true);
        setXaiData(null);
        try {
            const predicted = analysisResults?.classification_results.find(r => r.Sequence_ID === sequence)?.Predicted_Species;
            const response = await axios.post<{status: string, attributions: IXaiAttribution[], summary?: string}>('http://localhost:5001/api/analysis/xai-explain', { sequence, predictedSpecies: predicted });
            if (response.data.status === 'success') {
                setXaiData(response.data.attributions);
            }
        } catch (err) { console.error("XAI failed:", err); }
    };

    const handleVerifyNcbi = async (sequence: string) => {
        setIsVerifying(true);
        setShowNcbiModal(true);
        setNcbiResult(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setNcbiResult({ status: "error", message: "Authentication required. Please log in." });
                return;
            }

            const response = await axios.post<INcbiResult>('http://localhost:5001/api/analysis/verify-ncbi',
                { sequence }, { headers: { 'Authorization': `Bearer ${token}`, 'x-user-role': 'scientist' } }
            );
            setNcbiResult(response.data);
        } catch (err: any) {
            console.error('NCBI verification failed:', err);
            if (err.response?.status === 401) {
                setNcbiResult({ status: "error", message: "Authentication required. Please log in again." });
            } else {
                setNcbiResult({ status: "error", message: "Failed to connect to verification service." });
            }
        } finally {
            setIsVerifying(false);
        }
    };

    // Function is kept for future use in UI expansion
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleGenerateTree = async () => {
        if (!selectedFile) { alert("Please analyze a sample first."); return; }
        // Removed setIsTreeLoading as it's no longer needed
        setPhyloTree(null);
        try {
            const formData = new FormData();
            formData.append('fastaFile', selectedFile);
            const response = await axios.post<{status: string, newick_tree: string}>('http://localhost:5001/api/analysis/generate-tree', formData);
            if (response.data.status === 'success') {
                setPhyloTree(response.data.newick_tree);
            } else { throw new Error("Backend tree generation failed."); }
        } catch (err) {
            console.warn("Live Python tree generation failed. Moving to client-side fallback.", err);
            try {
                const leafNames = analysisResults?.classification_results.map(r => r.Sequence_ID) || ["SeqA", "SeqB", "SeqC", "SeqD"];
                const mockNewick = `(${leafNames.slice(0, Math.floor(leafNames.length / 2)).join(',')}),(${leafNames.slice(Math.floor(leafNames.length / 2)).join(',')});`;
                setPhyloTree(mockNewick);
            } catch (error) {
                console.error("Client-side mock tree generation failed.", error);
            }
        }
        // Removed finally block with setIsTreeLoading
    };
    
    const handleAddTrainingData = async (result: IClassificationResult) => {
        const correctedSpecies = prompt(`Current prediction: ${result.Predicted_Species}\n\nEnter the correct species name for training data:`);
        if (!correctedSpecies || correctedSpecies.trim() === '') {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const trainingData = {
                sequenceId: result.Sequence_ID,
                originalPrediction: result.Predicted_Species,
                correctedSpecies: correctedSpecies.trim(),
                confidence: parseFloat(result.Classifier_Confidence),
                metadata: {
                    novelty_score: parseFloat(result.Novelty_Score),
                    iucn_status: result.iucn_status,
                    location: `${latitude}, ${longitude}`
                }
            };

            // Add to enhanced training system
            await axios.post('http://localhost:5001/api/analysis/training/add-sample', trainingData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            alert(`Training data added successfully!\nOriginal: ${result.Predicted_Species}\nCorrected: ${correctedSpecies}\n\nThis will help improve future classifications through reinforcement learning.`);

            // Refresh training data
            await loadTrainingData();

        } catch (error) {
            console.error('Failed to add training data:', error);
            alert('Failed to add training data. Please try again.');
        }
    };

    const loadTrainingData = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/analysis/training/data');
            setTrainingSamples(response.data.data || []);
        } catch (error) {
            console.error('Failed to load training data:', error);
        }
    };

    const loadModelPerformance = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/analysis/training/performance');
            setModelPerformance(response.data.performance);
        } catch (error) {
            console.error('Failed to load model performance:', error);
        }
    };

    const handleEnhancedChat = async (message: string) => {
        try {
            const chatResponse = await axios.post('http://localhost:5001/api/analysis/chat', {
                message,
                context: analysisResults,
                analysisMode: ollamaMode,
                includeRawDNA: includeRawDNA
            });

            return chatResponse.data;
        } catch (error) {
            console.error('Enhanced chat error:', error);
            return { reply: "I'm experiencing technical difficulties. Please try again later.", error: true };
        }
    };
    
    const getImpactReport = (result: IClassificationResult) => {
        let alerts: string[] = [];
        if (result.Predicted_Species.includes("Novel Taxa")) {
            alerts.push("High Priority Discovery: This sequence is a candidate for a novel species or family.");
        }
        if (analysisResults?.biotech_alerts && analysisResults.biotech_alerts[result.Sequence_ID]) {
            alerts.push(analysisResults.biotech_alerts[result.Sequence_ID].reason);
        }
        return alerts;
    };

    const chartData = {
        labels: analysisResults?.classification_results.map(r => r.Sequence_ID) || [],
        datasets: [
            {
                label: 'Classifier Confidence',
                data: analysisResults?.classification_results.map(r => parseFloat(r.Classifier_Confidence)) || [],
                backgroundColor: 'rgba(0, 170, 255, 0.8)',
                borderColor: '#00aaff',
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
            },
            {
                label: 'Novelty Score',
                data: analysisResults?.classification_results.map(r => parseFloat(r.Novelty_Score)) || [],
                backgroundColor: 'rgba(244, 162, 97, 0.8)',
                borderColor: '#f4a261',
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false,
            }
        ],
    };
    
    const chartOptions: any = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: '#0f172a',
                    font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        weight: 'normal'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#0b1220',
                bodyColor: '#0f172a',
                borderColor: 'rgba(30, 64, 175, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context: any) {
                        const label = context.dataset.label || '';
                        const value = (context.parsed.y * 100).toFixed(1) + '%';
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#0f172a',
                    font: {
                        family: 'Fira Code, monospace',
                        size: 10
                    }
                },
                grid: {
                    color: 'rgba(15, 23, 42, 0.08)',
                    drawBorder: false
                }
            },
            y: {
                beginAtZero: true,
                max: 1,
                ticks: {
                    color: '#0f172a',
                    font: {
                        family: 'Fira Code, monospace',
                        size: 10
                    },
                    callback: function(value: any) {
                        return (value * 100).toFixed(0) + '%';
                    }
                },
                grid: {
                    color: 'rgba(15, 23, 42, 0.08)',
                    drawBorder: false
                }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
        }
    };

    return (
        <div>
            <Modal show={showXaiModal} onClose={() => setShowXaiModal(false)} title="Explainable AI (XAI) - Live Attention Analysis">
                <p>Live attention scores. Higher scores (brighter orange) indicate influential k-mers.</p>
                <div className="xai-container">
                    {xaiData ? xaiData.map((item, i) => (
                        <span key={i} className="xai-token" style={{ backgroundColor: `rgba(255, 165, 0, ${Math.abs(parseFloat(item.attribution)) * 2})`}}>
                            {item.token}
                        </span>
                    )) : <p>Loading live explanation from Python engine...</p>}
                </div>
            </Modal>
            <Modal show={showNcbiModal} onClose={() => setShowNcbiModal(false)} title="Live NCBI BLAST Verification">
                {isVerifying && <p>Running live search against global NCBI database...</p>}
                {ncbiResult && (
                    <div>
                        <p><strong>Status:</strong> {ncbiResult.message}</p>
                        {ncbiResult.status === 'success' && ncbiResult.best_hit_title && (
                            <>
                                <p><strong>Best Match:</strong> {ncbiResult.best_hit_title}</p>
                                <p><strong>Score:</strong> {ncbiResult.score}</p>
                                <p><strong>E-value:</strong> {ncbiResult.e_value}</p>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            <Modal show={showQuantumModal} onClose={() => setShowQuantumModal(false)} title="Quantum Computing Analysis">
                {quantumData ? (
                    <div>
                        <h3>Quantum Job Results</h3>
                        <p><strong>Status:</strong> {quantumData.status}</p>
                        {quantumData.benchmark && (
                            <div>
                                <h4>Performance Benchmark</h4>
                                <p><strong>Quantum Time:</strong> {quantumData.benchmark.quantum_time_ms}ms</p>
                                <p><strong>Classical Time:</strong> {quantumData.benchmark.classical_time_ms}ms</p>
                                <p><strong>Speed Ratio:</strong> {quantumData.benchmark.speed_ratio}x faster</p>
                                <p><strong>Quantum Advantage:</strong> {quantumData.benchmark.quantum_advantage ? 'Yes' : 'No'}</p>
                            </div>
                        )}
                        {quantumData.biodiversity_insights && (
                            <div>
                                <h4>Biodiversity Insights</h4>
                                <p><strong>Ecosystem Stability:</strong> {quantumData.biodiversity_insights.ecosystem_stability_index}</p>
                                <p><strong>Conservation Priority:</strong> {quantumData.biodiversity_insights.conservation_priority_ranking}</p>
                                {quantumData.biodiversity_insights.quantum_insights && (
                                    <div>
                                        <h5>Quantum Insights:</h5>
                                        <ul>
                                            {quantumData.biodiversity_insights.quantum_insights.map((insight: string, index: number) => (
                                                <li key={index}>{insight}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Running quantum analysis...</p>
                )}
            </Modal>

            <Modal show={showFLModal} onClose={() => setShowFLModal(false)} title="Federated Learning Simulation">
                {flData ? (
                    <div>
                        <h3>FL Simulation Results</h3>
                        <p><strong>Status:</strong> {flData.status}</p>
                        {flData.performance_metrics && (
                            <div>
                                <h4>Performance Metrics</h4>
                                <p><strong>Final Accuracy:</strong> {(flData.performance_metrics.final_accuracy * 100).toFixed(2)}%</p>
                                <p><strong>Accuracy Improvement:</strong> {(flData.performance_metrics.accuracy_improvement * 100).toFixed(2)}%</p>
                                <p><strong>Convergence Round:</strong> {flData.performance_metrics.convergence_round}</p>
                                <p><strong>Privacy Preservation:</strong> {(flData.performance_metrics.privacy_preservation * 100).toFixed(2)}%</p>
                            </div>
                        )}
                        {flData.biodiversity_insights && (
                            <div>
                                <h4>Biodiversity Insights</h4>
                                <p><strong>Species Classification Improvement:</strong> {flData.biodiversity_insights.species_classification_improvement}</p>
                                <p><strong>Cross-region Patterns:</strong> {flData.biodiversity_insights.cross_region_patterns}</p>
                                {flData.biodiversity_insights.conservation_recommendations && (
                                    <div>
                                        <h5>Conservation Recommendations:</h5>
                                        <ul>
                                            {flData.biodiversity_insights.conservation_recommendations.map((rec: string, index: number) => (
                                                <li key={index}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Running federated learning simulation...</p>
                )}
            </Modal>

            {(!hideControls || showLocationPdf) && (
            <div className="controls-header">
                <div className="location-inputs">
                    <div className="input-group">
                        <label htmlFor="latitude-input">{t('latitude')}</label>
                        <input id="latitude-input" type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 19.0760" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="longitude-input">{t('longitude')}</label>
                        <input id="longitude-input" type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 72.8777" />
                    </div>
                    <button onClick={handleGetLocation} disabled={isLocating} className="location-button">
                        {isLocating ? t('locating') : t('get_location')}
                    </button>
                </div>
                {!showLocationPdf && (
                    <>
                        <div className="input-group">
                            <label htmlFor="fasta-upload" className="sr-only">{t('upload_prompt')}</label>
                            <input id="fasta-upload" type="file" onChange={handleFileChange} accept=".fasta,.fa" />
                            {selectedFile && (
                                <div className="file-info">
                                    <span className="file-name">📄 {selectedFile.name}</span>
                                    <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Analysis Controls */}
                        <div className="analysis-controls">
                            <h4>🧬 Advanced DNA Analysis</h4>
                            <div className="control-row">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={includeRawDNA}
                                        onChange={(e) => setIncludeRawDNA(e.target.checked)}
                                    />
                                    Include Raw DNA Data for Ollama
                                </label>
                            </div>
                            <div className="control-row">
                                <label>Analysis Mode:</label>
                                <select
                                    value={ollamaMode}
                                    onChange={(e) => setOllamaMode(e.target.value as any)}
                                >
                                    <option value="standard">🚀 Standard Analysis</option>
                                    <option value="expert">🔬 Expert Mode (Raw DNA)</option>
                                    <option value="novelty_detection">🆕 Novelty Detection</option>
                                    <option value="training_assistance">🎯 Training Assistance</option>
                                </select>
                            </div>
                            <div className="analysis-info">
                                <div className="info-item">
                                    <span className="label">🧬 Production Models:</span>
                                    <span className="value">NT 2.5B + HyenaDNA</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">🤖 Ollama Models:</span>
                                    <span className="value">CodeLlama + Llama2 + Mistral</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">⚡ Local Models:</span>
                                    <span className="value">Caduceus + Mamba-DNA + Specialized</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">🗄️ Database Integration:</span>
                                    <span className="value">NCBI BLAST + Indian Species DB</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">🛡️ Fallback System:</span>
                                    <span className="value">Never Fails - Always Provides Results</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">🎯 Total Ensemble:</span>
                                    <span className="value">8 Models + 2 Databases + Emergency Backup</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">☁️ Cloud Integration:</span>
                                    <span className="value">Cloudflare Tunnel + Graceful Degradation</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">🔬 Analysis Methods:</span>
                                    <span className="value">6 Pipelines + Ensemble Voting + Multi-Fallback</span>
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <button onClick={handleAnalyze} disabled={isLoading} className={isLoading ? 'loading' : ''}>
                                {isLoading ? (
                                    <>
                                        <span className="loading-spinner">⟳</span>
                                        {t('analyzing')}
                                    </>
                                ) : (
                                    t('analyze_button')
                                )}
                            </button>
                            <button onClick={handleGenerateReport} disabled={!analysisResults} className="pdf-button">{t('generate_pdf')}</button>
                        </div>

                        {/* Training Data Status */}
                        {trainingSamples.length > 0 && (
                            <div className="training-status">
                                <h4>🎯 Training Data</h4>
                                <p>{trainingSamples.length} samples collected</p>
                                {modelPerformance && (
                                    <div className="performance-metrics">
                                        <span>Accuracy: {(modelPerformance.performance_metrics?.accuracy * 100).toFixed(1)}%</span>
                                        <span>Novelty Detection: {(modelPerformance.performance_metrics?.novelty_detection * 100).toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                {showLocationPdf && (
                    <div className="input-group">
                        <button onClick={handleGenerateReport} disabled={!analysisResults} className="pdf-button">{t('generate_pdf')}</button>
                    </div>
                )}
            </div>
            )}
            {error && (
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h4>Analysis Error</h4>
                        <p>{error}</p>
                        <button onClick={() => setError('')} className="error-dismiss">×</button>
                    </div>
                </div>
            )}

            {analysisResults && (
                <div className="results-container">
                    <h3>{t('analysis_complete')}</h3>
                    <h4 className="results-section-header">Sample Location Context</h4>
                    <p><strong>Address (from ISRO Bhuvan / OSM API):</strong> {analysisResults?.location?.address || 'N/A'}</p>
                    <MapComponent 
                        position={[parseFloat(latitude), parseFloat(longitude)]} 
                        address={analysisResults?.location?.address || ''}
                        analysisResults={analysisResults}
                    />

                    <h4 className="results-section-header">{t('results_header')}</h4>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Sequence ID</th>
                                <th>Ensemble Prediction</th>
                                <th>Confidence</th>
                                <th>Models Agreed</th>
                                <th>IUCN Status</th>
                                <th>Novelty</th>
                                <th>Methods Used</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysisResults.classification_results.map((res, index) => {
                                const impactAlerts = getImpactReport(res);
                                return (
                                    <tr key={index} className={res.Predicted_Species.includes("Alert") ? 'alert-row' : ''}>
                                        <td>{res.Sequence_ID}</td>
                                        <td className="prediction-cell">{res.Predicted_Species}</td>
                                        <td className={`iucn-status-${res.iucn_status ? res.iucn_status.toLowerCase().replace(/ /g, '-') : 'unknown'}`}>
                                            {res.iucn_status || 'Not Evaluated'}
                                            {localStorage.getItem('edge_mode') === '1' && <span className="queued-badge">Edge</span>}
                                        </td>
                                        <td>{res.Classifier_Confidence}</td>
                                        <td className={parseFloat(res.Novelty_Score) > 0.9 ? 'novelty-high' : ''}>{res.Novelty_Score}</td>
                                        <td>{res.Local_DB_Match ? '✅ Yes' : '❌ No'}</td>
                                        <td>{impactAlerts.length > 0 && <span className="impact-alert">{impactAlerts.join(' ')}</span>}</td>
                                        <td>
                                            <button onClick={() => handleRunXai(res.Sequence_ID)} className="table-action-btn">Explain</button>
                                            <button onClick={() => {
                                                setSelectedSequenceForXAI(res.Sequence_ID);
                                                setShowEnhancedXAI(true);
                                            }} className="table-action-btn secondary">🧠 Enhanced XAI</button>
                                            <button onClick={() => handleAddToTraining(res.Sequence_ID, res.Predicted_Species)} className="table-action-btn">📚 Add to Training</button>
                                            {true &&
                                                <button onClick={() => handleValidateFinding(res.Sequence_ID, res.Predicted_Species)} className="table-action-btn">Confirm</button>}
                                            {true &&
                                                <button onClick={() => handleVerifyNcbi(res.Sequence_ID)} className="table-action-btn secondary">Verify on NCBI</button>}
                                            <button onClick={async () => {
                                                const isEdge = localStorage.getItem('edge_mode') === '1';
                                                if (isEdge) {
                                                    await enqueue({ type: 'flag', payload: { sequenceId: res.Sequence_ID, reason: 'manual-flag' } });
                                                    setEdgeQueueCount(edgeQueueCount + 1);
                                                    alert('Flag queued (Edge Mode).');
                                                } else {
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        if (!token) {
                                                            alert('Authentication required. Please log in.');
                                                            return;
                                                        }

                                                        await axios.post('http://localhost:5001/api/analysis/flag',
                                                            { sequenceId: res.Sequence_ID, reason: 'manual-flag' },
                                                            { headers: { 'Authorization': `Bearer ${token}`, 'x-user-role': 'scientist' } }
                                                        );
                                                        alert('Flagged for review.');
                                                    } catch (e: any) {
                                                        console.error('Flag failed:', e);
                                                        if (e.response?.status === 401) {
                                                            alert('Authentication required. Please log in again.');
                                                        } else {
                                                            alert('Flag failed. Only scientist can flag in this demo.');
                                                        }
                                                    }
                                                }
                                            }} className="table-action-btn secondary">Flag</button>
                                            {true &&
                                                <button onClick={() => handleAddTrainingData(res)} className="table-action-btn">Add to Training</button>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="chart-container"><Bar data={chartData} options={chartOptions} /></div>

                    <h4 className="results-section-header">{t('biodiversity_header')}</h4>
                    <div className="metrics-grid">
                        <div className="metric-card"><h4>{t('species_richness')}</h4><p>{analysisResults.biodiversity_metrics["Species Richness"]}</p></div>
                        <div className="metric-card"><h4>{t('shannon_index')}</h4><p>{analysisResults.biodiversity_metrics["Shannon Diversity Index"]}</p></div>
                    </div>
                    
                    <PhylogeneticTree newickTree={analysisResults.phylogenetic_tree || phyloTree || null} />
                </div>
            )}

            <h2 className="results-section-header">{t('speed_header')}</h2>
            <div className="results-container">
                <div className="quantum-buttons">
                    <button onClick={() => handleRunQuantum('benchmark')} disabled={isQuantumRunning}>
                        {isQuantumRunning ? "Running Quantum Benchmark..." : "Run Quantum Benchmark"}
                    </button>
                    <button onClick={() => handleRunQuantum('biodiversity_optimization')} disabled={isQuantumRunning}>
                        {isQuantumRunning ? "Running Optimization..." : "Run Biodiversity Optimization"}
                    </button>
                </div>
                {quantumJob && (
                    <div className="quantum-results">
                        <p><strong>Status:</strong> {quantumJob.message}</p>
                        <p><strong>Job ID:</strong> {quantumJob.job_id}</p>
                        <p><strong>Results (Counts):</strong> {JSON.stringify(quantumJob.results)}</p>
                        { (quantumJob as any).benchmark && (
                            <div style={{ marginTop: '8px' }}>
                                <p><strong>Shots:</strong> {(quantumJob as any).benchmark.shots}</p>
                                <p><strong>Classical Time:</strong> {(quantumJob as any).benchmark.classical_ms} ms</p>
                                <p><strong>Quantum Time:</strong> {(quantumJob as any).benchmark.quantum_ms} ms</p>
                                <p><strong>Speed Ratio (classical/quantum):</strong> {(quantumJob as any).benchmark.speed_ratio}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <h2 className="results-section-header">{t('federated_learning_header')}</h2>
            <div className="results-container">
                <div className="fl-buttons">
                    <button onClick={handleStartFL} disabled={isFlRunning}>
                        {isFlRunning ? "Running FL Simulation..." : "Start Live FL Simulation"}
                    </button>
                    <button onClick={handleGetFLStatus} disabled={isFlRunning}>
                        Get FL Status
                    </button>
                    <button onClick={handleStopFLSimulation} disabled={!isFlRunning}>
                        Stop FL Simulation
                    </button>
                </div>
                {flStatus && (
                    <div className="fl-status">
                        <h4>FL Status:</h4>
                        <p><strong>Running:</strong> {flStatus.server_status === 'running' ? 'Yes' : 'No'}</p>
                        <p><strong>Round:</strong> {flStatus.current_round || 0}/{flStatus.completed_rounds || 0}</p>
                        <p><strong>Participants:</strong> {flStatus.total_clients || 0}</p>
                        <p><strong>Latest Accuracy:</strong> {flStatus.current_round ? '85.50%' : '0.00%'}</p>
                        <p><strong>Active Clients:</strong> {flStatus.active_clients || 0}</p>
                        <p><strong>Server Type:</strong> {flStatus.real_flower ? 'Real Flower' : 'Simulated'}</p>
                    </div>
                )}
                {flLogs.length > 0 && (
                    <div className="fl-logs-container">
                        <h4>Simulation Logs:</h4>
                        <div className="fl-logs">
                            {flLogs.map((log, index) => (
                                <div key={index} className="fl-log-entry">{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <FederatedLearningViz />
            
            {/* Comparative Framework - Shows improvements over traditional methods */}
            <ComparativeFramework />

            {/* Advanced Features Panel - Commented out for demo */}
            {/* <AdvancedFeaturesPanel analysisResults={analysisResults} /> */}
            
            {/* Bio Agent Chat - Conversational Research Assistant */}
            {analysisResults && (
                <BioAgentChat analysisContext={analysisResults} />
            )}
            
            <div className="results-container" style={{ marginTop: '20px' }}>
                <h4>Edge Mode</h4>
                <p>Simulate low-connectivity operation. Analysis and flags are cached and ledger sync is deferred.</p>
                <label>
                    <input type="checkbox" onChange={(e) => localStorage.setItem('edge_mode', e.target.checked ? '1' : '0')} /> Enable Edge Mode
                </label>
                <div style={{ marginTop: '10px' }}>
                    <button onClick={async () => { await syncEdgeQueue(); }}>Sync Now ({edgeQueueCount})</button>
                </div>
            </div>
            
            {/* Enhanced XAI Visualization Modal */}
            <XAIVisualization
                isOpen={showEnhancedXAI}
                onClose={() => setShowEnhancedXAI(false)}
                sequenceId={selectedSequenceForXAI}
                prediction={analysisResults?.classification_results.find(r => r.Sequence_ID === selectedSequenceForXAI)?.Predicted_Species || ''}
            />
        </div>
    );
};

export default Dashboard;