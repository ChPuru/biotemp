import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdvancedFeaturesPanel.css';

interface AdvancedFeaturesPanelProps {
    analysisResults?: any;
}

interface JobStatus {
    jobId: string;
    status: string;
    stage: string;
    progress: number;
    startTime: string;
    lastUpdate: string;
}

interface CaseStudy {
    id: string;
    title: string;
    organization: string;
    location: string;
    year: number;
    type: string;
    description: string;
    findings: any;
    policy_impact: any;
    cost_analysis: any;
}

interface CostEstimate {
    cost_breakdown: {
        sequencing: number;
        compute: number;
        storage: number;
        personnel: number;
        field_work: number;
        overhead: number;
        total: number;
    };
    cost_per_sample: number;
    recommendations: string[];
}

const AdvancedFeaturesPanel: React.FC<AdvancedFeaturesPanelProps> = ({ analysisResults }) => {
    const [activeTab, setActiveTab] = useState<string>('blockchain');
    const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
    const [securityStatus, setSecurityStatus] = useState<any>(null);
    const [qiime2Jobs, setQiime2Jobs] = useState<JobStatus[]>([]);
    const [bioNeMoJobs, setBioNeMoJobs] = useState<JobStatus[]>([]);
    const [parabricksJobs, setParabricksJobs] = useState<JobStatus[]>([]);
    const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
    const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
    const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadInitialData();
        const interval = setInterval(refreshJobStatuses, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadInitialData = async () => {
        try {
            await Promise.all([
                loadBlockchainStatus(),
                loadSecurityStatus(),
                loadCaseStudies()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const refreshJobStatuses = async () => {
        try {
            await Promise.all([
                loadQiime2Jobs(),
                loadBioNeMoJobs(),
                loadParabricksJobs()
            ]);
        } catch (error) {
            console.error('Error refreshing job statuses:', error);
        }
    };

    const loadBlockchainStatus = async () => {
        try {
            const response = await axios.get('/api/blockchain/status');
            setBlockchainStatus(response.data);
        } catch (error) {
            console.error('Error loading blockchain status:', error);
        }
    };

    const loadSecurityStatus = async () => {
        try {
            const response = await axios.get('/api/security/health');
            setSecurityStatus(response.data);
        } catch (error) {
            console.error('Error loading security status:', error);
        }
    };

    const loadQiime2Jobs = async () => {
        try {
            const response = await axios.get('/api/qiime2/jobs');
            setQiime2Jobs(response.data.jobs || []);
        } catch (error) {
            console.error('Error loading QIIME2 jobs:', error);
        }
    };

    const loadBioNeMoJobs = async () => {
        try {
            const response = await axios.get('/api/bionemo/jobs');
            setBioNeMoJobs(response.data.jobs || []);
        } catch (error) {
            console.error('Error loading BioNeMo jobs:', error);
        }
    };

    const loadParabricksJobs = async () => {
        try {
            const response = await axios.get('/api/parabricks/jobs');
            setParabricksJobs(response.data.jobs || []);
        } catch (error) {
            console.error('Error loading Parabricks jobs:', error);
        }
    };

    const loadCaseStudies = async () => {
        try {
            const response = await axios.get('/api/case-studies');
            setCaseStudies(response.data.case_studies || []);
        } catch (error) {
            console.error('Error loading case studies:', error);
        }
    };

    const runQiime2Analysis = async () => {
        setIsLoading({ ...isLoading, qiime2: true });
        try {
            const response = await axios.post('/api/qiime2/run', {
                inputPath: '/tmp/sample_data',
                demultiplex: true,
                trimLeftF: 0,
                trimLeftR: 0,
                truncLenF: 250,
                truncLenR: 250,
                referenceDB: 'silva',
                samplingDepth: 1000,
                threads: 4
            });
            alert(`QIIME2 analysis started! Job ID: ${response.data.jobId}`);
            await loadQiime2Jobs();
        } catch (error) {
            console.error('Error starting QIIME2 analysis:', error);
            alert('Failed to start QIIME2 analysis');
        } finally {
            setIsLoading({ ...isLoading, qiime2: false });
        }
    };

    const runBioNeMoAnalysis = async () => {
        if (!analysisResults?.classification_results?.[0]) {
            alert('Please run a basic analysis first to get sequence data');
            return;
        }

        setIsLoading({ ...isLoading, bionemo: true });
        try {
            // Get first sequence for demo
            const firstResult = analysisResults.classification_results[0];
            const mockSequence = 'MKTVRQERLKSIVRILERSKEPVSGAQLAEELSVSRQVIVQDIAYLRSLGYNIVATPRGYVLAGG';
            
            const response = await axios.post('/api/bionemo/protein/analyze', {
                sequence: mockSequence,
                model: 'esm2-650m',
                tasks: ['embedding', 'secondary_structure', 'contact_prediction']
            });
            alert(`BioNeMo analysis started! Job ID: ${response.data.jobId}`);
            await loadBioNeMoJobs();
        } catch (error) {
            console.error('Error starting BioNeMo analysis:', error);
            alert('Failed to start BioNeMo analysis');
        } finally {
            setIsLoading({ ...isLoading, bionemo: false });
        }
    };

    const runParabricksAnalysis = async () => {
        setIsLoading({ ...isLoading, parabricks: true });
        try {
            const response = await axios.post('/api/parabricks/run', {
                tool: 'fq2bam',
                input_files: ['/tmp/sample_1.fastq', '/tmp/sample_2.fastq'],
                output_dir: '/tmp/parabricks_output',
                reference_genome: '/tmp/reference.fa',
                additional_args: ['--num-gpus', '1']
            });
            alert(`Parabricks analysis started! Job ID: ${response.data.jobId}`);
            await loadParabricksJobs();
        } catch (error) {
            console.error('Error starting Parabricks analysis:', error);
            alert('Failed to start Parabricks analysis');
        } finally {
            setIsLoading({ ...isLoading, parabricks: false });
        }
    };

    const generateCostEstimate = async () => {
        setIsLoading({ ...isLoading, cost: true });
        try {
            const response = await axios.post('/api/cost-analysis/estimate', {
                sample_count: 50,
                reads_per_sample: 100000,
                sequencing_platform: 'illumina_miseq',
                compute_platform: 'aws_ec2',
                storage_platform: 'aws_s3',
                analysis_types: ['qiime2_amplicon', 'bionemo_inference'],
                project_duration_months: 6,
                team_composition: ['bioinformatician', 'field_researcher'],
                include_overhead: true
            });
            setCostEstimate(response.data);
        } catch (error) {
            console.error('Error generating cost estimate:', error);
            alert('Failed to generate cost estimate');
        } finally {
            setIsLoading({ ...isLoading, cost: false });
        }
    };

    const runBenchmark = async () => {
        setIsLoading({ ...isLoading, benchmark: true });
        try {
            const response = await axios.post('/api/benchmarking/run', {
                test_dataset: '/tmp/test_data',
                pipelines: ['biomapper', 'qiime2-standard', 'nf-core/ampliseq'],
                metrics: ['accuracy', 'runtime', 'memory_usage'],
                iterations: 3
            });
            alert(`Benchmark started! Benchmark ID: ${response.data.benchmarkId}`);
        } catch (error) {
            console.error('Error starting benchmark:', error);
            alert('Failed to start benchmark');
        } finally {
            setIsLoading({ ...isLoading, benchmark: false });
        }
    };

    const recordBlockchainFinding = async () => {
        if (!analysisResults?.classification_results?.[0]) {
            alert('Please run an analysis first');
            return;
        }

        try {
            const firstResult = analysisResults.classification_results[0];
            const response = await axios.post('/api/blockchain/record-finding', {
                sequence_id: firstResult.Sequence_ID,
                species: firstResult.Predicted_Species,
                confidence: parseFloat(firstResult.Classifier_Confidence),
                location: { lat: 19.0760, lon: 72.8777 },
                metadata: {
                    iucn_status: firstResult.iucn_status,
                    novelty_score: parseFloat(firstResult.Novelty_Score)
                }
            });
            alert(`Finding recorded on blockchain! Block hash: ${response.data.block.hash}`);
            await loadBlockchainStatus();
        } catch (error) {
            console.error('Error recording blockchain finding:', error);
            alert('Failed to record finding on blockchain');
        }
    };

    const renderJobStatus = (job: JobStatus) => (
        <div key={job.jobId} className="job-status-card">
            <div className="job-header">
                <span className="job-id">{job.jobId}</span>
                <span className={`job-status ${job.status}`}>{job.status}</span>
            </div>
            <div className="job-details">
                <div className="job-stage">{job.stage}</div>
                <div className="job-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${job.progress}%` }}
                        ></div>
                    </div>
                    <span>{job.progress}%</span>
                </div>
                <div className="job-time">
                    Started: {new Date(job.startTime).toLocaleString()}
                </div>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'blockchain':
                return (
                    <div className="tab-content">
                        <h3>Blockchain Audit Trail</h3>
                        <div className="feature-section">
                            <div className="status-card">
                                <h4>Blockchain Status</h4>
                                {blockchainStatus ? (
                                    <div>
                                        <p><strong>Chain Length:</strong> {blockchainStatus.chain_length}</p>
                                        <p><strong>Last Block Hash:</strong> {blockchainStatus.last_block_hash?.substring(0, 16)}...</p>
                                        <p><strong>Total Findings:</strong> {blockchainStatus.total_findings}</p>
                                        <p><strong>Chain Valid:</strong> {blockchainStatus.chain_valid ? '✅' : '❌'}</p>
                                    </div>
                                ) : (
                                    <p>Loading blockchain status...</p>
                                )}
                            </div>
                            <div className="action-buttons">
                                <button 
                                    onClick={recordBlockchainFinding}
                                    className="primary-button"
                                    disabled={!analysisResults}
                                >
                                    Record Finding on Blockchain
                                </button>
                                <button onClick={loadBlockchainStatus} className="secondary-button">
                                    Refresh Status
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="tab-content">
                        <h3>Cybersecurity Monitoring</h3>
                        <div className="feature-section">
                            <div className="status-card">
                                <h4>Security Health</h4>
                                {securityStatus ? (
                                    <div>
                                        <p><strong>Threat Level:</strong> {securityStatus.threat_level}</p>
                                        <p><strong>Active Monitors:</strong> {securityStatus.active_monitors}</p>
                                        <p><strong>Recent Events:</strong> {securityStatus.recent_events}</p>
                                        <p><strong>System Status:</strong> {securityStatus.system_status}</p>
                                    </div>
                                ) : (
                                    <p>Loading security status...</p>
                                )}
                            </div>
                            <div className="action-buttons">
                                <button onClick={loadSecurityStatus} className="secondary-button">
                                    Refresh Security Status
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'qiime2':
                return (
                    <div className="tab-content">
                        <h3>QIIME2 Amplicon Analysis</h3>
                        <div className="feature-section">
                            <div className="action-buttons">
                                <button 
                                    onClick={runQiime2Analysis}
                                    className="primary-button"
                                    disabled={isLoading.qiime2}
                                >
                                    {isLoading.qiime2 ? 'Starting QIIME2...' : 'Run QIIME2 Analysis'}
                                </button>
                            </div>
                            <div className="jobs-container">
                                <h4>Active QIIME2 Jobs</h4>
                                {qiime2Jobs.length > 0 ? (
                                    qiime2Jobs.map(renderJobStatus)
                                ) : (
                                    <p>No active QIIME2 jobs</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'bionemo':
                return (
                    <div className="tab-content">
                        <h3>NVIDIA BioNeMo AI Models</h3>
                        <div className="feature-section">
                            <div className="action-buttons">
                                <button 
                                    onClick={runBioNeMoAnalysis}
                                    className="primary-button"
                                    disabled={isLoading.bionemo}
                                >
                                    {isLoading.bionemo ? 'Starting BioNeMo...' : 'Run BioNeMo Analysis'}
                                </button>
                            </div>
                            <div className="jobs-container">
                                <h4>Active BioNeMo Jobs</h4>
                                {bioNeMoJobs.length > 0 ? (
                                    bioNeMoJobs.map(renderJobStatus)
                                ) : (
                                    <p>No active BioNeMo jobs</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'parabricks':
                return (
                    <div className="tab-content">
                        <h3>NVIDIA Parabricks Genomics</h3>
                        <div className="feature-section">
                            <div className="action-buttons">
                                <button 
                                    onClick={runParabricksAnalysis}
                                    className="primary-button"
                                    disabled={isLoading.parabricks}
                                >
                                    {isLoading.parabricks ? 'Starting Parabricks...' : 'Run Parabricks Analysis'}
                                </button>
                            </div>
                            <div className="jobs-container">
                                <h4>Active Parabricks Jobs</h4>
                                {parabricksJobs.length > 0 ? (
                                    parabricksJobs.map(renderJobStatus)
                                ) : (
                                    <p>No active Parabricks jobs</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'case-studies':
                return (
                    <div className="tab-content">
                        <h3>Real-World Case Studies</h3>
                        <div className="feature-section">
                            <div className="case-studies-grid">
                                {caseStudies.slice(0, 6).map((study) => (
                                    <div key={study.id} className="case-study-card">
                                        <h4>{study.title}</h4>
                                        <p><strong>Organization:</strong> {study.organization}</p>
                                        <p><strong>Location:</strong> {study.location}</p>
                                        <p><strong>Year:</strong> {study.year}</p>
                                        <p><strong>Type:</strong> {study.type}</p>
                                        <p className="description">{study.description.substring(0, 150)}...</p>
                                        {study.cost_analysis && (
                                            <p><strong>Total Cost:</strong> ${study.cost_analysis.total?.toLocaleString()}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'cost-analysis':
                return (
                    <div className="tab-content">
                        <h3>Cost Analysis & Feasibility</h3>
                        <div className="feature-section">
                            <div className="action-buttons">
                                <button 
                                    onClick={generateCostEstimate}
                                    className="primary-button"
                                    disabled={isLoading.cost}
                                >
                                    {isLoading.cost ? 'Generating Estimate...' : 'Generate Cost Estimate'}
                                </button>
                            </div>
                            {costEstimate && (
                                <div className="cost-estimate-card">
                                    <h4>Project Cost Breakdown</h4>
                                    <div className="cost-grid">
                                        <div className="cost-item">
                                            <span>Sequencing:</span>
                                            <span>${costEstimate.cost_breakdown.sequencing.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-item">
                                            <span>Compute:</span>
                                            <span>${costEstimate.cost_breakdown.compute.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-item">
                                            <span>Storage:</span>
                                            <span>${costEstimate.cost_breakdown.storage.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-item">
                                            <span>Personnel:</span>
                                            <span>${costEstimate.cost_breakdown.personnel.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-item">
                                            <span>Field Work:</span>
                                            <span>${costEstimate.cost_breakdown.field_work.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-item">
                                            <span>Overhead:</span>
                                            <span>${costEstimate.cost_breakdown.overhead.toLocaleString()}</span>
                                        </div>
                                        <div className="cost-item total">
                                            <span><strong>Total:</strong></span>
                                            <span><strong>${costEstimate.cost_breakdown.total.toLocaleString()}</strong></span>
                                        </div>
                                        <div className="cost-item">
                                            <span>Cost per Sample:</span>
                                            <span>${costEstimate.cost_per_sample.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="recommendations">
                                        <h5>Recommendations:</h5>
                                        <ul>
                                            {costEstimate.recommendations.map((rec, index) => (
                                                <li key={index}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'benchmarking':
                return (
                    <div className="tab-content">
                        <h3>Pipeline Benchmarking</h3>
                        <div className="feature-section">
                            <div className="action-buttons">
                                <button 
                                    onClick={runBenchmark}
                                    className="primary-button"
                                    disabled={isLoading.benchmark}
                                >
                                    {isLoading.benchmark ? 'Starting Benchmark...' : 'Run Pipeline Benchmark'}
                                </button>
                            </div>
                            <div className="benchmark-info">
                                <p>Compare BioMapper against industry-standard pipelines:</p>
                                <ul>
                                    <li>QIIME2 Standard Workflow</li>
                                    <li>nf-core/ampliseq</li>
                                    <li>mothur</li>
                                    <li>DADA2 R Pipeline</li>
                                </ul>
                                <p>Metrics evaluated: Accuracy, Runtime, Memory Usage, Reproducibility</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div>Select a feature tab</div>;
        }
    };

    return (
        <div className="advanced-features-panel">
            <div className="panel-header">
                <h2>Advanced Features</h2>
                <p>Enterprise-grade biodiversity analysis tools</p>
            </div>
            
            <div className="tab-navigation">
                {[
                    { id: 'blockchain', label: 'Blockchain' },
                    { id: 'security', label: 'Security' },
                    { id: 'qiime2', label: 'QIIME2' },
                    { id: 'bionemo', label: 'BioNeMo' },
                    { id: 'parabricks', label: 'Parabricks' },
                    { id: 'case-studies', label: 'Case Studies' },
                    { id: 'cost-analysis', label: 'Cost Analysis' },
                    { id: 'benchmarking', label: 'Benchmarking' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content-container">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default AdvancedFeaturesPanel;
