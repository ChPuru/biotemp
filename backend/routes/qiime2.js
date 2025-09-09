const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
// const { verifyToken } = require('../middleware/auth'); // Disabled for demo

// QIIME2 Integration Service
class QIIME2Service {
    constructor() {
        this.jobsPath = path.join(__dirname, '../reports/qiime2_jobs');
        this.activeJobs = new Map();
        this.initializeJobsDirectory();
    }

    async initializeJobsDirectory() {
        try {
            await fs.mkdir(this.jobsPath, { recursive: true });
        } catch (error) {
            console.error('QIIME2 jobs directory initialization error:', error);
        }
    }

    async checkQIIME2Installation() {
        return new Promise((resolve) => {
            const process = spawn('conda', ['list', '-n', 'qiime2-amp', 'qiime2'], {
                stdio: 'pipe'
            });

            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                const isInstalled = code === 0 && output.includes('qiime2');
                resolve({
                    installed: isInstalled,
                    environment: 'qiime2-amp',
                    version: this.extractQIIME2Version(output)
                });
            });

            process.on('error', () => {
                resolve({ installed: false, error: 'Conda not found' });
            });
        });
    }

    extractQIIME2Version(output) {
        const match = output.match(/qiime2\s+(\d+\.\d+\.\d+)/);
        return match ? match[1] : 'unknown';
    }

    async runAmpliconPipeline(jobId, params) {
        const jobDir = path.join(this.jobsPath, jobId);
        await fs.mkdir(jobDir, { recursive: true });

        const logFile = path.join(jobDir, 'pipeline.log');
        const statusFile = path.join(jobDir, 'status.json');

        // Initialize job status
        await this.updateJobStatus(jobId, {
            status: 'running',
            stage: 'initialization',
            startTime: new Date().toISOString(),
            progress: 0
        });

        try {
            // Check QIIME2 installation
            const qiimeCheck = await this.checkQIIME2Installation();
            if (!qiimeCheck.installed) {
                console.warn('QIIME2 not installed, using simulation mode');
                return await this.simulateQIIME2Pipeline(jobId, params);
            }

            // Stage 1: Import sequences
            await this.updateJobStatus(jobId, { stage: 'importing_sequences', progress: 10 });
            await this.importSequences(jobDir, params.inputPath, params.manifestPath);

            // Stage 2: Demultiplexing (if needed)
            if (params.demultiplex) {
                await this.updateJobStatus(jobId, { stage: 'demultiplexing', progress: 20 });
                await this.demultiplexSequences(jobDir, params);
            }

            // Stage 3: Quality control and denoising with DADA2
            await this.updateJobStatus(jobId, { stage: 'denoising', progress: 40 });
            await this.runDADA2Denoising(jobDir, params);

            // Stage 4: Feature table generation
            await this.updateJobStatus(jobId, { stage: 'feature_table', progress: 60 });
            await this.generateFeatureTable(jobDir);

            // Stage 5: Taxonomic classification
            await this.updateJobStatus(jobId, { stage: 'taxonomy', progress: 75 });
            await this.runTaxonomicClassification(jobDir, params.referenceDB || 'silva');

            // Stage 6: Diversity analysis
            await this.updateJobStatus(jobId, { stage: 'diversity', progress: 85 });
            await this.runDiversityAnalysis(jobDir, params);

            // Stage 7: Export results
            await this.updateJobStatus(jobId, { stage: 'exporting', progress: 95 });
            const results = await this.exportResults(jobDir);

            // Complete job
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

    async importSequences(jobDir, inputPath, manifestPath) {
        const cmd = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'tools', 'import',
            '--type', 'SampleData[PairedEndSequencesWithQuality]',
            '--input-path', manifestPath || inputPath,
            '--output-path', path.join(jobDir, 'demux-paired-end.qza'),
            '--input-format', manifestPath ? 'PairedEndFastqManifestPhred33V2' : 'CasavaOneEightSingleLanePerSampleDirFmt'
        ];

        return this.executeQIIMECommand(cmd, jobDir);
    }

    async demultiplexSequences(jobDir, params) {
        // Create demux visualization
        const cmd = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'demux', 'summarize',
            '--i-data', path.join(jobDir, 'demux-paired-end.qza'),
            '--o-visualization', path.join(jobDir, 'demux-summary.qzv')
        ];

        return this.executeQIIMECommand(cmd, jobDir);
    }

    async runDADA2Denoising(jobDir, params) {
        const cmd = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'dada2', 'denoise-paired',
            '--i-demultiplexed-seqs', path.join(jobDir, 'demux-paired-end.qza'),
            '--p-trim-left-f', params.trimLeftF || '0',
            '--p-trim-left-r', params.trimLeftR || '0',
            '--p-trunc-len-f', params.truncLenF || '250',
            '--p-trunc-len-r', params.truncLenR || '250',
            '--o-table', path.join(jobDir, 'table.qza'),
            '--o-representative-sequences', path.join(jobDir, 'rep-seqs.qza'),
            '--o-denoising-stats', path.join(jobDir, 'denoising-stats.qza'),
            '--p-n-threads', params.threads || '4'
        ];

        return this.executeQIIMECommand(cmd, jobDir);
    }

    async generateFeatureTable(jobDir) {
        // Generate feature table summary
        const cmd1 = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'feature-table', 'summarize',
            '--i-table', path.join(jobDir, 'table.qza'),
            '--o-visualization', path.join(jobDir, 'table-summary.qzv')
        ];

        await this.executeQIIMECommand(cmd1, jobDir);

        // Generate representative sequences summary
        const cmd2 = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'feature-table', 'tabulate-seqs',
            '--i-data', path.join(jobDir, 'rep-seqs.qza'),
            '--o-visualization', path.join(jobDir, 'rep-seqs-summary.qzv')
        ];

        return this.executeQIIMECommand(cmd2, jobDir);
    }

    async runTaxonomicClassification(jobDir, referenceDB) {
        // Use pre-trained classifier (Silva 138 99% OTUs)
        const classifierPath = this.getClassifierPath(referenceDB);
        
        const cmd = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'feature-classifier', 'classify-sklearn',
            '--i-classifier', classifierPath,
            '--i-reads', path.join(jobDir, 'rep-seqs.qza'),
            '--o-classification', path.join(jobDir, 'taxonomy.qza')
        ];

        await this.executeQIIMECommand(cmd, jobDir);

        // Generate taxonomy visualization
        const vizCmd = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'metadata', 'tabulate',
            '--m-input-file', path.join(jobDir, 'taxonomy.qza'),
            '--o-visualization', path.join(jobDir, 'taxonomy-summary.qzv')
        ];

        return this.executeQIIMECommand(vizCmd, jobDir);
    }

    async runDiversityAnalysis(jobDir, params) {
        const samplingDepth = params.samplingDepth || '1000';
        
        const cmd = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'diversity', 'core-metrics-phylogenetic',
            '--i-phylogeny', path.join(jobDir, 'rooted-tree.qza'),
            '--i-table', path.join(jobDir, 'table.qza'),
            '--p-sampling-depth', samplingDepth,
            '--output-dir', path.join(jobDir, 'diversity-results')
        ];

        // First generate phylogenetic tree
        await this.generatePhylogeneticTree(jobDir);
        
        return this.executeQIIMECommand(cmd, jobDir);
    }

    async generatePhylogeneticTree(jobDir) {
        // Multiple alignment
        const cmd1 = [
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'phylogeny', 'align-to-tree-mafft-fasttree',
            '--i-sequences', path.join(jobDir, 'rep-seqs.qza'),
            '--o-alignment', path.join(jobDir, 'aligned-rep-seqs.qza'),
            '--o-masked-alignment', path.join(jobDir, 'masked-aligned-rep-seqs.qza'),
            '--o-tree', path.join(jobDir, 'unrooted-tree.qza'),
            '--o-rooted-tree', path.join(jobDir, 'rooted-tree.qza')
        ];

        return this.executeQIIMECommand(cmd1, jobDir);
    }

    async exportResults(jobDir) {
        const exportDir = path.join(jobDir, 'exported');
        await fs.mkdir(exportDir, { recursive: true });

        // Export feature table
        await this.executeQIIMECommand([
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'tools', 'export',
            '--input-path', path.join(jobDir, 'table.qza'),
            '--output-path', exportDir
        ], jobDir);

        // Export taxonomy
        await this.executeQIIMECommand([
            'conda', 'run', '-n', 'qiime2-amp',
            'qiime', 'tools', 'export',
            '--input-path', path.join(jobDir, 'taxonomy.qza'),
            '--output-path', exportDir
        ], jobDir);

        // Convert biom to TSV
        await this.executeQIIMECommand([
            'conda', 'run', '-n', 'qiime2-amp',
            'biom', 'convert',
            '-i', path.join(exportDir, 'feature-table.biom'),
            '-o', path.join(exportDir, 'feature-table.tsv'),
            '--to-tsv'
        ], jobDir);

        return {
            featureTable: path.join(exportDir, 'feature-table.tsv'),
            taxonomy: path.join(exportDir, 'taxonomy.tsv'),
            diversityResults: path.join(jobDir, 'diversity-results'),
            visualizations: {
                demuxSummary: path.join(jobDir, 'demux-summary.qzv'),
                tableSummary: path.join(jobDir, 'table-summary.qzv'),
                taxonomySummary: path.join(jobDir, 'taxonomy-summary.qzv')
            }
        };
    }

    getClassifierPath(referenceDB) {
        const classifiers = {
            'silva': '/opt/qiime2-classifiers/silva-138-99-nb-classifier.qza',
            'greengenes': '/opt/qiime2-classifiers/gg-13-8-99-nb-classifier.qza',
            'unite': '/opt/qiime2-classifiers/unite-ver8-99-classifier.qza'
        };
        
        return classifiers[referenceDB] || classifiers['silva'];
    }

    async executeQIIMECommand(cmd, workingDir) {
        return new Promise((resolve, reject) => {
            const process = spawn(cmd[0], cmd.slice(1), {
                cwd: workingDir,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`QIIME2 command failed: ${stderr || stdout}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Failed to execute QIIME2 command: ${error.message}`));
            });
        });
    }

    async updateJobStatus(jobId, status) {
        const statusFile = path.join(this.jobsPath, jobId, 'status.json');
        const currentStatus = this.activeJobs.get(jobId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };
        
        this.activeJobs.set(jobId, newStatus);
        
        try {
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating job status:', error);
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

    async simulateQIIME2Pipeline(jobId, params) {
        const jobDir = path.join(this.jobsPath, jobId);
        await fs.mkdir(jobDir, { recursive: true });

        // Simulate pipeline stages
        const stages = [
            'importing_sequences',
            'demultiplexing',
            'denoising',
            'feature_table',
            'taxonomy',
            'diversity',
            'exporting'
        ];

        for (let i = 0; i < stages.length; i++) {
            await this.updateJobStatus(jobId, {
                stage: stages[i],
                progress: Math.round(((i + 1) / stages.length) * 100)
            });

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Generate simulated results
        const results = {
            featureTable: path.join(jobDir, 'simulated_feature_table.tsv'),
            taxonomy: path.join(jobDir, 'simulated_taxonomy.tsv'),
            diversityResults: path.join(jobDir, 'simulated_diversity'),
            visualizations: {
                demuxSummary: path.join(jobDir, 'simulated_demux.qzv'),
                tableSummary: path.join(jobDir, 'simulated_table.qzv'),
                taxonomySummary: path.join(jobDir, 'simulated_taxonomy.qzv')
            },
            note: 'Simulated results - QIIME2 not installed',
            species_detected: 125 + Math.floor(Math.random() * 30),
            alpha_diversity: {
                shannon: 3.2 + Math.random() * 1.5,
                observed_features: 85 + Math.floor(Math.random() * 40)
            },
            beta_diversity: {
                bray_curtis_distance: 0.3 + Math.random() * 0.4
            }
        };

        await this.updateJobStatus(jobId, {
            status: 'completed',
            stage: 'finished',
            progress: 100,
            endTime: new Date().toISOString(),
            results
        });

        return results;
    }

    generateJobId() {
        return `qiime2_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
}

// Initialize QIIME2 service
const qiime2Service = new QIIME2Service();

// Routes
router.get('/status', async (req, res) => {
    try {
        const installation = await qiime2Service.checkQIIME2Installation();
        res.json({
            qiime2: installation,
            activeJobs: qiime2Service.activeJobs.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/run', async (req, res) => {
    try {
        const {
            inputPath,
            manifestPath,
            demultiplex = true,
            trimLeftF = 0,
            trimLeftR = 0,
            truncLenF = 250,
            truncLenR = 250,
            referenceDB = 'silva',
            samplingDepth = 1000,
            threads = 4
        } = req.body;

        if (!inputPath) {
            return res.status(400).json({ error: 'Input path is required' });
        }

        const jobId = qiime2Service.generateJobId();
        
        // Start pipeline asynchronously
        qiime2Service.runAmpliconPipeline(jobId, {
            inputPath,
            manifestPath,
            demultiplex,
            trimLeftF,
            trimLeftR,
            truncLenF,
            truncLenR,
            referenceDB,
            samplingDepth,
            threads
        }).catch(error => {
            console.error(`QIIME2 job ${jobId} failed:`, error);
        });

        res.json({
            success: true,
            jobId,
            message: 'QIIME2 amplicon analysis started',
            estimatedDuration: '30-60 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/job/:jobId/status', async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = await qiime2Service.getJobStatus(jobId);
        
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
        const status = await qiime2Service.getJobStatus(jobId);
        
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
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const jobs = Array.from(qiime2Service.activeJobs.entries()).map(([jobId, status]) => ({
            jobId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
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
