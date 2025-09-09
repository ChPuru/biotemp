const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
// const { verifyToken } = require('../middleware/auth'); // Disabled for demo

// Cost Analysis and Computational Feasibility Service
class CostAnalysisService {
    constructor() {
        this.reportsPath = path.join(__dirname, '../reports/cost_analysis');
        this.initializeReportsDirectory();
        
        // Cost models for different analysis types
        this.costModels = {
            sequencing: {
                'illumina_miseq': {
                    name: 'Illumina MiSeq',
                    cost_per_million_reads: 45,
                    max_reads_per_run: 25000000,
                    turnaround_days: 3,
                    best_for: ['amplicon', 'small_genome', 'targeted']
                },
                'illumina_hiseq': {
                    name: 'Illumina HiSeq',
                    cost_per_million_reads: 25,
                    max_reads_per_run: 400000000,
                    turnaround_days: 7,
                    best_for: ['whole_genome', 'metagenome', 'large_scale']
                },
                'illumina_novaseq': {
                    name: 'Illumina NovaSeq',
                    cost_per_million_reads: 15,
                    max_reads_per_run: 6000000000,
                    turnaround_days: 5,
                    best_for: ['population_genomics', 'clinical', 'high_throughput']
                },
                'oxford_nanopore': {
                    name: 'Oxford Nanopore',
                    cost_per_million_reads: 85,
                    max_reads_per_run: 50000000,
                    turnaround_days: 2,
                    best_for: ['long_reads', 'structural_variants', 'real_time']
                },
                'pacbio_sequel': {
                    name: 'PacBio Sequel',
                    cost_per_million_reads: 120,
                    max_reads_per_run: 8000000,
                    turnaround_days: 4,
                    best_for: ['long_reads', 'methylation', 'isoforms']
                }
            },
            compute: {
                'local_workstation': {
                    name: 'Local Workstation',
                    cpu_cost_per_hour: 0.5,
                    memory_gb: 64,
                    storage_tb: 2,
                    gpu_available: false,
                    best_for: ['small_datasets', 'development', 'testing']
                },
                'hpc_cluster': {
                    name: 'HPC Cluster',
                    cpu_cost_per_hour: 2.5,
                    memory_gb: 256,
                    storage_tb: 100,
                    gpu_available: true,
                    best_for: ['large_datasets', 'parallel_processing', 'research']
                },
                'aws_ec2': {
                    name: 'AWS EC2',
                    cpu_cost_per_hour: 1.8,
                    memory_gb: 128,
                    storage_tb: 10,
                    gpu_available: true,
                    best_for: ['scalable', 'on_demand', 'cloud_native']
                },
                'google_cloud': {
                    name: 'Google Cloud',
                    cpu_cost_per_hour: 1.6,
                    memory_gb: 128,
                    storage_tb: 10,
                    gpu_available: true,
                    best_for: ['ml_workflows', 'preemptible', 'cost_effective']
                },
                'azure': {
                    name: 'Microsoft Azure',
                    cpu_cost_per_hour: 1.9,
                    memory_gb: 128,
                    storage_tb: 10,
                    gpu_available: true,
                    best_for: ['enterprise', 'hybrid_cloud', 'integration']
                }
            },
            storage: {
                'local_storage': {
                    name: 'Local Storage',
                    cost_per_tb_per_month: 25,
                    access_speed: 'fast',
                    redundancy: 'none',
                    best_for: ['temporary', 'processing', 'development']
                },
                'aws_s3': {
                    name: 'AWS S3',
                    cost_per_tb_per_month: 23,
                    access_speed: 'medium',
                    redundancy: 'high',
                    best_for: ['long_term', 'backup', 'sharing']
                },
                'google_cloud_storage': {
                    name: 'Google Cloud Storage',
                    cost_per_tb_per_month: 20,
                    access_speed: 'medium',
                    redundancy: 'high',
                    best_for: ['analytics', 'ml_datasets', 'archival']
                },
                'azure_blob': {
                    name: 'Azure Blob Storage',
                    cost_per_tb_per_month: 22,
                    access_speed: 'medium',
                    redundancy: 'high',
                    best_for: ['enterprise', 'backup', 'cdn']
                }
            },
            personnel: {
                'bioinformatician': {
                    hourly_rate: 75,
                    expertise: ['pipeline_development', 'data_analysis', 'interpretation'],
                    typical_hours_per_project: 120
                },
                'field_researcher': {
                    hourly_rate: 45,
                    expertise: ['sample_collection', 'field_protocols', 'logistics'],
                    typical_hours_per_project: 80
                },
                'lab_technician': {
                    hourly_rate: 35,
                    expertise: ['sample_prep', 'library_prep', 'qc'],
                    typical_hours_per_project: 60
                },
                'data_scientist': {
                    hourly_rate: 85,
                    expertise: ['machine_learning', 'statistics', 'visualization'],
                    typical_hours_per_project: 100
                }
            }
        };

        // Computational complexity models
        this.complexityModels = {
            'qiime2_amplicon': {
                cpu_hours_per_million_reads: 2.5,
                memory_gb_required: 16,
                storage_gb_per_million_reads: 5,
                parallelizable: true
            },
            'blast_search': {
                cpu_hours_per_million_reads: 8.0,
                memory_gb_required: 32,
                storage_gb_per_million_reads: 2,
                parallelizable: true
            },
            'bionemo_inference': {
                cpu_hours_per_million_reads: 0.5,
                memory_gb_required: 64,
                storage_gb_per_million_reads: 1,
                parallelizable: true,
                gpu_required: true
            },
            'phylogenetic_analysis': {
                cpu_hours_per_million_reads: 15.0,
                memory_gb_required: 128,
                storage_gb_per_million_reads: 3,
                parallelizable: false
            },
            'metagenome_assembly': {
                cpu_hours_per_million_reads: 12.0,
                memory_gb_required: 256,
                storage_gb_per_million_reads: 20,
                parallelizable: true
            }
        };
    }

