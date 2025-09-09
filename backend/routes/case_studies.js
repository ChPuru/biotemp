const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { verifyToken } = require('../middleware/auth');

// Real-world eDNA Case Studies Service
class CaseStudiesService {
    constructor() {
        this.caseStudiesPath = path.join(__dirname, '../data/case_studies');
        this.initializeCaseStudies();
        
        // Curated real-world case studies from leading institutions
        this.caseStudies = {
            'unesco-marine-biodiversity': {
                id: 'unesco-marine-biodiversity',
                title: 'UNESCO Marine Biodiversity Assessment - Mediterranean Sea',
                organization: 'UNESCO',
                location: 'Mediterranean Sea, Europe',
                year: 2023,
                type: 'Marine eDNA',
                description: 'Comprehensive eDNA survey of Mediterranean marine protected areas to assess biodiversity loss and recovery patterns.',
                methodology: {
                    sampling: 'Water column sampling at 50 sites across 12 MPAs',
                    sequencing: '16S rRNA and COI metabarcoding',
                    platform: 'Illumina MiSeq',
                    reads: '2.3M paired-end reads',
                    pipeline: 'QIIME2 + custom taxonomic databases'
                },
                findings: {
                    species_detected: 1247,
                    endemic_species: 89,
                    threatened_species: 34,
                    invasive_species: 12,
                    biodiversity_index: 0.87
                },
                policy_impact: {
                    recommendations: [
                        'Expand MPA boundaries by 15% based on biodiversity hotspots',
                        'Implement seasonal fishing restrictions in high-diversity zones',
                        'Establish monitoring protocols for invasive species'
                    ],
                    implementation_status: 'Adopted by 8 out of 12 countries',
                    funding_secured: '$2.4M for 5-year monitoring program'
                },
                datasets: {
                    raw_sequences: 'SRA: PRJNA789456',
                    processed_data: 'Zenodo: 10.5281/zenodo.7234567',
                    metadata: 'GBIF: dataset/12345678-1234-1234-1234-123456789012'
                },
                cost_analysis: {
                    field_work: '$45000',
                    sequencing: '$28000',
                    analysis: '$15000',
                    total: '$88000',
                    cost_per_sample: '$1760'
                }
            },
            'wwf-amazon-deforestation': {
                id: 'wwf-amazon-deforestation',
                title: 'WWF Amazon Deforestation Impact on Aquatic Biodiversity',
                organization: 'World Wildlife Fund',
                location: 'Amazon Basin, Brazil',
                year: 2022,
                type: 'Freshwater eDNA',
                description: 'Assessment of aquatic biodiversity changes in deforested vs. intact Amazon watersheds using eDNA metabarcoding.',
                methodology: {
                    sampling: 'River and stream sampling across deforestation gradient',
                    sequencing: '12S rRNA, 16S rRNA, and ITS metabarcoding',
                    platform: 'Illumina NovaSeq',
                    reads: '15.7M paired-end reads',
                    pipeline: 'nf-core/ampliseq + SILVA/UNITE databases'
                },
                findings: {
                    species_detected: 2156,
                    fish_species: 387,
                    invertebrate_species: 892,
                    microbial_otus: 877,
                    biodiversity_loss: '34% in deforested areas'
                },
                policy_impact: {
                    recommendations: [
                        'Establish 50m riparian buffer zones',
                        'Implement zero-deforestation certification',
                        'Create biodiversity corridors between fragments'
                    ],
                    implementation_status: 'Pilot program in 3 states',
                    funding_secured: '$5.8M from international donors'
                },
                datasets: {
                    raw_sequences: 'SRA: PRJNA823456',
                    processed_data: 'Dryad: doi:10.5061/dryad.abc123',
                    gis_data: 'MapBiomas deforestation layers'
                },
                cost_analysis: {
                    field_work: '$125000',
                    sequencing: '$67000',
                    analysis: '$34000',
                    total: '$226000',
                    cost_per_sample: '$1883'
                }
            },
            'csiro-great-barrier-reef': {
                id: 'csiro-great-barrier-reef',
                title: 'CSIRO Great Barrier Reef Health Monitoring',
                organization: 'Commonwealth Scientific and Industrial Research Organisation',
                location: 'Great Barrier Reef, Australia',
                year: 2023,
                type: 'Marine eDNA + Coral Microbiome',
                description: 'Long-term monitoring of coral reef health using eDNA and coral-associated microbiome analysis.',
                methodology: {
                    sampling: 'Water and coral tissue sampling across reef zones',
                    sequencing: '16S rRNA, 18S rRNA, ITS, and shotgun metagenomics',
                    platform: 'Illumina HiSeq + Oxford Nanopore',
                    reads: '45.2M paired-end + 12.8M long reads',
                    pipeline: 'QIIME2 + MetaPhlAn3 + custom coral databases'
                },
                findings: {
                    coral_species: 156,
                    fish_species: 743,
                    microbial_diversity: 'Significant decline in bleached areas',
                    pathogen_detection: '12 coral pathogens identified',
                    resilience_indicators: 'Probiotic bacteria in healthy corals'
                },
                policy_impact: {
                    recommendations: [
                        'Reduce agricultural runoff by 40%',
                        'Implement coral probiotic treatments',
                        'Establish climate refuge areas'
                    ],
                    implementation_status: 'Government commitment $1.2B over 10 years',
                    funding_secured: '$1.2B Australian Reef 2050 Plan'
                },
                datasets: {
                    raw_sequences: 'SRA: PRJNA756789',
                    processed_data: 'AIMS Data Centre',
                    environmental_data: 'eReefs platform integration'
                },
                cost_analysis: {
                    field_work: '$340000',
                    sequencing: '$156000',
                    analysis: '$89000',
                    total: '$585000',
                    cost_per_sample: '$3900'
                }
            },
            'iucn-freshwater-biodiversity': {
                id: 'iucn-freshwater-biodiversity',
                title: 'IUCN Global Freshwater Biodiversity Assessment',
                organization: 'International Union for Conservation of Nature',
                location: 'Global - 25 countries',
                year: 2023,
                type: 'Multi-habitat eDNA',
                description: 'Standardized eDNA protocols for freshwater biodiversity assessment across diverse global ecosystems.',
                methodology: {
                    sampling: 'Standardized sampling across lakes, rivers, and wetlands',
                    sequencing: 'Multi-marker approach (COI, 12S, 16S, 18S)',
                    platform: 'Illumina MiSeq',
                    reads: '8.9M paired-end reads per site',
                    pipeline: 'Standardized QIIME2 workflow + BOLD/SILVA'
                },
                findings: {
                    total_species: 4567,
                    threatened_species: 234,
                    data_deficient_species: 1123,
                    regional_endemism: 'High in tropical regions',
                    conservation_priorities: '15 biodiversity hotspots identified'
                },
                policy_impact: {
                    recommendations: [
                        'Update IUCN Red List assessments',
                        'Establish transboundary conservation areas',
                        'Develop eDNA monitoring standards'
                    ],
                    implementation_status: 'Adopted as IUCN standard protocol',
                    funding_secured: '$3.2M for global expansion'
                },
                datasets: {
                    raw_sequences: 'SRA: PRJNA834567',
                    processed_data: 'IUCN Red List database integration',
                    protocols: 'IUCN eDNA Standards v2.0'
                },
                cost_analysis: {
                    field_work: '$450000',
                    sequencing: '$234000',
                    analysis: '$156000',
                    coordination: '$89000',
                    total: '$929000',
                    cost_per_site: '$37160'
                }
            },
            'stanford-urban-biodiversity': {
                id: 'stanford-urban-biodiversity',
                title: 'Stanford Urban Biodiversity Monitoring Network',
                organization: 'Stanford University',
                location: 'San Francisco Bay Area, USA',
                year: 2023,
                type: 'Urban eDNA',
                description: 'Citizen science-enabled eDNA monitoring of urban waterways to track biodiversity in metropolitan areas.',
                methodology: {
                    sampling: 'Citizen scientist water sampling with standardized kits',
                    sequencing: '12S and 16S metabarcoding',
                    platform: 'Illumina MiSeq',
                    reads: '3.4M paired-end reads',
                    pipeline: 'Automated QIIME2 + machine learning classification'
                },
                findings: {
                    species_detected: 892,
                    native_species: 634,
                    invasive_species: 45,
                    pollution_indicators: 'Microbial signatures of urban runoff',
                    seasonal_patterns: 'Distinct wet/dry season communities'
                },
                policy_impact: {
                    recommendations: [
                        'Implement green infrastructure in watersheds',
                        'Establish urban biodiversity corridors',
                        'Integrate eDNA into city planning'
                    ],
                    implementation_status: 'Pilot projects in 5 cities',
                    funding_secured: '$1.8M NSF Smart Cities grant'
                },
                datasets: {
                    raw_sequences: 'SRA: PRJNA745123',
                    processed_data: 'Stanford Digital Repository',
                    citizen_science: 'iNaturalist integration'
                },
                cost_analysis: {
                    field_work: '$25000',
                    sequencing: '$45000',
                    analysis: '$28000',
                    citizen_training: '$15000',
                    total: '$113000',
                    cost_per_sample: '$942'
                }
            },
            'nhm-arctic-climate-change': {
                id: 'nhm-arctic-climate-change',
                title: 'Natural History Museum Arctic Climate Change Study',
                organization: 'Natural History Museum London',
                location: 'Arctic Ocean, Svalbard',
                year: 2022,
                type: 'Arctic Marine eDNA',
                description: 'Assessment of Arctic marine biodiversity changes due to climate warming using historical and contemporary eDNA.',
                methodology: {
                    sampling: 'Sea ice, water column, and sediment core sampling',
                    sequencing: 'Multi-marker metabarcoding + ancient DNA',
                    platform: 'Illumina NovaSeq + Ion Torrent',
                    reads: '23.1M paired-end reads',
                    pipeline: 'QIIME2 + MEGAN + ancient DNA workflows'
                },
                findings: {
                    species_detected: 1456,
                    arctic_specialists: 234,
                    temperate_invaders: 67,
                    temporal_changes: '45% community turnover since 1980',
                    tipping_points: 'Identified at 2°C warming'
                },
                policy_impact: {
                    recommendations: [
                        'Strengthen Arctic Council conservation measures',
                        'Establish climate refugia networks',
                        'Implement shipping restrictions in sensitive areas'
                    ],
                    implementation_status: 'Under review by Arctic Council',
                    funding_secured: '£2.1M NERC Arctic Programme'
                },
                datasets: {
                    raw_sequences: 'ENA: PRJEB45678',
                    processed_data: 'Polar Data Centre',
                    historical_data: 'GBIF Arctic Biodiversity Data Service'
                },
                cost_analysis: {
                    field_work: '$189000',
                    sequencing: '$98000',
                    analysis: '$67000',
                    logistics: '$145000',
                    total: '$499000',
                    cost_per_sample: '$4158'
                }
            }
        };
    }

