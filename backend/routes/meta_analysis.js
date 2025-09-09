const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Advanced Meta-Analysis Engine for Cross-Study Biodiversity Intelligence
class MetaAnalysisEngine {
    constructor() {
        this.analysesPath = path.join(__dirname, '../reports/meta_analyses');
        this.activeAnalyses = new Map();
        this.initializeAnalysesDirectory();

        // Analysis methodologies
        this.methodologies = {
            'effect_size_meta_analysis': {
                name: 'Effect Size Meta-Analysis',
                description: 'Quantitative synthesis of effect sizes across studies',
                methods: ['hedges_g', 'cohen_d', 'odds_ratio'],
                applications: ['intervention_effects', 'species_responses', 'policy_impacts']
            },
            'network_meta_analysis': {
                name: 'Network Meta-Analysis',
                description: 'Comparative effectiveness across multiple interventions',
                methods: ['frequentist_nma', 'bayesian_nma'],
                applications: ['conservation_strategies', 'monitoring_methods']
            },
            'ecological_meta_regression': {
                name: 'Ecological Meta-Regression',
                description: 'Regression-based analysis of ecological moderators',
                methods: ['meta_regression', 'mixed_effects'],
                applications: ['environmental_gradients', 'species_traits']
            },
            'temporal_meta_analysis': {
                name: 'Temporal Meta-Analysis',
                description: 'Analysis of trends and temporal patterns',
                methods: ['time_series_meta', 'trend_analysis'],
                applications: ['climate_change_impacts', 'policy_effectiveness']
            },
            'spatial_meta_analysis': {
                name: 'Spatial Meta-Analysis',
                description: 'Geospatial patterns and spatial heterogeneity',
                methods: ['spatial_regression', 'geostatistics'],
                applications: ['biodiversity_hotspots', 'range_shifts']
            }
        };

        // Statistical models
        this.statisticalModels = {
            'fixed_effects': {
                name: 'Fixed Effects Model',
                description: 'Assumes single true effect size',
                assumptions: ['homogeneity', 'no_publication_bias'],
                applications: ['well-controlled_studies']
            },
            'random_effects': {
                name: 'Random Effects Model',
                description: 'Accounts for between-study heterogeneity',
                assumptions: ['normally_distributed_effects'],
                applications: ['diverse_study_populations']
            },
            'mixed_effects': {
                name: 'Mixed Effects Model',
                description: 'Combines fixed and random effects',
                assumptions: ['moderator_variables_available'],
                applications: ['complex_study_designs']
            }
        };
    }

    async initializeAnalysesDirectory() {
        try {
            await fs.mkdir(this.analysesPath, { recursive: true });
        } catch (error) {
            console.error('Meta-analyses directory initialization error:', error);
        }
    }

