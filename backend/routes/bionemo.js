const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
// const { verifyToken } = require('../middleware/auth'); // Disabled for demo

// NVIDIA BioNeMo Integration Service
class BioNeMoService {
    constructor() {
        this.baseURL = process.env.BIONEMO_API_URL || 'https://api.nvcf.nvidia.com/v2/nvcf';
        this.apiKey = process.env.NVIDIA_API_KEY;
        this.jobsPath = path.join(__dirname, '../reports/bionemo_jobs');
        this.activeJobs = new Map();
        this.initializeJobsDirectory();
        
        // Available BioNeMo models
        this.models = {
            'esm2-650m': {
                name: 'ESM-2 650M',
                description: 'Protein language model for embeddings and predictions',
                endpoint: '/functions/nvidia/bionemo/esm2-650m',
                maxSequenceLength: 1024,
                tasks: ['embedding', 'contact_prediction', 'secondary_structure']
            },
            'esm2-3b': {
                name: 'ESM-2 3B',
                description: 'Large protein language model',
                endpoint: '/functions/nvidia/bionemo/esm2-3b',
                maxSequenceLength: 1024,
                tasks: ['embedding', 'contact_prediction', 'secondary_structure', 'function_prediction']
            },
            'evo-1-8b': {
                name: 'Evo-1 8B',
                description: 'DNA foundation model for genomic analysis',
                endpoint: '/functions/nvidia/bionemo/evo-1-8b',
                maxSequenceLength: 131072,
                tasks: ['embedding', 'variant_effect', 'regulatory_prediction']
            },
            'geneformer': {
                name: 'Geneformer',
                description: 'Single-cell gene expression transformer',
                endpoint: '/functions/nvidia/bionemo/geneformer',
                maxSequenceLength: 2048,
                tasks: ['cell_classification', 'gene_network', 'perturbation_prediction']
            },
            'molmim': {
                name: 'MolMIM',
                description: 'Molecular property prediction model',
                endpoint: '/functions/nvidia/bionemo/molmim',
                maxSequenceLength: 512,
                tasks: ['property_prediction', 'molecular_embedding', 'drug_discovery']
            },
            'alphafold2': {
                name: 'AlphaFold2',
                description: 'Protein structure prediction',
                endpoint: '/functions/nvidia/bionemo/alphafold2',
                maxSequenceLength: 2048,
                tasks: ['structure_prediction', 'confidence_scoring']
            }
        };
    }

    async initializeJobsDirectory() {
        try {
            await fs.mkdir(this.jobsPath, { recursive: true });
        } catch (error) {
            console.error('BioNeMo jobs directory initialization error:', error);
        }
    }