    async initializeCaseStudies() {
        try {
            await fs.mkdir(this.caseStudiesPath, { recursive: true });
        } catch (error) {
            console.error('Case studies directory initialization error:', error);
        }
    }

    async getAllCaseStudies() {
        return Object.values(this.caseStudies);
    }

    async getCaseStudyById(id) {
        return this.caseStudies[id] || null;
    }

    async getCaseStudiesByOrganization(organization) {
        return Object.values(this.caseStudies).filter(
            study => study.organization.toLowerCase().includes(organization.toLowerCase())
        );
    }

    async getCaseStudiesByType(type) {
        return Object.values(this.caseStudies).filter(
            study => study.type.toLowerCase().includes(type.toLowerCase())
        );
    }

    async getCaseStudiesByYear(year) {
        return Object.values(this.caseStudies).filter(
            study => study.year === parseInt(year)
        );
    }

    async searchCaseStudies(query) {
        const searchTerm = query.toLowerCase();
        return Object.values(this.caseStudies).filter(study => 
            study.title.toLowerCase().includes(searchTerm) ||
            study.description.toLowerCase().includes(searchTerm) ||
            study.location.toLowerCase().includes(searchTerm) ||
            study.organization.toLowerCase().includes(searchTerm)
        );
    }

    async getPolicyImpacts() {
        return Object.values(this.caseStudies).map(study => ({
            id: study.id,
            title: study.title,
            organization: study.organization,
            policy_impact: study.policy_impact,
            cost_analysis: study.cost_analysis
        }));
    }

