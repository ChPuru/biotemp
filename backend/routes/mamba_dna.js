const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');
const { runPythonScript } = require('../services/python_runner');

// Mamba DNA Integration Service
class MambaDNAService {
    constructor() {
        this.jobsPath = path.join(__dirname, '../reports/mamba_dna_jobs');
        this.activeJobs = new Map();
        this.initializeJobsDirectory();

        // Available Mamba DNA models
        this.models = {
            'hyenadna': {
                name: 'HyenaDNA',
                description: 'Long-range DNA foundation model for million-length sequences',
                maxLength: 1000000,
                tasks: ['embedding', 'classification', 'variant_prediction', 'promoter_prediction', 'enhancer_prediction'],
                performance: {
                    embedding_throughput: '1000 seq/sec',
                    memory_usage: '8GB',
                    gpu_required: true
                }
            },
            'caduceus': {
                name: 'Caduceus',
                description: 'Bidirectional DNA foundation model with global context',
                maxLength: 131072,
                tasks: ['embedding', 'gene_expression_prediction', 'chromatin_interaction', '3d_structure_prediction'],
                performance: {
                    embedding_throughput: '500 seq/sec',
                    memory_usage: '16GB',
                    gpu_required: true
                }
            },
            'mamba_dna': {
                name: 'Mamba-DNA',
                description: 'State-space model optimized for DNA sequences',
                maxLength: 32768,
                tasks: ['embedding', 'sequence_classification', 'motif_discovery', 'epigenetic_prediction'],
                performance: {
                    embedding_throughput: '2000 seq/sec',
                    memory_usage: '4GB',
                    gpu_required: false
                }
            },
            'dnamba': {
                name: 'DNAMamba',
                description: 'DNA-specific Mamba architecture with k-mer tokenization',
                maxLength: 16384,
                tasks: ['embedding', 'species_classification', 'novelty_detection', 'phylogenetic_inference'],
                performance: {
                    embedding_throughput: '1500 seq/sec',
                    memory_usage: '6GB',
                    gpu_required: false
                }
            }
        };
    }

    async initializeJobsDirectory() {
        try {
            await fs.mkdir(this.jobsPath, { recursive: true });
        } catch (error) {
            console.error('Mamba DNA jobs directory initialization error:', error);
        }
    }