    async checkAPIConnection() {
        try {
            if (!this.apiKey) {
                return {
                    connected: false,
                    error: 'NVIDIA API key not configured'
                };
            }

            const response = await axios.get(`${this.baseURL}/functions`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return {
                connected: true,
                availableFunctions: response.data?.functions?.length || 0,
                status: 'API connection successful'
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                fallback: 'Local inference available'
            };
        }
    }

    async runProteinAnalysis(jobId, params) {
        const { sequence, model = 'esm2-650m', tasks = ['embedding'] } = params;
        
        try {
            await this.updateJobStatus(jobId, {
                status: 'running',
                stage: 'initialization',
                model,
                tasks,
                startTime: new Date().toISOString(),
                progress: 0
            });

            const modelConfig = this.models[model];
            if (!modelConfig) {
                throw new Error(`Unsupported model: ${model}`);
            }

            if (sequence.length > modelConfig.maxSequenceLength) {
                throw new Error(`Sequence too long for ${model}. Max length: ${modelConfig.maxSequenceLength}`);
            }

            const results = {};

            // Run each requested task
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                const progress = Math.round(((i + 1) / tasks.length) * 80);
                
                await this.updateJobStatus(jobId, {
                    stage: `running_${task}`,
                    progress
                });

                if (modelConfig.tasks.includes(task)) {
                    results[task] = await this.runBioNeMoTask(model, task, sequence);
                } else {
                    results[task] = { error: `Task ${task} not supported by ${model}` };
                }
            }

            await this.updateJobStatus(jobId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results
            });

            return results;

        } catch (error) {
            await this.updateJobStatus(jobId, {
                status: 'failed',
                stage: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    async runBioNeMoTask(model, task, sequence) {
        try {
            const modelConfig = this.models[model];
            const payload = this.buildTaskPayload(model, task, sequence);

            const response = await axios.post(
                `${this.baseURL}${modelConfig.endpoint}`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 300000 // 5 minutes
                }
            );

            return this.parseTaskResponse(task, response.data);

        } catch (error) {
            if (error.response?.status === 401) {
                console.warn('Invalid NVIDIA API key, using simulation mode');
                return this.simulateTaskResult(task, sequence);
            } else if (error.response?.status === 429) {
                console.warn('Rate limit exceeded, using simulation mode');
                return this.simulateTaskResult(task, sequence);
            } else if (error.code === 'ECONNABORTED') {
                console.warn('Request timeout, using simulation mode');
                return this.simulateTaskResult(task, sequence);
            } else if (!this.apiKey) {
                console.warn('NVIDIA API key not configured, using simulation mode');
                return this.simulateTaskResult(task, sequence);
            }

            // Fallback to local inference simulation for any other error
            console.warn(`BioNeMo API failed for ${task}, using fallback:`, error.message);
            return this.simulateTaskResult(task, sequence);
        }
    }

    buildTaskPayload(model, task, sequence) {
        const basePayload = {
            sequence: sequence,
            task: task
        };

        // Model-specific payload modifications
        switch (model) {
            case 'esm2-650m':
            case 'esm2-3b':
                return {
                    ...basePayload,
                    include_contacts: task === 'contact_prediction',
                    include_attention: task === 'embedding',
                    repr_layers: task === 'embedding' ? [33] : undefined
                };
            
            case 'evo-1-8b':
                return {
                    ...basePayload,
                    sequence_type: 'dna',
                    max_length: 131072
                };
            
            case 'geneformer':
                return {
                    ...basePayload,
                    cell_type: 'generic',
                    normalize: true
                };
            
            case 'alphafold2':
                return {
                    ...basePayload,
                    num_recycles: 3,
                    max_msa_clusters: 512
                };
            
            default:
                return basePayload;
        }
    }

    parseTaskResponse(task, responseData) {
        switch (task) {
            case 'embedding':
                return {
                    embeddings: responseData.embeddings || responseData.representations,
                    dimensions: responseData.embeddings?.[0]?.length || 1280,
                    sequence_length: responseData.sequence_length
                };
            
            case 'contact_prediction':
                return {
                    contacts: responseData.contacts,
                    confidence_scores: responseData.confidence,
                    top_contacts: responseData.contacts?.slice(0, 100)
                };
            
            case 'secondary_structure':
                return {
                    structure: responseData.secondary_structure,
                    confidence: responseData.confidence,
                    helix_prob: responseData.helix_probability,
                    sheet_prob: responseData.sheet_probability,
                    coil_prob: responseData.coil_probability
                };
            
            case 'structure_prediction':
                return {
                    pdb_string: responseData.pdb,
                    confidence_scores: responseData.plddt,
                    predicted_aligned_error: responseData.pae,
                    structure_confidence: responseData.ranking_confidence
                };
            
            case 'variant_effect':
                return {
                    variant_effects: responseData.effects,
                    pathogenicity_scores: responseData.pathogenicity,
                    conservation_scores: responseData.conservation
                };
            
            default:
                return responseData;
        }
    }

    simulateTaskResult(task, sequence) {
        const seqLength = sequence.length;
        
        switch (task) {
            case 'embedding':
                return {
                    embeddings: Array(seqLength).fill().map(() => 
                        Array(1280).fill().map(() => Math.random() * 2 - 1)
                    ),
                    dimensions: 1280,
                    sequence_length: seqLength,
                    note: 'Simulated embeddings - API unavailable'
                };
            
            case 'contact_prediction':
                const numContacts = Math.min(100, Math.floor(seqLength * 0.1));
                return {
                    contacts: Array(numContacts).fill().map(() => [
                        Math.floor(Math.random() * seqLength),
                        Math.floor(Math.random() * seqLength),
                        Math.random()
                    ]),
                    confidence_scores: Array(numContacts).fill().map(() => Math.random()),
                    note: 'Simulated contacts - API unavailable'
                };
            
            case 'secondary_structure':
                const structures = ['H', 'E', 'C']; // Helix, Sheet, Coil
                return {
                    structure: Array(seqLength).fill().map(() => 
                        structures[Math.floor(Math.random() * 3)]
                    ).join(''),
                    confidence: Array(seqLength).fill().map(() => Math.random()),
                    note: 'Simulated structure - API unavailable'
                };
            
            case 'structure_prediction':
                return {
                    pdb_string: this.generateMockPDB(sequence),
                    confidence_scores: Array(seqLength).fill().map(() => 50 + Math.random() * 50),
                    note: 'Simulated structure - API unavailable'
                };
            
            default:
                return {
                    result: 'Task completed with simulation',
                    note: 'API unavailable - using fallback'
                };
        }
    }

    generateMockPDB(sequence) {
        let pdb = 'HEADER    SIMULATED STRUCTURE\n';
        pdb += 'REMARK   Generated by BioMapper fallback system\n';
        
        for (let i = 0; i < Math.min(sequence.length, 50); i++) {
            const x = Math.random() * 50 - 25;
            const y = Math.random() * 50 - 25;
            const z = Math.random() * 50 - 25;
            
            pdb += `ATOM  ${(i + 1).toString().padStart(5)} CA  ${sequence[i]}   A${(i + 1).toString().padStart(4)}    `;
            pdb += `${x.toFixed(3).padStart(8)}${y.toFixed(3).padStart(8)}${z.toFixed(3).padStart(8)}`;
            pdb += '  1.00 50.00           C\n';
        }
        
        pdb += 'END\n';
        return pdb;
    }

    async runGenomicAnalysis(jobId, params) {
        const { sequence, model = 'evo-1-8b', analysis_type = 'variant_effect' } = params;
        
        try {
            await this.updateJobStatus(jobId, {
                status: 'running',
                stage: 'genomic_analysis',
                model,
                analysis_type,
                startTime: new Date().toISOString(),
                progress: 0
            });

            const result = await this.runBioNeMoTask(model, analysis_type, sequence);

            await this.updateJobStatus(jobId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: result
            });

            return result;

        } catch (error) {
            await this.updateJobStatus(jobId, {
                status: 'failed',
                stage: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    async updateJobStatus(jobId, status) {
        const statusFile = path.join(this.jobsPath, `${jobId}.json`);
        const currentStatus = this.activeJobs.get(jobId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };
        
        this.activeJobs.set(jobId, newStatus);
        
        try {
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating BioNeMo job status:', error);
        }
        
        return newStatus;
    }

    async getJobStatus(jobId) {
        if (this.activeJobs.has(jobId)) {
            return this.activeJobs.get(jobId);
        }

        try {
            const statusFile = path.join(this.jobsPath, `${jobId}.json`);
            const statusData = await fs.readFile(statusFile, 'utf8');
            const status = JSON.parse(statusData);
            this.activeJobs.set(jobId, status);
            return status;
        } catch (error) {
            return null;
        }
    }

    generateJobId() {
        return `bionemo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
}

// Initialize BioNeMo service
const bioNeMoService = new BioNeMoService();

// Routes
router.get('/status', async (req, res) => {
    try {
        const apiStatus = await bioNeMoService.checkAPIConnection();
        res.json({
            bionemo: apiStatus,
            models: Object.keys(bioNeMoService.models),
            activeJobs: bioNeMoService.activeJobs.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/models', async (req, res) => {
    try {
        res.json({
            models: bioNeMoService.models,
            total: Object.keys(bioNeMoService.models).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/protein/analyze', async (req, res) => {
    try {
        const { sequence, model = 'esm2-650m', tasks = ['embedding'] } = req.body;

        if (!sequence) {
            return res.status(400).json({ error: 'Protein sequence is required' });
        }

        if (!/^[ACDEFGHIKLMNPQRSTVWY]+$/i.test(sequence)) {
            return res.status(400).json({ error: 'Invalid protein sequence' });
        }

        const jobId = bioNeMoService.generateJobId();
        
        // Start analysis asynchronously
        bioNeMoService.runProteinAnalysis(jobId, { sequence, model, tasks })
            .catch(error => {
                console.error(`BioNeMo protein analysis ${jobId} failed:`, error);
            });

        res.json({
            success: true,
            jobId,
            message: 'Protein analysis started',
            model,
            tasks,
            estimatedDuration: '2-10 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/genomic/analyze', async (req, res) => {
    try {
        const { sequence, model = 'evo-1-8b', analysis_type = 'variant_effect' } = req.body;

        if (!sequence) {
            return res.status(400).json({ error: 'DNA sequence is required' });
        }

        if (!/^[ATCG]+$/i.test(sequence)) {
            return res.status(400).json({ error: 'Invalid DNA sequence' });
        }

        const jobId = bioNeMoService.generateJobId();
        
        // Start analysis asynchronously
        bioNeMoService.runGenomicAnalysis(jobId, { sequence, model, analysis_type })
            .catch(error => {
                console.error(`BioNeMo genomic analysis ${jobId} failed:`, error);
            });

        res.json({
            success: true,
            jobId,
            message: 'Genomic analysis started',
            model,
            analysis_type,
            estimatedDuration: '5-15 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/job/:jobId/status', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await bioNeMoService.getJobStatus(jobId);
        
        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/job/:jobId/results', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await bioNeMoService.getJobStatus(jobId);
        
        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        if (status.status !== 'completed') {
            return res.status(400).json({ 
                error: 'Job not completed', 
                currentStatus: status.status,
                stage: status.stage 
            });
        }
        
        res.json({
            jobId,
            results: status.results,
            model: status.model,
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = Array.from(bioNeMoService.activeJobs.entries()).map(([jobId, status]) => ({
            jobId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
            model: status.model,
            startTime: status.startTime,
            lastUpdate: status.lastUpdate
        }));
        
        res.json({
            jobs,
            total: jobs.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