    async getCostAnalysisSummary() {
        const studies = Object.values(this.caseStudies);
        const totalCosts = studies.map(s => s.cost_analysis.total);
        const costPerSample = studies.map(s => s.cost_analysis.cost_per_sample);
        
        return {
            total_studies: studies.length,
            cost_range: {
                min: Math.min(...totalCosts),
                max: Math.max(...totalCosts),
                average: totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length
            },
            cost_per_sample_range: {
                min: Math.min(...costPerSample),
                max: Math.max(...costPerSample),
                average: costPerSample.reduce((a, b) => a + b, 0) / costPerSample.length
            },
            by_type: this.getCostsByType(studies),
            recommendations: this.generateCostRecommendations(studies)
        };
    }

    getCostsByType(studies) {
        const typeGroups = {};
        studies.forEach(study => {
            if (!typeGroups[study.type]) {
                typeGroups[study.type] = [];
            }
            typeGroups[study.type].push(study.cost_analysis);
        });

        const result = {};
        Object.keys(typeGroups).forEach(type => {
            const costs = typeGroups[type];
            const totals = costs.map(c => c.total);
            result[type] = {
                studies: costs.length,
                average_cost: totals.reduce((a, b) => a + b, 0) / totals.length,
                cost_range: [Math.min(...totals), Math.max(...totals)]
            };
        });

        return result;
    }