    async runMetaAnalysis(analysisId, params) {
        const {
            methodology,
            studies_data,
            effect_size_measure = 'hedges_g',
            statistical_model = 'random_effects',
            moderators = [],
            sensitivity_analyses = true,
            publication_bias_tests = true
        } = params;

        try {
            await this.updateAnalysisStatus(analysisId, {
                status: 'running',
                stage: 'initialization',
                methodology,
                statistical_model,
                startTime: new Date().toISOString(),
                progress: 0
            });

            // Validate inputs
            const validation = this.validateMetaAnalysisInputs(methodology, studies_data, effect_size_measure);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            await this.updateAnalysisStatus(analysisId, {
                stage: 'data_preprocessing',
                progress: 10
            });

            // Preprocess study data
            const processedData = this.preprocessStudyData(studies_data, effect_size_measure);

            await this.updateAnalysisStatus(analysisId, {
                stage: 'effect_size_calculation',
                progress: 30
            });

            // Calculate effect sizes
            const effectSizes = this.calculateEffectSizes(processedData, effect_size_measure);

            await this.updateAnalysisStatus(analysisId, {
                stage: 'statistical_modeling',
                progress: 50
            });

            // Run statistical model
            const modelResults = this.runStatisticalModel(effectSizes, statistical_model, moderators);

            await this.updateAnalysisStatus(analysisId, {
                stage: 'heterogeneity_analysis',
                progress: 70
            });

            // Analyze heterogeneity
            const heterogeneity = this.analyzeHeterogeneity(effectSizes, modelResults);

            // Publication bias analysis
            let publicationBias = null;
            if (publication_bias_tests && processedData.length >= 10) {
                publicationBias = this.analyzePublicationBias(effectSizes);
            }

            // Sensitivity analyses
            let sensitivityResults = null;
            if (sensitivity_analyses) {
                sensitivityResults = this.runSensitivityAnalyses(effectSizes, statistical_model);
            }

            await this.updateAnalysisStatus(analysisId, {
                stage: 'results_synthesis',
                progress: 90
            });

            // Synthesize results
            const synthesis = this.synthesizeResults(modelResults, heterogeneity, publicationBias, sensitivityResults);

            // Generate insights and recommendations
            const insights = this.generateMetaAnalysisInsights(synthesis, methodology, moderators);

            await this.updateAnalysisStatus(analysisId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: {
                    processed_data: processedData,
                    effect_sizes: effectSizes,
                    model_results: modelResults,
                    heterogeneity,
                    publication_bias: publicationBias,
                    sensitivity_analyses: sensitivityResults,
                    synthesis,
                    insights
                }
            });

            return {
                processed_data: processedData,
                effect_sizes: effectSizes,
                model_results: modelResults,
                heterogeneity,
                publication_bias: publicationBias,
                sensitivity_analyses: sensitivityResults,
                synthesis,
                insights
            };

        } catch (error) {
            await this.updateAnalysisStatus(analysisId, {
                status: 'failed',
                stage: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    validateMetaAnalysisInputs(methodology, studiesData, effectSizeMeasure) {
        if (!this.methodologies[methodology]) {
            return { valid: false, error: `Unknown methodology: ${methodology}` };
        }

        if (!Array.isArray(studiesData) || studiesData.length < 2) {
            return { valid: false, error: 'At least 2 studies required for meta-analysis' };
        }

        const methodConfig = this.methodologies[methodology];
        if (!methodConfig.methods.includes(effectSizeMeasure)) {
            return { valid: false, error: `Effect size measure '${effectSizeMeasure}' not supported by methodology '${methodology}'` };
        }

        // Validate study data structure
        for (let i = 0; i < studiesData.length; i++) {
            const study = studiesData[i];
            if (!study.id || !study.name) {
                return { valid: false, error: `Study ${i} missing required fields (id, name)` };
            }

            // Check for required data based on effect size measure
            if (effectSizeMeasure === 'hedges_g' || effectSizeMeasure === 'cohen_d') {
                if (!study.mean_treatment || !study.mean_control || !study.sd_treatment || !study.sd_control) {
                    return { valid: false, error: `Study ${study.id} missing required data for ${effectSizeMeasure}` };
                }
            }
        }

        return { valid: true };
    }

    preprocessStudyData(studiesData, effectSizeMeasure) {
        return studiesData.map(study => ({
            ...study,
            sample_size: study.n_treatment + (study.n_control || study.n_treatment),
            effect_size_type: effectSizeMeasure,
            processed_at: new Date().toISOString(),
            // Add study quality indicators
            quality_score: this.assessStudyQuality(study),
            risk_of_bias: this.assessRiskOfBias(study)
        }));
    }

    assessStudyQuality(study) {
        let score = 0;

        // Sample size quality
        if (study.n_treatment && study.n_control) {
            const totalN = study.n_treatment + study.n_control;
            score += Math.min(totalN / 50, 1) * 0.3; // Max 30% for sample size
        }

        // Study design quality
        if (study.randomized) score += 0.2;
        if (study.blinded) score += 0.2;
        if (study.controlled) score += 0.2;

        // Data completeness
        const requiredFields = ['mean_treatment', 'sd_treatment', 'n_treatment'];
        const presentFields = requiredFields.filter(field => study[field] !== undefined);
        score += (presentFields.length / requiredFields.length) * 0.1;

        return Math.min(score, 1.0);
    }

    assessRiskOfBias(study) {
        const risks = {
            selection_bias: study.randomized ? 'low' : 'high',
            performance_bias: study.blinded ? 'low' : 'unclear',
            detection_bias: study.blinded ? 'low' : 'unclear',
            attrition_bias: study.complete_data ? 'low' : 'high',
            reporting_bias: study.protocol_available ? 'low' : 'unclear'
        };

        return risks;
    }

    calculateEffectSizes(processedData, effectSizeMeasure) {
        const effectSizes = [];

        for (const study of processedData) {
            let effectSize, variance;

            switch (effectSizeMeasure) {
                case 'hedges_g':
                    ({ effectSize, variance } = this.calculateHedgesG(study));
                    break;
                case 'cohen_d':
                    ({ effectSize, variance } = this.calculateCohenD(study));
                    break;
                case 'odds_ratio':
                    ({ effectSize, variance } = this.calculateOddsRatio(study));
                    break;
                default:
                    throw new Error(`Unsupported effect size measure: ${effectSizeMeasure}`);
            }

            effectSizes.push({
                study_id: study.id,
                study_name: study.name,
                effect_size: effectSize,
                variance,
                standard_error: Math.sqrt(variance),
                confidence_interval: this.calculateConfidenceInterval(effectSize, variance),
                weight: 1 / variance, // Inverse variance weighting
                quality_score: study.quality_score,
                risk_of_bias: study.risk_of_bias
            });
        }

        return effectSizes;
    }

    calculateHedgesG(study) {
        const mean_diff = study.mean_treatment - study.mean_control;
        const pooled_sd = Math.sqrt(
            ((study.n_treatment - 1) * study.sd_treatment ** 2 +
             (study.n_control - 1) * study.sd_control ** 2) /
            (study.n_treatment + study.n_control - 2)
        );

        const cohens_d = mean_diff / pooled_sd;
        const n_total = study.n_treatment + study.n_control;

        // Hedges' g correction factor
        const correction_factor = 1 - (3 / (4 * n_total - 9));
        const hedges_g = cohens_d * correction_factor;

        // Variance of Hedges' g
        const variance = (study.n_treatment + study.n_control) / (study.n_treatment * study.n_control) +
                        hedges_g ** 2 / (2 * n_total);

        return { effectSize: hedges_g, variance };
    }

    calculateCohenD(study) {
        const mean_diff = study.mean_treatment - study.mean_control;
        const pooled_sd = Math.sqrt(
            ((study.n_treatment - 1) * study.sd_treatment ** 2 +
             (study.n_control - 1) * study.sd_control ** 2) /
            (study.n_treatment + study.n_control - 2)
        );

        const cohens_d = mean_diff / pooled_sd;
        const variance = (study.n_treatment + study.n_control) / (study.n_treatment * study.n_control) +
                        cohens_d ** 2 / (2 * (study.n_treatment + study.n_control));

        return { effectSize: cohens_d, variance };
    }

    calculateOddsRatio(study) {
        // Simplified odds ratio calculation
        const odds_treatment = study.events_treatment / (study.n_treatment - study.events_treatment);
        const odds_control = study.events_control / (study.n_control - study.events_control);
        const odds_ratio = odds_treatment / odds_control;

        // Log odds ratio variance
        const variance = 1/study.events_treatment + 1/(study.n_treatment - study.events_treatment) +
                        1/study.events_control + 1/(study.n_control - study.events_control);

        return { effectSize: Math.log(odds_ratio), variance };
    }

    calculateConfidenceInterval(effectSize, variance, confidence = 0.95) {
        const z_score = 1.96; // For 95% confidence
        const se = Math.sqrt(variance);
        const margin = z_score * se;

        return {
            lower: effectSize - margin,
            upper: effectSize + margin,
            confidence_level: confidence
        };
    }

    runStatisticalModel(effectSizes, modelType, moderators) {
        const modelConfig = this.statisticalModels[modelType];

        if (modelType === 'fixed_effects') {
            return this.runFixedEffectsModel(effectSizes);
        } else if (modelType === 'random_effects') {
            return this.runRandomEffectsModel(effectSizes);
        } else if (modelType === 'mixed_effects') {
            return this.runMixedEffectsModel(effectSizes, moderators);
        } else {
            throw new Error(`Unsupported statistical model: ${modelType}`);
        }
    }

    runFixedEffectsModel(effectSizes) {
        // Fixed effects model assumes single true effect size
        const weights = effectSizes.map(es => es.weight);
        const weightedSum = effectSizes.reduce((sum, es, i) => sum + es.effect_size * weights[i], 0);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        const pooledEffect = weightedSum / totalWeight;
        const pooledVariance = 1 / totalWeight;
        const pooledSE = Math.sqrt(pooledVariance);

        return {
            model_type: 'fixed_effects',
            pooled_effect_size: pooledEffect,
            pooled_variance: pooledVariance,
            pooled_standard_error: pooledSE,
            confidence_interval: this.calculateConfidenceInterval(pooledEffect, pooledVariance),
            z_score: pooledEffect / pooledSE,
            p_value: this.calculatePValue(Math.abs(pooledEffect / pooledSE)),
            total_studies: effectSizes.length,
            total_weight: totalWeight
        };
    }

    runRandomEffectsModel(effectSizes) {
        // Random effects model accounts for between-study heterogeneity
        const fixedEffects = this.runFixedEffectsModel(effectSizes);

        // Estimate between-study variance (tau-squared) using DerSimonian-Laird method
        const qStatistic = this.calculateQStatistic(effectSizes, fixedEffects.pooled_effect_size);
        const df = effectSizes.length - 1;
        const cValue = totalWeight - (weights.reduce((sum, w) => sum + w * w, 0) / totalWeight);

        let tauSquared = 0;
        if (cValue > 0) {
            tauSquared = Math.max(0, (qStatistic - df) / cValue);
        }

        // Update variances and recalculate pooled effect
        const randomWeights = effectSizes.map(es => 1 / (es.variance + tauSquared));
        const randomWeightedSum = effectSizes.reduce((sum, es, i) =>
            sum + es.effect_size * randomWeights[i], 0);
        const randomTotalWeight = randomWeights.reduce((sum, w) => sum + w, 0);

        const randomPooledEffect = randomWeightedSum / randomTotalWeight;
        const randomPooledVariance = 1 / randomTotalWeight;
        const randomPooledSE = Math.sqrt(randomPooledVariance);

        return {
            model_type: 'random_effects',
            pooled_effect_size: randomPooledEffect,
            pooled_variance: randomPooledVariance,
            pooled_standard_error: randomPooledSE,
            confidence_interval: this.calculateConfidenceInterval(randomPooledEffect, randomPooledVariance),
            z_score: randomPooledEffect / randomPooledSE,
            p_value: this.calculatePValue(Math.abs(randomPooledEffect / randomPooledSE)),
            tau_squared: tauSquared,
            tau: Math.sqrt(tauSquared),
            i_squared: this.calculateISquared(qStatistic, df),
            total_studies: effectSizes.length,
            total_weight: randomTotalWeight
        };
    }

    runMixedEffectsModel(effectSizes, moderators) {
        // Simplified mixed effects model
        const randomEffects = this.runRandomEffectsModel(effectSizes);

        // Add moderator analysis
        const moderatorEffects = {};
        for (const moderator of moderators) {
            moderatorEffects[moderator] = this.analyzeModeratorEffect(effectSizes, moderator);
        }

        return {
            ...randomEffects,
            model_type: 'mixed_effects',
            moderator_effects: moderatorEffects
        };
    }

    calculateQStatistic(effectSizes, pooledEffect) {
        return effectSizes.reduce((sum, es) => {
            return sum + es.weight * (es.effect_size - pooledEffect) ** 2;
        }, 0);
    }

    calculateISquared(qStatistic, df) {
        if (df === 0) return 0;
        return Math.max(0, (qStatistic - df) / qStatistic) * 100;
    }

    calculatePValue(zScore) {
        // Simplified p-value calculation using normal distribution approximation
        if (zScore < 0) zScore = -zScore;

        if (zScore < 1.96) return 0.05; // Two-tailed test approximation
        if (zScore < 2.58) return 0.01;
        if (zScore < 3.29) return 0.001;
        return 0.0001;
    }

    analyzeModeratorEffect(effectSizes, moderator) {
        // Group studies by moderator levels
        const groups = {};
        effectSizes.forEach(es => {
            const study = es; // In practice, you'd look up the original study data
            const level = study[moderator] || 'unknown';
            if (!groups[level]) groups[level] = [];
            groups[level].push(es);
        });

        // Calculate effect sizes for each group
        const groupEffects = {};
        Object.entries(groups).forEach(([level, studies]) => {
            if (studies.length >= 2) {
                const groupModel = this.runRandomEffectsModel(studies);
                groupEffects[level] = {
                    effect_size: groupModel.pooled_effect_size,
                    confidence_interval: groupModel.confidence_interval,
                    studies_count: studies.length
                };
            }
        });

        return {
            groups: groupEffects,
            test_for_moderation: this.testModeratorSignificance(groups)
        };
    }

    testModeratorSignificance(groups) {
        // Simplified test for moderation (would use proper statistical test in practice)
        const groupMeans = Object.values(groups).map(group =>
            group.reduce((sum, es) => sum + es.effect_size, 0) / group.length
        );

        const overallMean = groupMeans.reduce((sum, mean) => sum + mean, 0) / groupMeans.length;
        const ssb = groupMeans.reduce((sum, mean) => sum + (mean - overallMean) ** 2, 0);
        const ssw = Object.values(groups).reduce((sum, group) => {
            const groupMean = group.reduce((sum, es) => sum + es.effect_size, 0) / group.length;
            return sum + group.reduce((sum, es) => sum + (es.effect_size - groupMean) ** 2, 0);
        }, 0);

        return {
            between_groups_variance: ssb,
            within_groups_variance: ssw,
            f_statistic: ssb / (ssw / (Object.keys(groups).length - 1)),
            significant: ssb > ssw * 0.1 // Simplified significance test
        };
    }

    analyzeHeterogeneity(effectSizes, modelResults) {
        const qStatistic = this.calculateQStatistic(effectSizes, modelResults.pooled_effect_size);
        const df = effectSizes.length - 1;
        const iSquared = this.calculateISquared(qStatistic, df);

        // Test for heterogeneity
        const pValue = this.calculateHeterogeneityPValue(qStatistic, df);

        return {
            q_statistic: qStatistic,
            degrees_of_freedom: df,
            p_value: pValue,
            i_squared: iSquared,
            i_squared_interpretation: this.interpretISquared(iSquared),
            tau_squared: modelResults.tau_squared || 0,
            tau: modelResults.tau || 0,
            significant_heterogeneity: pValue < 0.05
        };
    }

    calculateHeterogeneityPValue(qStatistic, df) {
        // Simplified chi-square p-value calculation
        if (df === 0) return 1.0;

        // Approximation for large df
        const z = Math.sqrt(2 * qStatistic) - Math.sqrt(2 * df - 1);
        return this.calculatePValue(z);
    }

    interpretISquared(iSquared) {
        if (iSquared < 25) return 'low';
        if (iSquared < 50) return 'moderate';
        if (iSquared < 75) return 'substantial';
        return 'considerable';
    }

    analyzePublicationBias(effectSizes) {
        if (effectSizes.length < 10) {
            return { error: 'Insufficient studies for publication bias analysis (minimum 10 required)' };
        }

        // Egger's test for funnel plot asymmetry
        const eggersTest = this.performEggersTest(effectSizes);

        // Begg's test
        const beggsTest = this.performBeggsTest(effectSizes);

        // Trim and fill analysis
        const trimFill = this.performTrimFillAnalysis(effectSizes);

        return {
            eggers_test: eggersTest,
            beggs_test: beggsTest,
            trim_fill_analysis: trimFill,
            overall_bias_assessment: this.assessPublicationBias(eggersTest, beggsTest, trimFill)
        };
    }

    performEggersTest(effectSizes) {
        // Simplified Egger's test implementation
        const n = effectSizes.length;
        const precision = effectSizes.map(es => 1 / Math.sqrt(es.variance));

        // Standardize effect sizes
        const standardized = effectSizes.map((es, i) =>
            es.effect_size / Math.sqrt(es.variance)
        );

        // Regression of standardized effects on precision
        const slope = this.calculateRegressionSlope(standardized, precision);
        const intercept = this.calculateRegressionIntercept(standardized, precision, slope);

        // Test if intercept is significantly different from zero
        const se_intercept = this.calculateInterceptSE(standardized, precision);
        const t_statistic = intercept / se_intercept;
        const p_value = this.calculatePValue(Math.abs(t_statistic));

        return {
            intercept,
            slope,
            t_statistic,
            p_value,
            significant_bias: p_value < 0.05
        };
    }

    performBeggsTest(effectSizes) {
        // Simplified Begg's test (rank correlation)
        const n = effectSizes.length;
        const variances = effectSizes.map(es => es.variance);
        const effect_sizes = effectSizes.map(es => es.effect_size);

        // Rank variances and effect sizes
        const variance_ranks = this.getRanks(variances);
        const effect_ranks = this.getRanks(effect_sizes);

        // Calculate Kendall's tau
        const tau = this.calculateKendallsTau(variance_ranks, effect_ranks);
        const z_statistic = tau * Math.sqrt((9 * n * (n - 1)) / (2 * (2 * n + 5)));
        const p_value = this.calculatePValue(Math.abs(z_statistic));

        return {
            kendalls_tau: tau,
            z_statistic,
            p_value,
            significant_bias: p_value < 0.05
        };
    }

    performTrimFillAnalysis(effectSizes) {
        // Simplified trim and fill analysis
        const sorted = [...effectSizes].sort((a, b) => a.effect_size - b.effect_size);
        const n = sorted.length;

        // Estimate number of missing studies
        const trimFillEstimate = Math.max(0, Math.floor(n * 0.1)); // Conservative estimate

        return {
            estimated_missing_studies: trimFillEstimate,
            adjusted_effect_size: trimFillEstimate > 0 ?
                this.calculateTrimFillAdjustedEffect(sorted, trimFillEstimate) :
                null,
            funnel_plot_symmetry: trimFillEstimate < n * 0.2 ? 'symmetric' : 'asymmetric'
        };
    }

    calculateTrimFillAdjustedEffect(sortedEffects, missingStudies) {
        // Simplified adjustment
        const originalMean = sortedEffects.reduce((sum, es) => sum + es.effect_size, 0) / sortedEffects.length;
        const adjustment = (sortedEffects[sortedEffects.length - 1].effect_size - originalMean) * 0.1;
        return originalMean + adjustment;
    }

    runSensitivityAnalyses(effectSizes, modelType) {
        const analyses = {};

        // One-study-removed analysis
        analyses.one_study_removed = this.performOneStudyRemovedAnalysis(effectSizes, modelType);

        // Influence analysis
        analyses.influence_analysis = this.performInfluenceAnalysis(effectSizes, modelType);

        // Cumulative meta-analysis
        analyses.cumulative_meta_analysis = this.performCumulativeMetaAnalysis(effectSizes, modelType);

        return analyses;
    }

    performOneStudyRemovedAnalysis(effectSizes, modelType) {
        const results = [];

        for (let i = 0; i < effectSizes.length; i++) {
            const subset = effectSizes.filter((_, index) => index !== i);
            const modelResult = this.runStatisticalModel(subset, modelType, []);
            results.push({
                removed_study: effectSizes[i].study_id,
                pooled_effect_size: modelResult.pooled_effect_size,
                confidence_interval: modelResult.confidence_interval
            });
        }

        return results;
    }

    performInfluenceAnalysis(effectSizes, modelType) {
        const baseModel = this.runStatisticalModel(effectSizes, modelType, []);

        return effectSizes.map(es => ({
            study_id: es.study_id,
            cooks_distance: this.calculateCooksDistance(es, baseModel, effectSizes),
            dfbetas: this.calculateDFBETAS(es, baseModel, effectSizes),
            influential: false // Would need more complex calculation
        }));
    }

    performCumulativeMetaAnalysis(effectSizes, modelType) {
        const results = [];
        const sortedEffects = [...effectSizes].sort((a, b) => a.effect_size - b.effect_size);

        for (let i = 1; i <= sortedEffects.length; i++) {
            const subset = sortedEffects.slice(0, i);
            const modelResult = this.runStatisticalModel(subset, modelType, []);
            results.push({
                studies_included: i,
                pooled_effect_size: modelResult.pooled_effect_size,
                confidence_interval: modelResult.confidence_interval
            });
        }

        return results;
    }

    synthesizeResults(modelResults, heterogeneity, publicationBias, sensitivityResults) {
        const synthesis = {
            summary_effect: {
                effect_size: modelResults.pooled_effect_size,
                confidence_interval: modelResults.confidence_interval,
                statistical_significance: modelResults.p_value < 0.05,
                practical_significance: Math.abs(modelResults.pooled_effect_size) > 0.2
            },
            heterogeneity_assessment: {
                level: heterogeneity.i_squared_interpretation,
                significant: heterogeneity.significant_heterogeneity,
                implications: this.interpretHeterogeneityImplications(heterogeneity)
            },
            robustness_assessment: {
                sensitivity_analyses: this.assessSensitivityRobustness(sensitivityResults),
                publication_bias: publicationBias ? this.assessPublicationBiasRobustness(publicationBias) : null
            },
            overall_confidence: this.calculateOverallConfidence(modelResults, heterogeneity, publicationBias, sensitivityResults)
        };

        return synthesis;
    }

    generateMetaAnalysisInsights(synthesis, methodology, moderators) {
        const insights = [];

        // Effect size interpretation
        const effectSize = synthesis.summary_effect.effect_size;
        if (Math.abs(effectSize) < 0.2) {
            insights.push('Small effect size suggests limited practical impact');
        } else if (Math.abs(effectSize) < 0.5) {
            insights.push('Medium effect size indicates moderate practical significance');
        } else {
            insights.push('Large effect size suggests substantial practical impact');
        }

        // Heterogeneity insights
        if (synthesis.heterogeneity_assessment.significant) {
            insights.push('Significant heterogeneity detected - results should be interpreted cautiously');
            if (moderators.length > 0) {
                insights.push('Consider moderator analysis to explain heterogeneity');
            }
        }

        // Publication bias insights
        if (synthesis.robustness_assessment.publication_bias) {
            const biasAssessment = synthesis.robustness_assessment.publication_bias;
            if (biasAssessment.overall_bias_assessment === 'high') {
                insights.push('High risk of publication bias - consider alternative evidence sources');
            }
        }

        // Confidence assessment
        const confidence = synthesis.overall_confidence;
        if (confidence < 0.5) {
            insights.push('Low confidence in results - more research needed');
        } else if (confidence > 0.8) {
            insights.push('High confidence in results - findings are robust');
        }

        return insights;
    }

    // Helper methods
    calculateRegressionSlope(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    calculateRegressionIntercept(x, y, slope) {
        const meanX = x.reduce((a, b) => a + b, 0) / x.length;
        const meanY = y.reduce((a, b) => a + b, 0) / y.length;
        return meanY - slope * meanX;
    }

    calculateInterceptSE(x, y) {
        const n = x.length;
        const slope = this.calculateRegressionSlope(x, y);
        const intercept = this.calculateRegressionIntercept(x, y, slope);

        const residuals = x.map((xi, i) => y[i] - (slope * xi + intercept));
        const mse = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
        const meanX = x.reduce((a, b) => a + b, 0) / n;
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        return Math.sqrt(mse * (1/n + meanX * meanX / sumXX));
    }

    getRanks(values) {
        const sorted = [...values].sort((a, b) => a - b);
        return values.map(val => sorted.indexOf(val) + 1);
    }

    calculateKendallsTau(ranks1, ranks2) {
        let concordant = 0;
        let discordant = 0;

        for (let i = 0; i < ranks1.length; i++) {
            for (let j = i + 1; j < ranks1.length; j++) {
                const sign1 = Math.sign(ranks1[j] - ranks1[i]);
                const sign2 = Math.sign(ranks2[j] - ranks2[i]);

                if (sign1 * sign2 > 0) concordant++;
                else if (sign1 * sign2 < 0) discordant++;
            }
        }

        return (concordant - discordant) / (concordant + discordant);
    }

    calculateCooksDistance(study, baseModel, allStudies) {
        // Simplified Cook's distance calculation
        const subset = allStudies.filter(s => s.study_id !== study.study_id);
        const subsetModel = this.runStatisticalModel(subset, baseModel.model_type, []);

        const diff = Math.abs(baseModel.pooled_effect_size - subsetModel.pooled_effect_size);
        return diff / baseModel.pooled_standard_error;
    }

    calculateDFBETAS(study, baseModel, allStudies) {
        // Simplified DFBETAS calculation
        const subset = allStudies.filter(s => s.study_id !== study.study_id);
        const subsetModel = this.runStatisticalModel(subset, baseModel.model_type, []);

        return (baseModel.pooled_effect_size - subsetModel.pooled_effect_size) /
               baseModel.pooled_standard_error;
    }

    interpretHeterogeneityImplications(heterogeneity) {
        if (!heterogeneity.significant_heterogeneity) {
            return 'Results are consistent across studies';
        }

        const level = heterogeneity.i_squared_interpretation;
        switch (level) {
            case 'low':
                return 'Minor inconsistencies may be due to chance';
            case 'moderate':
                return 'Moderate variability suggests some differences between studies';
            case 'substantial':
                return 'Considerable differences between studies require investigation';
            case 'considerable':
                return 'Major differences suggest studies are not comparable';
            default:
                return 'Heterogeneity level unclear';
        }
    }

    assessSensitivityRobustness(sensitivityResults) {
        if (!sensitivityResults) return null;

        const osrResults = sensitivityResults.one_study_removed;
        const baseEffect = osrResults[0]?.pooled_effect_size || 0;

        const variations = osrResults.map(r => Math.abs(r.pooled_effect_size - baseEffect));
        const maxVariation = Math.max(...variations);
        const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;

        return {
            max_variation: maxVariation,
            average_variation: avgVariation,
            robust: maxVariation < 0.1, // Less than 0.1 effect size change
            stability_assessment: maxVariation < 0.1 ? 'stable' :
                                 maxVariation < 0.2 ? 'moderately_stable' : 'unstable'
        };
    }

    assessPublicationBiasRobustness(publicationBias) {
        if (!publicationBias.eggers_test || !publicationBias.beggs_test) {
            return { overall_bias_assessment: 'unclear' };
        }

        const eggersSignificant = publicationBias.eggers_test.significant_bias;
        const beggsSignificant = publicationBias.beggs_test.significant_bias;

        let assessment = 'low';
        if (eggersSignificant || beggsSignificant) {
            assessment = 'moderate';
        }
        if (eggersSignificant && beggsSignificant) {
            assessment = 'high';
        }

        return {
            overall_bias_assessment: assessment,
            eggers_significant: eggersSignificant,
            beggs_significant: beggsSignificant,
            trim_fill_adjustment: publicationBias.trim_fill_analysis?.estimated_missing_studies > 0
        };
    }

    calculateOverallConfidence(modelResults, heterogeneity, publicationBias, sensitivityResults) {
        let confidence = 1.0;

        // Statistical significance
        if (modelResults.p_value >= 0.05) {
            confidence -= 0.3;
        }

        // Heterogeneity
        if (heterogeneity.significant_heterogeneity) {
            const iSquared = heterogeneity.i_squared;
            if (iSquared > 75) confidence -= 0.3;
            else if (iSquared > 50) confidence -= 0.2;
            else if (iSquared > 25) confidence -= 0.1;
        }

        // Publication bias
        if (publicationBias && publicationBias.overall_bias_assessment === 'high') {
            confidence -= 0.2;
        }

        // Sensitivity analysis
        if (sensitivityResults) {
            const robustness = this.assessSensitivityRobustness(sensitivityResults);
            if (robustness.stability_assessment === 'unstable') {
                confidence -= 0.2;
            } else if (robustness.stability_assessment === 'moderately_stable') {
                confidence -= 0.1;
            }
        }

        return Math.max(0, Math.min(1, confidence));
    }

    async updateAnalysisStatus(analysisId, status) {
        const statusFile = path.join(this.analysesPath, analysisId, 'status.json');
        const currentStatus = this.activeAnalyses.get(analysisId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeAnalyses.set(analysisId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating meta-analysis status:', error);
        }

        return newStatus;
    }

    async getAnalysisStatus(analysisId) {
        if (this.activeAnalyses.has(analysisId)) {
            return this.activeAnalyses.get(analysisId);
        }

        try {
            const statusFile = path.join(this.analysesPath, analysisId, 'status.json');
            const statusData = await fs.readFile(statusFile, 'utf8');
            const status = JSON.parse(statusData);
            this.activeAnalyses.set(analysisId, status);
            return status;
        } catch (error) {
            return null;
        }
    }

    generateAnalysisId() {
        return `meta_analysis_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableMethodologies() {
        return Object.keys(this.methodologies).map(key => ({
            id: key,
            ...this.methodologies[key]
        }));
    }

    getStatisticalModels() {
        return Object.keys(this.statisticalModels).map(key => ({
            id: key,
            ...this.statisticalModels[key]
        }));
    }
}

// Initialize meta-analysis engine
const metaAnalysisEngine = new MetaAnalysisEngine();

// Routes
router.get('/methodologies', verifyToken, async (req, res) => {
    try {
        res.json({
            methodologies: metaAnalysisEngine.getAvailableMethodologies(),
            statistical_models: metaAnalysisEngine.getStatisticalModels(),
            total_methodologies: Object.keys(metaAnalysisEngine.methodologies).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/run', verifyToken, async (req, res) => {
    try {
        const {
            methodology,
            studies_data,
            effect_size_measure = 'hedges_g',
            statistical_model = 'random_effects',
            moderators = [],
            sensitivity_analyses = true,
            publication_bias_tests = true
        } = req.body;

        if (!methodology || !studies_data) {
            return res.status(400).json({ error: 'Methodology and studies_data are required' });
        }

        const analysisId = metaAnalysisEngine.generateAnalysisId();

        // Start meta-analysis asynchronously
        metaAnalysisEngine.runMetaAnalysis(analysisId, {
            methodology,
            studies_data,
            effect_size_measure,
            statistical_model,
            moderators,
            sensitivity_analyses,
            publication_bias_tests
        }).catch(error => {
            console.error(`Meta-analysis ${analysisId} failed:`, error);
        });

        res.json({
            success: true,
            analysisId,
            message: 'Meta-analysis started',
            methodology,
            statistical_model,
            studies_count: studies_data.length,
            estimatedDuration: `${Math.ceil(studies_data.length / 10)} minutes`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analysis/:analysisId/status', verifyToken, async (req, res) => {
    try {
        const { analysisId } = req.params;
        const status = await metaAnalysisEngine.getAnalysisStatus(analysisId);

        if (!status) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analysis/:analysisId/results', verifyToken, async (req, res) => {
    try {
        const { analysisId } = req.params;
        const status = await metaAnalysisEngine.getAnalysisStatus(analysisId);

        if (!status) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        if (status.status !== 'completed') {
            return res.status(400).json({
                error: 'Analysis not completed',
                currentStatus: status.status,
                stage: status.stage
            });
        }

        res.json({
            analysisId,
            results: status.results,
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analyses', verifyToken, async (req, res) => {
    try {
        const analyses = Array.from(metaAnalysisEngine.activeAnalyses.entries()).map(([analysisId, status]) => ({
            analysisId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
            methodology: status.methodology,
            statistical_model: status.statistical_model,
            startTime: status.startTime,
            lastUpdate: status.lastUpdate
        }));

        res.json({
            analyses,
            total: analyses.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/compare-methodologies', verifyToken, async (req, res) => {
    try {
        const { studies_data, methodologies = ['effect_size_meta_analysis', 'network_meta_analysis'] } = req.body;

        if (!studies_data || !Array.isArray(methodologies)) {
            return res.status(400).json({ error: 'Studies data and methodologies array are required' });
        }

        const comparisonResults = {};

        for (const methodology of methodologies) {
            try {
                const analysisId = metaAnalysisEngine.generateAnalysisId();
                const result = await metaAnalysisEngine.runMetaAnalysis(analysisId, {
                    methodology,
                    studies_data,
                    effect_size_measure: 'hedges_g',
                    statistical_model: 'random_effects'
                });
                comparisonResults[methodology] = {
                    status: 'success',
                    results: result,
                    analysisId
                };
            } catch (error) {
                comparisonResults[methodology] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Generate methodology comparison
        const comparison = metaAnalysisEngine.generateMethodologyComparison(comparisonResults);

        res.json({
            comparison: comparisonResults,
            methodology_comparison: comparison,
            methodologies_compared: methodologies,
            studies_count: studies_data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper methods
metaAnalysisEngine.generateMethodologyComparison = function(comparisonResults) {
    const successfulResults = Object.entries(comparisonResults)
        .filter(([_, result]) => result.status === 'success')
        .map(([method, result]) => ({ method, ...result.results }));

    if (successfulResults.length === 0) {
        return { error: 'No successful methodology results to compare' };
    }

    const comparison = {
        methodologies_compared: successfulResults.length,
        best_methodology: successfulResults.reduce((best, current) => {
            const bestConfidence = best.synthesis?.overall_confidence || 0;
            const currentConfidence = current.synthesis?.overall_confidence || 0;
            return currentConfidence > bestConfidence ? current : best;
        }),
        consistency_analysis: this.analyzeMethodologyConsistency(successfulResults),
        recommendation: this.recommendBestMethodology(successfulResults)
    };

    return comparison;
};

metaAnalysisEngine.analyzeMethodologyConsistency = function(results) {
    const effectSizes = results.map(r => r.model_results?.pooled_effect_size || 0);
    const meanEffect = effectSizes.reduce((a, b) => a + b, 0) / effectSizes.length;
    const variance = effectSizes.reduce((sum, es) => sum + Math.pow(es - meanEffect, 2), 0) / effectSizes.length;

    return {
        effect_size_range: {
            min: Math.min(...effectSizes),
            max: Math.max(...effectSizes),
            range: Math.max(...effectSizes) - Math.min(...effectSizes)
        },
        consistency_coefficient: 1 - (variance / Math.pow(meanEffect, 2)), // Simplified consistency measure
        consistent: variance < 0.01 // Low variance indicates consistency
    };
};

metaAnalysisEngine.recommendBestMethodology = function(results) {
    // Score methodologies based on multiple criteria
    const scores = results.map(result => ({
        method: result.method,
        score: this.calculateMethodologyScore(result),
        confidence: result.synthesis?.overall_confidence || 0,
        heterogeneity: result.heterogeneity?.i_squared || 0
    }));

    const best = scores.reduce((best, current) =>
        current.score > best.score ? current : best
    );

    return {
        recommended_methodology: best.method,
        score: best.score,
        reasoning: this.generateRecommendationReasoning(best, results)
    };
};

metaAnalysisEngine.calculateMethodologyScore = function(result) {
    let score = 0;

    // Confidence weight (40%)
    score += (result.synthesis?.overall_confidence || 0) * 0.4;

    // Heterogeneity consideration (30%) - Lower heterogeneity is better
    const heterogeneityPenalty = (result.heterogeneity?.i_squared || 0) / 100;
    score += (1 - heterogeneityPenalty) * 0.3;

    // Statistical significance (20%)
    const pValue = result.synthesis?.p_value || 1;
    score += (pValue < 0.05 ? 1 : 0) * 0.2;

    // Sample size consideration (10%)
    const totalSampleSize = result.synthesis?.total_sample_size || 0;
    score += Math.min(totalSampleSize / 1000, 1) * 0.1;

    return Math.min(score, 1);
}

module.exports = router;