    async runAnalysis(jobId, params) {
        const { sequences, model = 'hyenadna', task = 'embedding', options = {} } = params;

        try {
            await this.updateJobStatus(jobId, {
                status: 'running',
                stage: 'initialization',
                model,
                task,
                startTime: new Date().toISOString(),
                progress: 0,
                options
            });

            // Validate inputs
            const validation = this.validateInputs(sequences, model, task);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Prepare sequences file
            const sequencesFile = path.join(this.jobsPath, `${jobId}_sequences.fasta`);
            await this.writeSequencesFile(sequencesFile, sequences);

            await this.updateJobStatus(jobId, {
                stage: 'running_analysis',
                progress: 25
            });

            // Run Mamba DNA analysis
            const result = await this.executeMambaAnalysis(jobId, sequencesFile, model, task, options);

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

    validateInputs(sequences, model, task) {
        if (!sequences || !Array.isArray(sequences) || sequences.length === 0) {
            return { valid: false, error: 'Sequences array is required and cannot be empty' };
        }

        if (!this.models[model]) {
            return { valid: false, error: `Unsupported model: ${model}` };
        }

        const modelConfig = this.models[model];
        if (!modelConfig.tasks.includes(task)) {
            return { valid: false, error: `Task '${task}' not supported by model '${model}'` };
        }

        // Check sequence lengths
        for (let i = 0; i < sequences.length; i++) {
            const seq = sequences[i];
            if (typeof seq !== 'string') {
                return { valid: false, error: `Sequence at index ${i} must be a string` };
            }
            if (seq.length > modelConfig.maxLength) {
                return {
                    valid: false,
                    error: `Sequence ${i} length (${seq.length}) exceeds model maximum (${modelConfig.maxLength})`
                };
            }
            if (!/^[ATCGNatcgn]+$/.test(seq)) {
                return { valid: false, error: `Sequence ${i} contains invalid characters` };
            }
        }

        return { valid: true };
    }

    async writeSequencesFile(filePath, sequences) {
        let content = '';
        for (let i = 0; i < sequences.length; i++) {
            content += `>sequence_${i}\n${sequences[i]}\n`;
        }
        await fs.writeFile(filePath, content, 'utf8');
    }

    async executeMambaAnalysis(jobId, sequencesFile, model, task, options) {
        try {
            const pythonScript = path.join(__dirname, '../../python_engine/run_mamba_dna.py');
            const args = [sequencesFile, model, task];

            const result = await runPythonScript(pythonScript, args);

            if (result.status !== 'success') {
                throw new Error(result.error || 'Mamba DNA analysis failed');
            }

            return result.data;

        } catch (error) {
            console.error('Mamba DNA execution error:', error);
            throw new Error(`Analysis execution failed: ${error.message}`);
        }
    }

    async updateJobStatus(jobId, status) {
        const statusFile = path.join(this.jobsPath, jobId, 'status.json');
        const currentStatus = this.activeJobs.get(jobId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeJobs.set(jobId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating Mamba DNA job status:', error);
        }

        return newStatus;
    }

    async getJobStatus(jobId) {
        if (this.activeJobs.has(jobId)) {
            return this.activeJobs.get(jobId);
        }

        try {
            const statusFile = path.join(this.jobsPath, jobId, 'status.json');
            const statusData = await fs.readFile(statusFile, 'utf8');
            const status = JSON.parse(statusData);
            this.activeJobs.set(jobId, status);
            return status;
        } catch (error) {
            return null;
        }
    }

    generateJobId() {
        return `mamba_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableModels() {
        return Object.keys(this.models).map(key => ({
            id: key,
            ...this.models[key]
        }));
    }
}

// Initialize Mamba DNA service
const mambaDNAService = new MambaDNAService();

// Routes
router.get('/status', verifyToken, async (req, res) => {
    try {
        res.json({
            service: 'Mamba DNA Integration',
            activeJobs: mambaDNAService.activeJobs.size,
            availableModels: mambaDNAService.getAvailableModels(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/models', verifyToken, async (req, res) => {
    try {
        res.json({
            models: mambaDNAService.getAvailableModels(),
            total: Object.keys(mambaDNAService.models).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/analyze', verifyToken, async (req, res) => {
    try {
        const { sequences, model = 'hyenadna', task = 'embedding', options = {} } = req.body;

        if (!sequences || !Array.isArray(sequences)) {
            return res.status(400).json({ error: 'Sequences array is required' });
        }

        const jobId = mambaDNAService.generateJobId();

        // Start analysis asynchronously
        mambaDNAService.runAnalysis(jobId, { sequences, model, task, options })
            .catch(error => {
                console.error(`Mamba DNA analysis ${jobId} failed:`, error);
            });

        res.json({
            success: true,
            jobId,
            message: 'Mamba DNA analysis started',
            model,
            task,
            sequencesCount: sequences.length,
            estimatedDuration: '5-30 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/job/:jobId/status', verifyToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await mambaDNAService.getJobStatus(jobId);

        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/job/:jobId/results', verifyToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await mambaDNAService.getJobStatus(jobId);

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
            task: status.task,
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jobs', verifyToken, async (req, res) => {
    try {
        const jobs = Array.from(mambaDNAService.activeJobs.entries()).map(([jobId, status]) => ({
            jobId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
            model: status.model,
            task: status.task,
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

router.post('/compare-models', verifyToken, async (req, res) => {
    try {
        const { sequences, models = ['hyenadna', 'caduceus'], task = 'embedding' } = req.body;

        if (!sequences || !Array.isArray(sequences)) {
            return res.status(400).json({ error: 'Sequences array is required' });
        }

        const comparisonResults = {};

        for (const model of models) {
            try {
                const jobId = mambaDNAService.generateJobId();
                const result = await mambaDNAService.runAnalysis(jobId, {
                    sequences: sequences.slice(0, 5), // Limit for comparison
                    model,
                    task
                });
                comparisonResults[model] = {
                    status: 'success',
                    results: result,
                    jobId
                };
            } catch (error) {
                comparisonResults[model] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        res.json({
            comparison: comparisonResults,
            modelsCompared: models,
            sequencesCount: sequences.length,
            task,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;