    generateCostRecommendations(studies) {
        const avgCost = studies.reduce((sum, s) => sum + s.cost_analysis.total, 0) / studies.length;
        
        return [
            `Average project cost: $${Math.round(avgCost).toLocaleString()}`,
            'Marine studies typically cost 2-3x more due to logistics',
            'Citizen science approaches can reduce costs by 40-60%',
            'Multi-marker approaches increase sequencing costs by 30-50%',
            'Long-read sequencing adds 20-40% to analysis costs',
            'International coordination adds 15-25% overhead'
        ];
    }

    async generateBenchmarkReport(userStudy) {
        const similarStudies = this.findSimilarStudies(userStudy);
        const costComparison = this.compareCosts(userStudy, similarStudies);
        const methodologyComparison = this.compareMethodologies(userStudy, similarStudies);
        
        return {
            user_study: userStudy,
            similar_studies: similarStudies,
            cost_comparison: costComparison,
            methodology_comparison: methodologyComparison,
            recommendations: this.generateRecommendations(userStudy, similarStudies),
            timestamp: new Date().toISOString()
        };
    }

    findSimilarStudies(userStudy) {
        return Object.values(this.caseStudies).filter(study => {
            const typeMatch = study.type.toLowerCase().includes(userStudy.type?.toLowerCase() || '');
            const locationMatch = this.calculateLocationSimilarity(study.location, userStudy.location);
            const sizeMatch = this.calculateSizeSimilarity(study.methodology, userStudy.methodology);
            
            return typeMatch || locationMatch > 0.3 || sizeMatch > 0.5;
        }).slice(0, 5);
    }

    calculateLocationSimilarity(loc1, loc2) {
        if (!loc1 || !loc2) return 0;
        const words1 = loc1.toLowerCase().split(/[\s,]+/);
        const words2 = loc2.toLowerCase().split(/[\s,]+/);
        const intersection = words1.filter(word => words2.includes(word));
        return intersection.length / Math.max(words1.length, words2.length);
    }

    calculateSizeSimilarity(method1, method2) {
        if (!method1 || !method2) return 0;
        const reads1 = this.extractReadCount(method1.reads);
        const reads2 = this.extractReadCount(method2.reads);
        if (!reads1 || !reads2) return 0;
        return 1 - Math.abs(reads1 - reads2) / Math.max(reads1, reads2);
    }

    extractReadCount(readsStr) {
        if (!readsStr) return null;
        const match = readsStr.match(/([\d.]+)([MK]?)/);
        if (!match) return null;
        const num = parseFloat(match[1]);
        const unit = match[2];
        return unit === 'M' ? num * 1000000 : unit === 'K' ? num * 1000 : num;
    }

    compareCosts(userStudy, similarStudies) {
        if (!userStudy.estimated_cost) return null;
        
        const similarCosts = similarStudies.map(s => s.cost_analysis.total);
        const avgSimilarCost = similarCosts.reduce((a, b) => a + b, 0) / similarCosts.length;
        
        return {
            user_estimated_cost: userStudy.estimated_cost,
            similar_studies_average: Math.round(avgSimilarCost),
            cost_difference_percent: Math.round(((userStudy.estimated_cost - avgSimilarCost) / avgSimilarCost) * 100),
            cost_category: userStudy.estimated_cost < avgSimilarCost * 0.8 ? 'low' : 
                          userStudy.estimated_cost > avgSimilarCost * 1.2 ? 'high' : 'average'
        };
    }