    async initializeReportsDirectory() {
        try {
            await fs.mkdir(this.reportsPath, { recursive: true });
        } catch (error) {
            console.error('Cost analysis reports directory initialization error:', error);
        }
    }

    async estimateProjectCost(params) {
        const {
            sample_count = 50,
            reads_per_sample = 100000,
            sequencing_platform = 'illumina_miseq',
            compute_platform = 'aws_ec2',
            storage_platform = 'aws_s3',
            analysis_types = ['qiime2_amplicon'],
            project_duration_months = 6,
            team_composition = ['bioinformatician', 'field_researcher'],
            include_overhead = true
        } = params;

        const totalReads = sample_count * reads_per_sample;
        const totalReadsMillions = totalReads / 1000000;

        // Calculate sequencing costs
        const sequencingCost = this.calculateSequencingCost(totalReadsMillions, sequencing_platform);
        
        // Calculate compute costs
        const computeCost = this.calculateComputeCost(totalReadsMillions, analysis_types, compute_platform);
        
        // Calculate storage costs
        const storageCost = this.calculateStorageCost(totalReadsMillions, analysis_types, storage_platform, project_duration_months);
        
        // Calculate personnel costs
        const personnelCost = this.calculatePersonnelCost(team_composition, project_duration_months);
        
        // Calculate field work costs
        const fieldWorkCost = this.calculateFieldWorkCost(sample_count);
        
        const subtotal = sequencingCost + computeCost + storageCost + personnelCost + fieldWorkCost;
        const overhead = include_overhead ? subtotal * 0.25 : 0; // 25% overhead
        const total = subtotal + overhead;

        return {
            project_parameters: params,
            cost_breakdown: {
                sequencing: Math.round(sequencingCost),
                compute: Math.round(computeCost),
                storage: Math.round(storageCost),
                personnel: Math.round(personnelCost),
                field_work: Math.round(fieldWorkCost),
                overhead: Math.round(overhead),
                subtotal: Math.round(subtotal),
                total: Math.round(total)
            },
            cost_per_sample: Math.round(total / sample_count),
            recommendations: this.generateCostRecommendations(params, total),
            alternatives: this.generateAlternatives(params),
            timestamp: new Date().toISOString()
        };
    }

    calculateSequencingCost(totalReadsMillions, platform) {
        const platformConfig = this.costModels.sequencing[platform];
        if (!platformConfig) return 0;
        
        const runsNeeded = Math.ceil(totalReadsMillions / (platformConfig.max_reads_per_run / 1000000));
        const costPerRun = (platformConfig.max_reads_per_run / 1000000) * platformConfig.cost_per_million_reads;
        
        return runsNeeded * costPerRun;
    }

