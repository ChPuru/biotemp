const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MicroBiomeAnalyzer {
    constructor() {
        this.pythonPath = process.platform === 'win32' ? 'python' : 'python3';
        this.scriptsPath = path.join(__dirname, '../scripts');
        this.tempPath = path.join(__dirname, '../temp/microbiome');
        this.initializeDirectories();
    }

    async initializeDirectories() {
        try {
            await fs.mkdir(this.scriptsPath, { recursive: true });
            await fs.mkdir(this.tempPath, { recursive: true });
        } catch (error) {
            console.error('MicroBiome directories initialization error:', error);
        }
    }

    async analyzeSequences(sequences, parameters = {}) {
        const analysisId = `microbiome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Create temporary input file
            const inputData = {
                sequences: sequences,
                parameters: {
                    kmer_size: parameters.kmer_size || 4,
                    clustering_method: parameters.clustering_method || 'kmeans',
                    max_clusters: parameters.max_clusters || Math.min(10, sequences.length),
                    analysis_type: parameters.analysis_type || 'comprehensive'
                },
                analysis_id: analysisId
            };

            const inputPath = path.join(this.tempPath, `${analysisId}_input.json`);
            await fs.writeFile(inputPath, JSON.stringify(inputData, null, 2));

            // Run Python analysis
            const results = await this.runPythonAnalysis(inputPath);

            // Cleanup
            try {
                await fs.unlink(inputPath);
            } catch (error) {
                console.warn('Cleanup failed:', error);
            }

            return {
                status: 'success',
                analysis_id: analysisId,
                method: 'microbiome_pipeline',
                results: results,
                timestamp: new Date().toISOString(),
                parameters: inputData.parameters
            };

        } catch (error) {
            console.error('MicroBiome analysis failed:', error);

            // Return basic fallback analysis
            return {
                status: 'fallback',
                analysis_id: analysisId,
                method: 'microbiome_basic_fallback',
                results: await this.basicFallbackAnalysis(sequences),
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    runPythonAnalysis(inputPath) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonPath, [
                path.join(this.scriptsPath, 'microbiome_analyzer.py'),
                inputPath
            ], {
                cwd: this.scriptsPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, PYTHONPATH: this.scriptsPath }
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const results = JSON.parse(stdout.trim());
                        resolve(results);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse Python results: ${parseError.message}\nStdout: ${stdout}`));
                    }
                } else {
                    reject(new Error(`Python analysis failed with code ${code}: ${stderr}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });

            // Timeout after 5 minutes
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Analysis timeout after 5 minutes'));
            }, 300000);
        });
    }

    async basicFallbackAnalysis(sequences) {
        // Basic analysis when Python script fails
        const results = {
            sequence_count: sequences.length,
            basic_metrics: {},
            composition_analysis: {},
            quality_assessment: {}
        };

        // Basic sequence metrics
        const lengths = sequences.map(seq => seq.length);
        results.basic_metrics = {
            average_length: lengths.reduce((a, b) => a + b, 0) / lengths.length,
            min_length: Math.min(...lengths),
            max_length: Math.max(...lengths),
            total_bases: lengths.reduce((a, b) => a + b, 0)
        };

        // Basic composition analysis
        results.composition_analysis = this.analyzeSequenceComposition(sequences);

        // Basic quality assessment
        results.quality_assessment = this.assessSequenceQuality(sequences);

        return results;
    }

    analyzeSequenceComposition(sequences) {
        const composition = { A: 0, T: 0, G: 0, C: 0, N: 0, other: 0 };
        let totalBases = 0;

        sequences.forEach(seq => {
            const upperSeq = seq.toUpperCase();
            for (const base of upperSeq) {
                if (composition.hasOwnProperty(base)) {
                    composition[base]++;
                } else {
                    composition.other++;
                }
                totalBases++;
            }
        });

        // Convert to percentages
        const percentages = {};
        for (const [base, count] of Object.entries(composition)) {
            percentages[base] = totalBases > 0 ? (count / totalBases) * 100 : 0;
        }

        return {
            counts: composition,
            percentages: percentages,
            gc_content: (percentages.G + percentages.C),
            at_content: (percentages.A + percentages.T)
        };
    }

    assessSequenceQuality(sequences) {
        const qualities = sequences.map(seq => this.calculateSequenceQuality(seq));

        return {
            average_quality: qualities.reduce((a, b) => a + b, 0) / qualities.length,
            quality_distribution: this.categorizeQualities(qualities),
            low_quality_sequences: qualities.filter(q => q < 0.5).length,
            high_quality_sequences: qualities.filter(q => q >= 0.8).length
        };
    }

    calculateSequenceQuality(sequence) {
        if (!sequence || sequence.length === 0) return 0;

        const upperSeq = sequence.toUpperCase();
        const validBases = (upperSeq.match(/[ATGC]/g) || []).length;
        const ambiguousBases = (upperSeq.match(/[N]/g) || []).length;
        const invalidBases = sequence.length - validBases - ambiguousBases;

        // Quality factors
        const validityScore = validBases / sequence.length;
        const ambiguityPenalty = ambiguousBases / sequence.length;
        const lengthBonus = Math.min(sequence.length / 1000, 1); // Bonus for longer sequences

        return Math.max(0, Math.min(1,
            validityScore * 0.7 +
            (1 - ambiguityPenalty) * 0.2 +
            lengthBonus * 0.1
        ));
    }

    categorizeQualities(qualities) {
        return {
            excellent: qualities.filter(q => q >= 0.9).length,
            good: qualities.filter(q => q >= 0.7 && q < 0.9).length,
            fair: qualities.filter(q => q >= 0.5 && q < 0.7).length,
            poor: qualities.filter(q => q < 0.5).length
        };
    }

    // Utility methods
    async createTempFile(data, prefix = 'temp') {
        const tempPath = path.join(this.tempPath, `${prefix}_${Date.now()}.json`);
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
        return tempPath;
    }

    async cleanupTempFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn('Failed to cleanup temp file:', error);
        }
    }

    getAnalysisStatus(analysisId) {
        // This would track analysis status in a real implementation
        return {
            analysis_id: analysisId,
            status: 'completed',
            progress: 100,
            timestamp: new Date().toISOString()
        };
    }

    getSupportedParameters() {
        return {
            kmer_size: { min: 2, max: 8, default: 4 },
            clustering_method: ['kmeans', 'hierarchical', 'dbscan'],
            max_clusters: { min: 2, max: 20, default: 10 },
            analysis_type: ['comprehensive', 'diversity_only', 'taxonomy_only', 'clustering_only']
        };
    }
}

module.exports = new MicroBiomeAnalyzer();