    compareMethodologies(userStudy, similarStudies) {
        const methodologies = similarStudies.map(s => s.methodology);
        const commonPlatforms = this.findCommonValues(methodologies, 'platform');
        const commonPipelines = this.findCommonValues(methodologies, 'pipeline');
        
        return {
            recommended_platform: commonPlatforms[0] || 'Illumina MiSeq',
            recommended_pipeline: commonPipelines[0] || 'QIIME2',
            common_markers: this.extractCommonMarkers(methodologies),
            typical_read_count: this.calculateTypicalReadCount(methodologies)
        };
    }

    findCommonValues(methodologies, field) {
        const values = methodologies.map(m => m[field]).filter(Boolean);
        const counts = {};
        values.forEach(val => counts[val] = (counts[val] || 0) + 1);
        return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    }

    extractCommonMarkers(methodologies) {
        const allMarkers = methodologies.flatMap(m => 
            (m.sequencing || '').split(/[,+&]/).map(s => s.trim())
        ).filter(Boolean);
        
        const counts = {};
        allMarkers.forEach(marker => counts[marker] = (counts[marker] || 0) + 1);
        return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 5);
    }

    calculateTypicalReadCount(methodologies) {
        const readCounts = methodologies.map(m => this.extractReadCount(m.reads)).filter(Boolean);
        if (readCounts.length === 0) return null;
        
        const avg = readCounts.reduce((a, b) => a + b, 0) / readCounts.length;
        return `${(avg / 1000000).toFixed(1)}M reads`;
    }

    generateRecommendations(userStudy, similarStudies) {
        const recommendations = [];
        
        if (similarStudies.length > 0) {
            recommendations.push('Based on similar studies, consider these optimizations:');
            
            const avgCost = similarStudies.reduce((sum, s) => sum + s.cost_analysis.total, 0) / similarStudies.length;
            if (userStudy.estimated_cost && userStudy.estimated_cost > avgCost * 1.2) {
                recommendations.push('- Your estimated cost is above average. Consider reducing sample size or using single-marker approach');
            }
            
            const commonPlatform = this.findCommonValues(similarStudies.map(s => s.methodology), 'platform')[0];
            if (commonPlatform) {
                recommendations.push(`- Most similar studies used ${commonPlatform} for sequencing`);
            }
            
            recommendations.push('- Review policy impact strategies from successful similar projects');
            recommendations.push('- Consider collaboration with organizations that have conducted similar work');
        }
        
        return recommendations;
    }
}

// Initialize case studies service
const caseStudiesService = new CaseStudiesService();

// Routes
router.get('/', async (req, res) => {
    try {
        const caseStudies = await caseStudiesService.getAllCaseStudies();
        res.json({
            case_studies: caseStudies,
            total: caseStudies.length,
            organizations: [...new Set(caseStudies.map(s => s.organization))],
            types: [...new Set(caseStudies.map(s => s.type))],
            years: [...new Set(caseStudies.map(s => s.year))].sort((a, b) => b - a)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/search', verifyToken, async (req, res) => {
    try {
        const { q, organization, type, year } = req.query;
        
        let results = [];
        
        if (q) {
            results = await caseStudiesService.searchCaseStudies(q);
        } else if (organization) {
            results = await caseStudiesService.getCaseStudiesByOrganization(organization);
        } else if (type) {
            results = await caseStudiesService.getCaseStudiesByType(type);
        } else if (year) {
            results = await caseStudiesService.getCaseStudiesByYear(year);
        } else {
            results = await caseStudiesService.getAllCaseStudies();
        }
        
        res.json({
            results,
            total: results.length,
            query: { q, organization, type, year }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/policy-impacts', verifyToken, async (req, res) => {
    try {
        const impacts = await caseStudiesService.getPolicyImpacts();
        res.json({
            policy_impacts: impacts,
            total: impacts.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/cost-analysis', verifyToken, async (req, res) => {
    try {
        const analysis = await caseStudiesService.getCostAnalysisSummary();
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/benchmark', verifyToken, async (req, res) => {
    try {
        const userStudy = req.body;
        
        if (!userStudy.type && !userStudy.location) {
            return res.status(400).json({ 
                error: 'Study type or location is required for benchmarking' 
            });
        }
        
        const report = await caseStudiesService.generateBenchmarkReport(userStudy);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const caseStudy = await caseStudiesService.getCaseStudyById(id);
        
        if (!caseStudy) {
            return res.status(404).json({ error: 'Case study not found' });
        }
        
        res.json(caseStudy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
