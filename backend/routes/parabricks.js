const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
// const { verifyToken } = require('../middleware/auth'); // Disabled for demo
const { runPythonScript } = require('../services/python_runner');

// Parabricks GPU-Accelerated Genomics Service
class ParabricksService {
    constructor() {
        this.jobsPath = path.join(__dirname, '../reports/parabricks_jobs');
        this.activeJobs = new Map();
        this.initializeJobsDirectory();

        // Available Parabricks tools
        this.tools = {
            'deepvariant': {
                name: 'DeepVariant',
                description: 'GPU-accelerated variant calling using deep learning',
                inputs: ['bam_file', 'reference_genome'],
                outputs: ['vcf_file', 'gvcf_file', 'metrics'],
                typical_speedup: '10-50x',
                gpu_memory_gb: 16
            },
            'fq2bam': {
                name: 'FQ2BAM',
                description: 'Fastq to BAM conversion with GPU acceleration',
                inputs: ['fastq_files', 'reference_genome'],
                outputs: ['bam_file', 'bai_file', 'recal_file'],
                typical_speedup: '5-20x',
                gpu_memory_gb: 8
            },
            'haplotypecaller': {
                name: 'HaplotypeCaller',
                description: 'GPU-accelerated germline variant calling',
                inputs: ['bam_file', 'reference_genome'],
                outputs: ['vcf_file', 'gvcf_file'],
                typical_speedup: '8-30x',
                gpu_memory_gb: 12
            },
            'mutectcaller': {
                name: 'Mutect2',
                description: 'GPU-accelerated somatic variant calling',
                inputs: ['tumor_bam', 'normal_bam', 'reference_genome'],
                outputs: ['vcf_file', 'f1r2_file'],
                typical_speedup: '6-25x',
                gpu_memory_gb: 16
            },
            'rnaseq': {
                name: 'RNA-seq Pipeline',
                description: 'Complete GPU-accelerated RNA-seq analysis',
                inputs: ['fastq_files', 'reference_genome', 'annotation'],
                outputs: ['bam_file', 'counts_file', 'fusion_file'],
                typical_speedup: '3-15x',
                gpu_memory_gb: 24
            },
            'methylation': {
                name: 'Methylation Analysis',
                description: 'GPU-accelerated methylation calling',
                inputs: ['bam_file', 'reference_genome'],
                outputs: ['methylation_calls', 'bed_file'],
                typical_speedup: '4-12x',
                gpu_memory_gb: 20
            }
        };
    }

    async initializeJobsDirectory() {
        try {
            await fs.mkdir(this.jobsPath, { recursive: true });
        } catch (error) {
            console.error('Parabricks jobs directory initialization error:', error);
        }
    }