    calculateComputeCost(totalReadsMillions, analysisTypes, platform) {
        const platformConfig = this.costModels.compute[platform];
        if (!platformConfig) return 0;
        
        let totalCpuHours = 0;
        
        analysisTypes.forEach(analysisType => {
            const complexity = this.complexityModels[analysisType];
            if (complexity) {
                totalCpuHours += complexity.cpu_hours_per_million_reads * totalReadsMillions;
            }
        });
        
        return totalCpuHours * platformConfig.cpu_cost_per_hour;
    }

    calculateStorageCost(totalReadsMillions, analysisTypes, platform, durationMonths) {
        const platformConfig = this.costModels.storage[platform];
        if (!platformConfig) return 0;
        
        let totalStorageGb = 0;
        
        analysisTypes.forEach(analysisType => {
            const complexity = this.complexityModels[analysisType];
            if (complexity) {
                totalStorageGb += complexity.storage_gb_per_million_reads * totalReadsMillions;
            }
        });
        
        const storageTb = totalStorageGb / 1000;
        return storageTb * platformConfig.cost_per_tb_per_month * durationMonths;
    }

    calculatePersonnelCost(teamComposition, durationMonths) {
        let totalCost = 0;
        
        teamComposition.forEach(role => {
            const roleConfig = this.costModels.personnel[role];
            if (roleConfig) {
                const monthlyHours = roleConfig.typical_hours_per_project / 6; // Assume 6-month baseline
                const adjustedHours = monthlyHours * durationMonths;
                totalCost += adjustedHours * roleConfig.hourly_rate;
            }
        });
        
        return totalCost;
    }

    calculateFieldWorkCost(sampleCount) {
        // Base field work cost model
        const baseCostPerSample = 150; // Travel, equipment, time
        const fixedCosts = 2000; // Equipment, permits, logistics
        
        return fixedCosts + (sampleCount * baseCostPerSample);
    }

    generateCostRecommendations(params, totalCost) {
        const recommendations = [];
        const costPerSample = totalCost / params.sample_count;
        
        if (costPerSample > 2000) {
            recommendations.push('Consider reducing sample size or using pooled sampling strategies');
        }
        
        if (params.sequencing_platform === 'illumina_novaseq' && params.sample_count < 100) {
            recommendations.push('MiSeq may be more cost-effective for smaller sample sizes');
        }
        
        if (params.analysis_types.includes('phylogenetic_analysis')) {
            recommendations.push('Phylogenetic analysis is computationally expensive - consider cloud bursting');
        }
        
        if (params.compute_platform === 'local_workstation' && totalCost > 50000) {
            recommendations.push('Cloud computing may be more cost-effective for large projects');
        }
        
        recommendations.push('Consider applying for computational grants or using preemptible instances');
        
        return recommendations;
    }

    generateAlternatives(params) {
        const alternatives = [];
        
        // Lower cost sequencing alternative
        if (params.sequencing_platform !== 'illumina_miseq') {
            alternatives.push({
                name: 'Cost-optimized sequencing',
                changes: { sequencing_platform: 'illumina_miseq' },
                estimated_savings: '20-30%',
                trade_offs: 'Lower throughput, may require more runs'
            });
        }
        
        // Cloud computing alternative
        if (params.compute_platform === 'local_workstation') {
            alternatives.push({
                name: 'Cloud computing',
                changes: { compute_platform: 'google_cloud' },
                estimated_savings: '15-25%',
                trade_offs: 'Data transfer costs, learning curve'
            });
        }
        
        // Reduced analysis scope
        if (params.analysis_types.length > 2) {
            alternatives.push({
                name: 'Focused analysis',
                changes: { analysis_types: params.analysis_types.slice(0, 2) },
                estimated_savings: '30-40%',
                trade_offs: 'Less comprehensive results'
            });
        }
        
        return alternatives;
    }

    async assessComputationalFeasibility(params) {
        const {
            sample_count = 50,
            reads_per_sample = 100000,
            analysis_types = ['qiime2_amplicon'],
            available_resources = {
                cpu_cores: 8,
                memory_gb: 32,
                storage_tb: 1,
                gpu_available: false
            },
            deadline_days = 30
        } = params;

        const totalReads = sample_count * reads_per_sample;
        const totalReadsMillions = totalReads / 1000000;

        const requirements = this.calculateResourceRequirements(totalReadsMillions, analysis_types);
        const feasibility = this.assessFeasibility(requirements, available_resources, deadline_days);
        
        return {
            project_parameters: params,
            resource_requirements: requirements,
            available_resources: available_resources,
            feasibility_assessment: feasibility,
            recommendations: this.generateFeasibilityRecommendations(requirements, available_resources, feasibility),
            timestamp: new Date().toISOString()
        };
    }

