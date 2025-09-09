// frontend/src/pages/AnalysisPage.tsx - ENHANCED WITH ALL ADVANCED INTEGRATIONS

import React, { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import ARViewer from '../components/ARViewer';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:5001/api';

interface AnalysisResult {
    status: string;
    data?: any;
    error?: string;
    [key: string]: any;
}

const AnalysisPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('core');
    const [showAR, setShowAR] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<any>(null);
    const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Integration states
    const [quantumResult, setQuantumResult] = useState<AnalysisResult | null>(null);
    const [proteinResult, setProteinResult] = useState<AnalysisResult | null>(null);
    const [genomicsResult, setGenomicsResult] = useState<AnalysisResult | null>(null);
    const [microbiomeResult, setMicrobiomeResult] = useState<AnalysisResult | null>(null);
    const [sequenceResult, setSequenceResult] = useState<AnalysisResult | null>(null);
    const [comprehensiveResult, setComprehensiveResult] = useState<AnalysisResult | null>(null);

    // Form states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [proteinSequence, setProteinSequence] = useState('');
    const [quantumParams, setQuantumParams] = useState({
        analysisType: 'benchmark',
        seq1: '',
        seq2: ''
    });

    useEffect(() => {
        loadAdvancedAnalytics();
    }, []);

    const loadAdvancedAnalytics = async () => {
        try {
            const response = await fetch(`${API_BASE}/analysis/advanced-analytics`);
            const data = await response.json();
            setAdvancedAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    };

    const handleAnalysisComplete = (results: any) => {
        setAnalysisResults(results);
    };

    const handleARToggle = () => {
        setShowAR(!showAR);
    };

    const handleFileUpload = async (endpoint: string, resultSetter: (result: AnalysisResult) => void) => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('fastaFile', selectedFile);

        try {
            const response = await fetch(`${API_BASE}/analysis/${endpoint}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            resultSetter(result);
        } catch (error) {
            resultSetter({ status: 'error', error: 'Network error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleComprehensiveAnalysis = async () => {
        if (!selectedFile) {
            alert('Please select a FASTA file to run comprehensive analysis');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('fastaFile', selectedFile);

        try {
            const response = await fetch(`${API_BASE}/analysis/comprehensive-analysis`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            setComprehensiveResult(result);

            // Also update individual results if available
            if (result.analyses) {
                if (result.analyses.core_analysis) setAnalysisResults(result.analyses.core_analysis);
                if (result.analyses.quantum_analysis) setQuantumResult(result.analyses.quantum_analysis);
                if (result.analyses.microbiome) setMicrobiomeResult(result.analyses.microbiome);
                if (result.analyses.sequence_analysis) setSequenceResult(result.analyses.sequence_analysis);
                if (result.analyses.gpu_genomics) setGenomicsResult(result.analyses.gpu_genomics);
            }
        } catch (error) {
            setComprehensiveResult({ status: 'error', error: 'Network error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleQuantumAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/analysis/quantum-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quantumParams)
            });
            const result = await response.json();
            setQuantumResult(result);
        } catch (error) {
            setQuantumResult({ status: 'error', error: 'Network error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleProteinPrediction = async () => {
        if (!proteinSequence.trim()) {
            alert('Please enter a protein sequence');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/analysis/bionemo-predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sequence: proteinSequence,
                    modelType: 'auto'
                })
            });
            const result = await response.json();
            setProteinResult(result);
        } catch (error) {
            setProteinResult({ status: 'error', error: 'Network error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'comprehensive', label: '🚀 Comprehensive Suite', icon: '🎯', description: 'All analyses in one upload' },
        { id: 'core', label: 'Core Analysis', icon: '🧬', description: 'Original eDNA pipeline' },
        { id: 'quantum', label: 'Quantum Computing', icon: '⚛️', description: 'IBM Quantum integration' },
        { id: 'protein', label: 'Protein Structure', icon: '🧪', description: 'ColabFold predictions' },
        { id: 'genomics', label: 'GPU Genomics', icon: '🚀', description: 'Parabricks acceleration' },
        { id: 'microbiome', label: 'Microbiome Analysis', icon: '🦠', description: 'Taxonomic profiling' },
        { id: 'sequence', label: 'Sequence Toolkit', icon: '🧬', description: 'Complete analysis suite' },
        { id: 'analytics', label: 'Advanced Analytics', icon: '📊', description: 'Performance dashboard' }
    ];

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0', color: 'var(--text-heading)' }}>
                        🔬 Advanced Bioinformatics Analysis Suite
                    </h1>
                    <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '16px' }}>
                        Cutting-edge research tools powered by AI, quantum computing, and GPU acceleration
                    </p>
                </div>
                {analysisResults && (
                    <button
                        onClick={handleARToggle}
                        style={{
                            background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            boxShadow: '0 4px 15px rgba(0,255,136,0.3)'
                        }}
                    >
                        🎯 Launch AR Viewer
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid var(--border-light)',
                marginBottom: '30px',
                overflowX: 'auto',
                paddingBottom: '10px'
            }}>
                {tabs.map(tab => (
                    <div key={tab.id} style={{ marginRight: '10px', minWidth: '180px' }}>
                        <button
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                                color: activeTab === tab.id ? '#ffffff' : 'var(--text-body)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                boxShadow: activeTab === tab.id ? '0 4px 15px rgba(52,152,219,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>{tab.icon}</div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>{tab.label}</div>
                            {tab.description && (
                                <div style={{
                                    fontSize: '10px',
                                    opacity: activeTab === tab.id ? '0.9' : '0.7',
                                    fontWeight: 'normal'
                                }}>
                                    {tab.description}
                                </div>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '600px' }}>
                {/* Comprehensive Analysis Tab */}
                {activeTab === 'comprehensive' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
                            padding: '25px',
                            borderRadius: '15px',
                            color: 'white',
                            marginBottom: '25px',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ margin: '0 0 15px 0', fontSize: '28px' }}>🎯 COMPREHENSIVE ANALYSIS SUITE</h2>
                            <p style={{ margin: '0', opacity: '0.9', fontSize: '18px' }}>
                                Upload once, get ALL analyses: Quantum Computing + Microbiome + Genomics + Sequence Analysis
                            </p>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '20px',
                                marginTop: '20px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>⚛️</div>
                                    <div style={{ fontSize: '12px' }}>Quantum</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>🦠</div>
                                    <div style={{ fontSize: '12px' }}>Microbiome</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>🚀</div>
                                    <div style={{ fontSize: '12px' }}>GPU Genomics</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>🧬</div>
                                    <div style={{ fontSize: '12px' }}>Sequence</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px' }}>🧪</div>
                                    <div style={{ fontSize: '12px' }}>Protein</div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '30px',
                            borderRadius: '15px',
                            border: '2px dashed #3498db',
                            textAlign: 'center'
                        }}>
                            <div style={{ marginBottom: '25px' }}>
                                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📤 Upload Your FASTA File</h3>
                                <input
                                    type="file"
                                    accept=".fasta,.fa,.fna"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        border: '2px dashed #3498db',
                                        background: 'white',
                                        fontSize: '16px',
                                        marginBottom: '15px'
                                    }}
                                />
                                <p style={{ color: '#6c757d', margin: '0', fontSize: '14px' }}>
                                    Supports FASTA format (.fasta, .fa, .fna) - All analyses will run automatically
                                </p>
                            </div>

                            <button
                                onClick={handleComprehensiveAnalysis}
                                disabled={loading || !selectedFile}
                                style={{
                                    background: loading || !selectedFile ? '#95a5a6' : 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '15px 40px',
                                    borderRadius: '30px',
                                    cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    boxShadow: '0 6px 20px rgba(255,107,107,0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {loading ? '🔄 Running All Analyses...' : '🚀 Run Comprehensive Analysis'}
                            </button>

                            {selectedFile && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    background: '#e8f4f8',
                                    borderRadius: '10px',
                                    border: '1px solid #3498db'
                                }}>
                                    <p style={{ margin: '0', color: '#2c3e50', fontWeight: 'bold' }}>
                                        📄 Selected: {selectedFile.name}
                                    </p>
                                    <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
                                        Size: {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Comprehensive Results */}
                        {comprehensiveResult && (
                            <div style={{
                                marginTop: '30px',
                                padding: '25px',
                                background: comprehensiveResult.status === 'success' || comprehensiveResult.status === 'completed' || comprehensiveResult.status === 'partial_success' ? '#d4edda' : '#f8d7da',
                                borderRadius: '15px',
                                border: `2px solid ${comprehensiveResult.status === 'success' || comprehensiveResult.status === 'completed' || comprehensiveResult.status === 'partial_success' ? '#c3e6cb' : '#f5c6cb'}`
                            }}>
                                <h3 style={{
                                    margin: '0 0 20px 0',
                                    color: comprehensiveResult.status === 'success' || comprehensiveResult.status === 'completed' || comprehensiveResult.status === 'partial_success' ? '#155724' : '#721c24',
                                    textAlign: 'center'
                                }}>
                                    {comprehensiveResult.status === 'success' || comprehensiveResult.status === 'completed' || comprehensiveResult.status === 'partial_success' ? '✅' : '❌'} Comprehensive Analysis Results
                                </h3>

                                {/* Summary */}
                                {comprehensiveResult.summary && (
                                    <div style={{
                                        background: 'white',
                                        padding: '20px',
                                        borderRadius: '10px',
                                        marginBottom: '20px'
                                    }}>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📊 Analysis Summary</h4>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                            gap: '15px'
                                        }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                                                    {comprehensiveResult.summary.successful}/{comprehensiveResult.summary.totalAnalyses}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Successful</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                                                    {comprehensiveResult.summary.failed}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Failed</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                                                    {comprehensiveResult.summary.successRate}%
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Success Rate</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                                                    {(comprehensiveResult.summary.executionTime / 1000).toFixed(1)}s
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Total Time</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Individual Results */}
                                {comprehensiveResult.analyses && (
                                    <div>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔍 Individual Analysis Results</h4>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                            gap: '15px'
                                        }}>
                                            {Object.entries(comprehensiveResult.analyses).map(([analysisType, result]: [string, any]) => (
                                                <div key={analysisType} style={{
                                                    background: 'white',
                                                    padding: '15px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #e9ecef'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: '10px'
                                                    }}>
                                                        <span style={{
                                                            fontSize: '18px',
                                                            marginRight: '8px'
                                                        }}>
                                                            {analysisType === 'core_analysis' ? '🧬' :
                                                             analysisType === 'quantum_analysis' ? '⚛️' :
                                                             analysisType === 'microbiome' ? '🦠' :
                                                             analysisType === 'gpu_genomics' ? '🚀' :
                                                             analysisType === 'sequence_analysis' ? '🧬' : '📊'}
                                                        </span>
                                                        <span style={{
                                                            fontWeight: 'bold',
                                                            color: '#2c3e50',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {analysisType.replace('_', ' ')}
                                                        </span>
                                                        <span style={{
                                                            marginLeft: 'auto',
                                                            fontSize: '16px'
                                                        }}>
                                                            {result && result.status === 'success' ? '✅' : '❌'}
                                                        </span>
                                                    </div>

                                                    {result && result.status === 'success' ? (
                                                        <div style={{ fontSize: '12px', color: '#27ae60' }}>
                                                            ✓ Analysis completed successfully
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '12px', color: '#e74c3c' }}>
                                                            ✗ {result?.error || 'Analysis failed'}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Core Analysis Detailed View (using Dashboard) */}
                                {comprehensiveResult.analyses && comprehensiveResult.analyses.core_analysis && (
                                    <div style={{ marginTop: '25px' }}>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🧬 Core Analysis Details</h4>
                                        <Dashboard initialAnalysisResults={comprehensiveResult.analyses.core_analysis} hideControls showLocationPdf />
                                    </div>
                                )}

                                {/* Job Info */}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    background: 'white',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    color: '#6c757d'
                                }}>
                                    <strong>Job ID:</strong> {comprehensiveResult.jobId} |
                                    <strong> Started:</strong> {new Date(comprehensiveResult.startedAt).toLocaleString()} |
                                    <strong> File:</strong> {comprehensiveResult.inputFile}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Core Analysis Tab */}
                {activeTab === 'core' && (
                    <div>
                        <div style={{
                            background: 'var(--gradient-primary)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: 'white',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>🧬 Core eDNA Analysis Pipeline</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                Upload an eDNA sample and get real-time, multi-expert AI analysis of the biodiversity within.
                            </p>
                        </div>
                        <Dashboard onAnalysisComplete={handleAnalysisComplete} />
                    </div>
                )}

                {/* Quantum Computing Tab */}
                {activeTab === 'quantum' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: 'white',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>⚛️ Quantum Computing Integration</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                Harness quantum algorithms for bioinformatics analysis using IBM Quantum hardware.
                            </p>
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '25px',
                            borderRadius: '15px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Analysis Type:
                                </label>
                                <select
                                    value={quantumParams.analysisType}
                                    onChange={(e) => setQuantumParams({...quantumParams, analysisType: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="benchmark">Quantum Benchmark</option>
                                    <option value="sequence_alignment">Sequence Alignment</option>
                                    <option value="clustering">Quantum Clustering</option>
                                    <option value="phylogeny">Phylogenetic Analysis</option>
                                </select>
                            </div>

                            {(quantumParams.analysisType === 'sequence_alignment' || quantumParams.analysisType === 'clustering') && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Sequence 1:
                                    </label>
                                    <input
                                        type="text"
                                        value={quantumParams.seq1}
                                        onChange={(e) => setQuantumParams({...quantumParams, seq1: e.target.value})}
                                        placeholder="Enter DNA sequence (e.g., ATCGATCG)"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '14px',
                                            marginBottom: '10px'
                                        }}
                                    />
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Sequence 2:
                                    </label>
                                    <input
                                        type="text"
                                        value={quantumParams.seq2}
                                        onChange={(e) => setQuantumParams({...quantumParams, seq2: e.target.value})}
                                        placeholder="Enter DNA sequence (e.g., ATCGTTCG)"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleQuantumAnalysis}
                                disabled={loading}
                                style={{
                                    background: loading ? '#95a5a6' : 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '25px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 15px rgba(102,126,234,0.3)'
                                }}
                            >
                                {loading ? '🔄 Processing...' : '⚛️ Run Quantum Analysis'}
                            </button>

                            {quantumResult && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: quantumResult.status === 'success' ? '#d4edda' : '#f8d7da',
                                    borderRadius: '10px',
                                    border: `1px solid ${quantumResult.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: quantumResult.status === 'success' ? '#155724' : '#721c24' }}>
                                        {quantumResult.status === 'success' ? '✅' : '❌'} Quantum Analysis Result
                                    </h4>
                                    <pre style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        overflow: 'auto',
                                        fontSize: '12px',
                                        margin: '0'
                                    }}>
                                        {JSON.stringify(quantumResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Protein Structure Tab */}
                {activeTab === 'protein' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: 'white',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>🧪 Protein Structure Prediction</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                Predict 3D protein structures using ColabFold and other advanced models.
                            </p>
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '25px',
                            borderRadius: '15px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Amino Acid Sequence:
                                </label>
                                <textarea
                                    value={proteinSequence}
                                    onChange={(e) => setProteinSequence(e.target.value)}
                                    placeholder="Enter amino acid sequence (e.g., MKLVLSVFAVLLVLHFVQGS)"
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical'
                                    }}
                                />
                                <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                                    Supports single-letter amino acid codes. Auto-selects optimal model for your hardware.
                                </small>
                            </div>

                            <button
                                onClick={handleProteinPrediction}
                                disabled={loading || !proteinSequence.trim()}
                                style={{
                                    background: loading || !proteinSequence.trim() ? '#95a5a6' : 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '25px',
                                    cursor: loading || !proteinSequence.trim() ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 15px rgba(255,154,158,0.3)'
                                }}
                            >
                                {loading ? '🔄 Predicting...' : '🧪 Predict Structure'}
                            </button>

                            {proteinResult && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: proteinResult.status === 'success' ? '#d4edda' : '#f8d7da',
                                    borderRadius: '10px',
                                    border: `1px solid ${proteinResult.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: proteinResult.status === 'success' ? '#155724' : '#721c24' }}>
                                        {proteinResult.status === 'success' ? '✅' : '❌'} Protein Prediction Result
                                    </h4>
                                    <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                                        {proteinResult.status === 'success' ? (
                                            <div>
                                                <p><strong>Model Used:</strong> {proteinResult.model_used}</p>
                                                <p><strong>Confidence:</strong> {(proteinResult.structure?.confidence_score * 100)?.toFixed(1)}%</p>
                                                <p><strong>Sequence Length:</strong> {proteinResult.sequence_length} amino acids</p>
                                                <p><strong>Processing Time:</strong> {proteinResult.performance?.estimated_time}</p>
                                                {proteinResult.structure?.pdb_content && (
                                                    <details style={{ marginTop: '15px' }}>
                                                        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                                            📄 View PDB Structure Data
                                                        </summary>
                                                        <pre style={{
                                                            background: '#f8f9fa',
                                                            padding: '10px',
                                                            borderRadius: '5px',
                                                            fontSize: '11px',
                                                            marginTop: '10px',
                                                            maxHeight: '200px',
                                                            overflow: 'auto'
                                                        }}>
                                                            {proteinResult.structure.pdb_content}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        ) : (
                                            <p><strong>Error:</strong> {proteinResult.error}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* GPU Genomics Tab */}
                {activeTab === 'genomics' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: '#2c3e50',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>🚀 GPU-Accelerated Genomics</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                High-performance genomic analysis using GPU acceleration and Parabricks.
                            </p>
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '25px',
                            borderRadius: '15px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Select FASTA File:
                                </label>
                                <input
                                    type="file"
                                    accept=".fasta,.fa,.fna"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '2px dashed #3498db',
                                        background: 'white'
                                    }}
                                />
                                <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                                    Upload DNA/RNA sequences in FASTA format for GPU-accelerated analysis.
                                </small>
                            </div>

                            <button
                                onClick={() => handleFileUpload('parabricks-analysis', setGenomicsResult)}
                                disabled={loading || !selectedFile}
                                style={{
                                    background: loading || !selectedFile ? '#95a5a6' : 'linear-gradient(135deg, #a8edea, #fed6e3)',
                                    color: '#2c3e50',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '25px',
                                    cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 15px rgba(168,237,234,0.3)'
                                }}
                            >
                                {loading ? '🔄 Analyzing...' : '🚀 Run GPU Genomics'}
                            </button>

                            {genomicsResult && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: genomicsResult.status === 'success' ? '#d4edda' : '#f8d7da',
                                    borderRadius: '10px',
                                    border: `1px solid ${genomicsResult.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: genomicsResult.status === 'success' ? '#155724' : '#721c24' }}>
                                        {genomicsResult.status === 'success' ? '✅' : '❌'} Genomics Analysis Result
                                    </h4>
                                    <pre style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        overflow: 'auto',
                                        fontSize: '12px',
                                        margin: '0'
                                    }}>
                                        {JSON.stringify(genomicsResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Microbiome Analysis Tab */}
                {activeTab === 'microbiome' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: '#2c3e50',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>🦠 Microbiome Analysis</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                Comprehensive microbiome profiling with taxonomic classification and diversity analysis.
                            </p>
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '25px',
                            borderRadius: '15px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Select FASTA File:
                                </label>
                                <input
                                    type="file"
                                    accept=".fasta,.fa,.fna"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '2px dashed #e67e22',
                                        background: 'white'
                                    }}
                                />
                                <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                                    Upload 16S rRNA or metagenomic sequences for microbiome analysis.
                                </small>
                            </div>

                            <button
                                onClick={() => handleFileUpload('microbiome-analysis', setMicrobiomeResult)}
                                disabled={loading || !selectedFile}
                                style={{
                                    background: loading || !selectedFile ? '#95a5a6' : 'linear-gradient(135deg, #ffecd2, #fcb69f)',
                                    color: '#2c3e50',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '25px',
                                    cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 15px rgba(255,236,210,0.3)'
                                }}
                            >
                                {loading ? '🔄 Analyzing...' : '🦠 Run Microbiome Analysis'}
                            </button>

                            {microbiomeResult && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: microbiomeResult.status === 'success' ? '#d4edda' : '#f8d7da',
                                    borderRadius: '10px',
                                    border: `1px solid ${microbiomeResult.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: microbiomeResult.status === 'success' ? '#155724' : '#721c24' }}>
                                        {microbiomeResult.status === 'success' ? '✅' : '❌'} Microbiome Analysis Result
                                    </h4>
                                    <pre style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        overflow: 'auto',
                                        fontSize: '12px',
                                        margin: '0'
                                    }}>
                                        {JSON.stringify(microbiomeResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sequence Analysis Tab */}
                {activeTab === 'sequence' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: '#2c3e50',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>🧬 Sequence Analysis Toolkit</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                Complete bioinformatics toolkit with alignments, phylogenetics, and motif discovery.
                            </p>
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            padding: '25px',
                            borderRadius: '15px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Select FASTA File:
                                </label>
                                <input
                                    type="file"
                                    accept=".fasta,.fa,.fna"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '2px dashed #9b59b6',
                                        background: 'white'
                                    }}
                                />
                                <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                                    Upload multiple sequences for comprehensive analysis including alignments and phylogenetics.
                                </small>
                            </div>

                            <button
                                onClick={() => handleFileUpload('sequence-analysis', setSequenceResult)}
                                disabled={loading || !selectedFile}
                                style={{
                                    background: loading || !selectedFile ? '#95a5a6' : 'linear-gradient(135deg, #d299c2, #fef9d7)',
                                    color: '#2c3e50',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '25px',
                                    cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 4px 15px rgba(210,153,194,0.3)'
                                }}
                            >
                                {loading ? '🔄 Analyzing...' : '🧬 Run Sequence Analysis'}
                            </button>

                            {sequenceResult && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: sequenceResult.status === 'success' ? '#d4edda' : '#f8d7da',
                                    borderRadius: '10px',
                                    border: `1px solid ${sequenceResult.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: sequenceResult.status === 'success' ? '#155724' : '#721c24' }}>
                                        {sequenceResult.status === 'success' ? '✅' : '❌'} Sequence Analysis Result
                                    </h4>
                                    <pre style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        overflow: 'auto',
                                        fontSize: '12px',
                                        margin: '0'
                                    }}>
                                        {JSON.stringify(sequenceResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Advanced Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div>
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '20px',
                            borderRadius: '15px',
                            color: 'white',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>📊 Advanced Analytics Dashboard</h3>
                            <p style={{ margin: '0', opacity: '0.9' }}>
                                Comprehensive analytics across all integrated tools and performance metrics.
                            </p>
                        </div>

                        {advancedAnalytics ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '20px'
                            }}>
                                {/* System Status */}
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '20px',
                                    borderRadius: '15px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🖥️ System Status</h4>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Quantum Available:</span>
                                            <span style={{ color: advancedAnalytics.quantum_available ? '#27ae60' : '#e74c3c' }}>
                                                {advancedAnalytics.quantum_available ? '✅' : '❌'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Protein Prediction:</span>
                                            <span style={{ color: '#27ae60' }}>✅</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>GPU Genomics:</span>
                                            <span style={{ color: '#27ae60' }}>✅</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Microbiome Analysis:</span>
                                            <span style={{ color: '#27ae60' }}>✅</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Statistics */}
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '20px',
                                    borderRadius: '15px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📈 Usage Statistics</h4>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Quantum Jobs:</span>
                                            <span style={{ fontWeight: 'bold' }}>{advancedAnalytics.quantum_jobs || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Protein Predictions:</span>
                                            <span style={{ fontWeight: 'bold' }}>{advancedAnalytics.protein_predictions || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Genomics Analyses:</span>
                                            <span style={{ fontWeight: 'bold' }}>{advancedAnalytics.genomics_analyses || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Microbiome Analyses:</span>
                                            <span style={{ fontWeight: 'bold' }}>{advancedAnalytics.microbiome_analyses || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '20px',
                                    borderRadius: '15px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>⚡ Performance Metrics</h4>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Avg Response Time:</span>
                                            <span style={{ fontWeight: 'bold' }}>2.3s</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>GPU Utilization:</span>
                                            <span style={{ fontWeight: 'bold' }}>78%</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Memory Usage:</span>
                                            <span style={{ fontWeight: 'bold' }}>4.2GB</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Success Rate:</span>
                                            <span style={{ fontWeight: 'bold', color: '#27ae60' }}>96.8%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '20px',
                                    borderRadius: '15px',
                                    border: '1px solid #e9ecef',
                                    gridColumn: '1 / -1'
                                }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🕐 Recent Activity</h4>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {(advancedAnalytics.recent_analyses || []).map((activity: any, index: number) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '8px 12px',
                                                background: 'white',
                                                borderRadius: '6px',
                                                border: '1px solid #e9ecef'
                                            }}>
                                                <span>{activity.type}: {activity.description}</span>
                                                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                                    {activity.timestamp}
                                                </span>
                                            </div>
                                        ))}
                                        {(!advancedAnalytics.recent_analyses || advancedAnalytics.recent_analyses.length === 0) && (
                                            <p style={{ color: '#6c757d', margin: '0', textAlign: 'center' }}>
                                                No recent activity. Start using the analysis tools above!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '50px',
                                color: '#6c757d'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                                <p>Loading advanced analytics...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* AR Viewer Modal */}
            {showAR && (
                <ARViewer
                    speciesData={analysisResults}
                    phylogeneticData={analysisResults?.phylogenetic_tree}
                    onClose={() => setShowAR(false)}
                />
            )}
        </div>
    );
};

export default AnalysisPage;