    async runAnalysis(jobId, params) {
        const { tool, input_files, output_dir, options = {} } = params;

        try {
            await this.updateJobStatus(jobId, {
                status: 'running',
                stage: 'initialization',
                tool,
                startTime: new Date().toISOString(),
                progress: 0,
                options
            });

            // Validate inputs
            const validation = this.validateInputs(tool, input_files);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Prepare output directory
            const jobOutputDir = path.join(output_dir || this.jobsPath, jobId);
            await fs.mkdir(jobOutputDir, { recursive: true });

            await this.updateJobStatus(jobId, {
                stage: 'running_analysis',
                progress: 25
            });

            // Run Parabricks analysis
            const result = await this.executeParabricksAnalysis(jobId, tool, input_files, jobOutputDir, options);

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

    validateInputs(tool, inputFiles) {
        if (!this.tools[tool]) {
            return { valid: false, error: `Unsupported tool: ${tool}` };
        }

        const toolConfig = this.tools[tool];
        const requiredInputs = toolConfig.inputs;

        for (const input of requiredInputs) {
            if (!inputFiles[input]) {
                return { valid: false, error: `Missing required input: ${input}` };
            }

            // Check if file exists
            if (typeof inputFiles[input] === 'string') {
                try {
                    require('fs').accessSync(inputFiles[input]);
                } catch {
                    console.warn(`Input file not found: ${inputFiles[input]}, using simulation mode`);
                    // Don't fail validation, let the service handle missing files with simulation
                }
            }
        }

        return { valid: true };
    }

    async executeParabricksAnalysis(jobId, tool, inputFiles, outputDir, options) {
        try {
            const pythonScript = path.join(__dirname, '../../python_engine/run_parabricks.py');

            // Prepare arguments based on tool
            let args = [tool];

            switch (tool) {
                case 'deepvariant':
                    args.push(inputFiles.bam_file, inputFiles.reference_genome, outputDir);
                    break;
                case 'fq2bam':
                    args.push(inputFiles.fastq_files[0], inputFiles.fastq_files[1],
                             inputFiles.reference_genome, outputDir);
                    break;
                case 'rnaseq':
                    args.push(inputFiles.fastq_files[0], inputFiles.fastq_files[1],
                             inputFiles.reference_genome, inputFiles.annotation, outputDir);
                    break;
                default:
                    throw new Error(`Tool ${tool} not yet implemented in route handler`);
            }

            const result = await runPythonScript(pythonScript, args);

            if (result.status !== 'success') {
                throw new Error(result.error || `${tool} analysis failed`);
            }

            return result.data;

        } catch (error) {
            console.error('Parabricks execution error:', error);
            throw new Error(`Analysis execution failed: ${error.message}`);
        }
    }

    async runBenchmark(jobId, params) {
        const { tool, input_files, iterations = 3, output_dir } = params;

        try {
            await this.updateJobStatus(jobId, {
                status: 'running',
                stage: 'benchmark_setup',
                tool,
                iterations,
                startTime: new Date().toISOString(),
                progress: 0
            });

            // Create benchmark configuration
            const configFile = path.join(this.jobsPath, `${jobId}_config.json`);
            const config = {
                input_files: input_files,
                iterations: iterations
            };

            await fs.writeFile(configFile, JSON.stringify(config, null, 2));

            await this.updateJobStatus(jobId, {
                stage: 'running_benchmark',
                progress: 25
            });

            // Run benchmark
            const pythonScript = path.join(__dirname, '../../python_engine/run_parabricks.py');
            const result = await runPythonScript(pythonScript, ['benchmark', tool, configFile]);

            if (result.status !== 'success') {
                throw new Error(result.error || 'Benchmark failed');
            }

            await this.updateJobStatus(jobId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: result.data
            });

            return result.data;

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
        const statusFile = path.join(this.jobsPath, jobId, 'status.json');
        const currentStatus = this.activeJobs.get(jobId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeJobs.set(jobId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating Parabricks job status:', error);
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
        return `parabricks_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableTools() {
        return Object.keys(this.tools).map(key => ({
            id: key,
            ...this.tools[key]
        }));
    }
}

// Initialize Parabricks service
const parabricksService = new ParabricksService();

// Routes
router.get('/status', async (req, res) => {
    try {
        // Get Parabricks status from Python service
        const pythonScript = path.join(__dirname, '../../python_engine/run_parabricks.py');
        const result = await runPythonScript(pythonScript, ['status']);

        res.json({
            service: 'Parabricks GPU-Accelerated Genomics',
            status: result.status === 'success' ? result.data : { error: result.error },
            activeJobs: parabricksService.activeJobs.size,
            availableTools: parabricksService.getAvailableTools(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/tools', async (req, res) => {
    try {
        res.json({
            tools: parabricksService.getAvailableTools(),
            total: Object.keys(parabricksService.tools).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/analyze', async (req, res) => {
    try {
        const { tool, input_files, output_dir, options = {} } = req.body;

        if (!tool || !input_files) {
            return res.status(400).json({ error: 'Tool and input_files are required' });
        }

        const jobId = parabricksService.generateJobId();

        // Start analysis asynchronously
        parabricksService.runAnalysis(jobId, { tool, input_files, output_dir, options })
            .catch(error => {
                console.error(`Parabricks analysis ${jobId} failed:`, error);
            });

        res.json({
            success: true,
            jobId,
            message: `${tool} analysis started`,
            tool,
            estimatedDuration: '10-60 minutes',
            gpu_accelerated: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/benchmark', async (req, res) => {
    try {
        const { tool, input_files, iterations = 3, output_dir } = req.body;

        if (!tool || !input_files) {
            return res.status(400).json({ error: 'Tool and input_files are required' });
        }

        const jobId = parabricksService.generateJobId();

        // Start benchmark asynchronously
        parabricksService.runBenchmark(jobId, { tool, input_files, iterations, output_dir })
            .catch(error => {
                console.error(`Parabricks benchmark ${jobId} failed:`, error);
            });

        res.json({
            success: true,
            jobId,
            message: `${tool} benchmark started`,
            tool,
            iterations,
            estimatedDuration: `${iterations * 15} minutes`,
            gpu_accelerated: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/job/:jobId/status', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await parabricksService.getJobStatus(jobId);

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
        const status = await parabricksService.getJobStatus(jobId);

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
            tool: status.tool,
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/run', async (req, res) => {
    try {
        const { tool, input_files, output_dir, additional_args = [] } = req.body;

        if (!tool || !input_files) {
            return res.status(400).json({ error: 'Tool and input_files are required' });
        }

        const jobId = parabricksService.generateJobId();

        // Start analysis asynchronously
        parabricksService.runAnalysis(jobId, { tool, input_files, output_dir, additional_args })
            .catch(error => {
                console.error(`Parabricks analysis ${jobId} failed:`, error);
            });

        res.json({
            success: true,
            jobId,
            message: `${tool} analysis started`,
            tool,
            estimatedDuration: '10-60 minutes',
            gpu_accelerated: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = Array.from(parabricksService.activeJobs.entries()).map(([jobId, status]) => ({
            jobId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
            tool: status.tool,
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

router.post('/performance-comparison', async (req, res) => {
    try {
        const { tools, input_files, iterations = 3 } = req.body;

        if (!tools || !Array.isArray(tools) || !input_files) {
            return res.status(400).json({ error: 'Tools array and input_files are required' });
        }

        const comparisonResults = {};

        for (const tool of tools) {
            try {
                const jobId = parabricksService.generateJobId();
                const result = await parabricksService.runBenchmark(jobId, {
                    tool,
                    input_files,
                    iterations
                });
                comparisonResults[tool] = {
                    status: 'success',
                    results: result,
                    jobId
                };
            } catch (error) {
                comparisonResults[tool] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Generate comparison summary
        const summary = parabricksService.generatePerformanceSummary(comparisonResults);

        res.json({
            comparison: comparisonResults,
            summary,
            toolsCompared: tools,
            iterations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/gpu-info', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../../python_engine/run_parabricks.py');
        const result = await runPythonScript(pythonScript, ['status']);

        if (result.status === 'success' && result.data.gpu_available) {
            res.json(result.data);
        } else {
            res.json({
                gpu_available: false,
                message: 'GPU information not available'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper method for performance summary
parabricksService.generatePerformanceSummary = function(comparisonResults) {
    const successfulResults = Object.entries(comparisonResults)
        .filter(([_, result]) => result.status === 'success')
        .map(([tool, result]) => ({ tool, ...result.results }));

    if (successfulResults.length === 0) {
        return { error: 'No successful benchmark results to compare' };
    }

    const summary = {
        tools_compared: successfulResults.length,
        fastest_tool: successfulResults.reduce((prev, current) =>
            prev.average_runtime < current.average_runtime ? prev : current
        ).tool,
        best_speedup: successfulResults.reduce((prev, current) =>
            prev.average_runtime < current.average_runtime ? prev : current
        ),
        performance_ranking: successfulResults
            .sort((a, b) => a.average_runtime - b.average_runtime)
            .map(r => ({ tool: r.tool, avg_runtime: r.average_runtime }))
    };

    return summary;
};

module.exports = router;