    calculateResourceRequirements(totalReadsMillions, analysisTypes) {
        let totalCpuHours = 0;
        let maxMemoryGb = 0;
        let totalStorageGb = 0;
        let gpuRequired = false;

        analysisTypes.forEach(analysisType => {
            const complexity = this.complexityModels[analysisType];
            if (complexity) {
                totalCpuHours += complexity.cpu_hours_per_million_reads * totalReadsMillions;
                maxMemoryGb = Math.max(maxMemoryGb, complexity.memory_gb_required);
                totalStorageGb += complexity.storage_gb_per_million_reads * totalReadsMillions;
                if (complexity.gpu_required) gpuRequired = true;
            }
        });

        return {
            cpu_hours: Math.round(totalCpuHours),
            memory_gb: maxMemoryGb,
            storage_gb: Math.round(totalStorageGb),
            gpu_required: gpuRequired,
            estimated_runtime_days: Math.ceil(totalCpuHours / 24) // Assuming single-threaded
        };
    }

    assessFeasibility(requirements, available, deadlineDays) {
        const memoryFeasible = available.memory_gb >= requirements.memory_gb;
        const storageFeasible = (available.storage_tb * 1000) >= requirements.storage_gb;
        const gpuFeasible = !requirements.gpu_required || available.gpu_available;
        const timeFeasible = requirements.estimated_runtime_days <= deadlineDays;

        const overallFeasible = memoryFeasible && storageFeasible && gpuFeasible && timeFeasible;

        return {
            overall_feasible: overallFeasible,
            memory_feasible: memoryFeasible,
            storage_feasible: storageFeasible,
            gpu_feasible: gpuFeasible,
            time_feasible: timeFeasible,
            bottlenecks: this.identifyBottlenecks(requirements, available, deadlineDays),
            confidence: this.calculateConfidence(requirements, available)
        };
    }

    identifyBottlenecks(requirements, available, deadlineDays) {
        const bottlenecks = [];

        if (available.memory_gb < requirements.memory_gb) {
            bottlenecks.push({
                type: 'memory',
                required: requirements.memory_gb,
                available: available.memory_gb,
                severity: 'high'
            });
        }

        if ((available.storage_tb * 1000) < requirements.storage_gb) {
            bottlenecks.push({
                type: 'storage',
                required: requirements.storage_gb,
                available: available.storage_tb * 1000,
                severity: 'medium'
            });
        }

        if (requirements.gpu_required && !available.gpu_available) {
            bottlenecks.push({
                type: 'gpu',
                required: 'GPU acceleration',
                available: 'CPU only',
                severity: 'high'
            });
        }

        if (requirements.estimated_runtime_days > deadlineDays) {
            bottlenecks.push({
                type: 'time',
                required: requirements.estimated_runtime_days,
                available: deadlineDays,
                severity: 'high'
            });
        }

        return bottlenecks;
    }

    calculateConfidence(requirements, available) {
        let score = 100;

        // Memory confidence
        const memoryRatio = available.memory_gb / requirements.memory_gb;
        if (memoryRatio < 1) score -= 30;
        else if (memoryRatio < 1.5) score -= 10;

        // Storage confidence
        const storageRatio = (available.storage_tb * 1000) / requirements.storage_gb;
        if (storageRatio < 1) score -= 20;
        else if (storageRatio < 2) score -= 5;

        // GPU confidence
        if (requirements.gpu_required && !available.gpu_available) score -= 25;

        return Math.max(0, score);
    }

    generateFeasibilityRecommendations(requirements, available, feasibility) {
        const recommendations = [];

        if (!feasibility.memory_feasible) {
            recommendations.push(`Increase memory to at least ${requirements.memory_gb}GB`);
            recommendations.push('Consider cloud instances with high memory configurations');
        }

        if (!feasibility.storage_feasible) {
            recommendations.push(`Add ${Math.ceil(requirements.storage_gb / 1000)}TB of storage capacity`);
            recommendations.push('Consider cloud storage for temporary data');
        }

        if (!feasibility.gpu_feasible) {
            recommendations.push('Add GPU acceleration for BioNeMo workflows');
            recommendations.push('Consider cloud GPU instances (AWS P3, Google Cloud GPU)');
        }

        if (!feasibility.time_feasible) {
            recommendations.push('Increase parallel processing capabilities');
            recommendations.push('Consider distributed computing or cloud bursting');
            recommendations.push('Optimize analysis pipeline for efficiency');
        }

        if (feasibility.overall_feasible) {
            recommendations.push('Project is computationally feasible with current resources');
            recommendations.push('Monitor resource usage during execution');
        }

        return recommendations;
    }

    async generateDatasetRegistry() {
        return {
            reference_databases: {
                'silva_138': {
                    name: 'SILVA 138 SSU/LSU',
                    type: '16S/18S rRNA',
                    size_gb: 45,
                    sequences: 510000,
                    last_updated: '2020-12',
                    download_url: 'https://www.arb-silva.de/download/',
                    cost: 'Free',
                    license: 'CC BY 4.0'
                },
                'greengenes_13_8': {
                    name: 'Greengenes 13_8',
                    type: '16S rRNA',
                    size_gb: 12,
                    sequences: 203000,
                    last_updated: '2013-08',
                    download_url: 'https://greengenes.secondgenome.com/',
                    cost: 'Free',
                    license: 'BSD'
                },
                'unite_8_3': {
                    name: 'UNITE 8.3',
                    type: 'ITS fungi',
                    size_gb: 8,
                    sequences: 56000,
                    last_updated: '2021-05',
                    download_url: 'https://unite.ut.ee/',
                    cost: 'Free',
                    license: 'CC BY-SA 4.0'
                },
                'ncbi_nt': {
                    name: 'NCBI Nucleotide',
                    type: 'All nucleotide sequences',
                    size_gb: 450,
                    sequences: 250000000,
                    last_updated: 'Weekly',
                    download_url: 'https://ftp.ncbi.nlm.nih.gov/blast/db/',
                    cost: 'Free',
                    license: 'Public Domain'
                },
                'bold_public': {
                    name: 'BOLD Public Data',
                    type: 'COI barcodes',
                    size_gb: 25,
                    sequences: 8500000,
                    last_updated: 'Monthly',
                    download_url: 'http://www.boldsystems.org/',
                    cost: 'Free',
                    license: 'CC BY 3.0'
                }
            },
            computational_resources: {
                'local_blast_db': {
                    name: 'Local BLAST Database',
                    storage_required_gb: 500,
                    memory_required_gb: 64,
                    setup_time_hours: 8,
                    maintenance_hours_per_month: 4
                },
                'qiime2_environment': {
                    name: 'QIIME2 Conda Environment',
                    storage_required_gb: 15,
                    memory_required_gb: 16,
                    setup_time_hours: 2,
                    maintenance_hours_per_month: 1
                },
                'bionemo_models': {
                    name: 'BioNeMo Model Cache',
                    storage_required_gb: 100,
                    memory_required_gb: 32,
                    gpu_memory_required_gb: 16,
                    setup_time_hours: 4,
                    maintenance_hours_per_month: 2
                }
            },
            cloud_resources: {
                'aws_genomics': {
                    name: 'AWS Genomics Workflows',
                    cost_per_sample: '$15-50',
                    setup_complexity: 'Medium',
                    scalability: 'High',
                    best_for: 'Large-scale projects'
                },
                'google_cloud_life_sciences': {
                    name: 'Google Cloud Life Sciences',
                    cost_per_sample: '$12-45',
                    setup_complexity: 'Low',
                    scalability: 'High',
                    best_for: 'ML-integrated workflows'
                },
                'azure_genomics': {
                    name: 'Microsoft Genomics',
                    cost_per_sample: '$18-55',
                    setup_complexity: 'Medium',
                    scalability: 'Medium',
                    best_for: 'Enterprise integration'
                }
            }
        };
    }
}

// Initialize cost analysis service
const costAnalysisService = new CostAnalysisService();

// Routes
router.post('/estimate', async (req, res) => {
    try {
        const estimate = await costAnalysisService.estimateProjectCost(req.body);
        res.json(estimate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/feasibility', async (req, res) => {
    try {
        const assessment = await costAnalysisService.assessComputationalFeasibility(req.body);
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/models', async (req, res) => {
    try {
        res.json({
            cost_models: costAnalysisService.costModels,
            complexity_models: costAnalysisService.complexityModels
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/datasets', async (req, res) => {
    try {
        const registry = await costAnalysisService.generateDatasetRegistry();
        res.json(registry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
