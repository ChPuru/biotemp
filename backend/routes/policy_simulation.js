const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Advanced Policy Simulation Service with Monte Carlo Modeling
class PolicySimulationService {
    constructor() {
        this.simulationsPath = path.join(__dirname, '../reports/policy_simulations');
        this.activeSimulations = new Map();
        this.initializeSimulationsDirectory();

        // Policy frameworks and models
        this.policyFrameworks = {
            'mpa_expansion': {
                name: 'Marine Protected Area Expansion',
                description: 'Simulate biodiversity impact of MPA network expansion',
                parameters: ['expansion_rate', 'enforcement_level', 'funding_amount', 'monitoring_frequency'],
                outcomes: ['biodiversity_recovery', 'fisheries_benefit', 'tourism_revenue', 'enforcement_cost'],
                timeHorizon: 20 // years
            },
            'climate_adaptation': {
                name: 'Climate Change Adaptation Strategy',
                description: 'Model adaptation measures for climate-resilient conservation',
                parameters: ['adaptation_budget', 'vulnerability_assessment', 'community_engagement', 'technology_investment'],
                outcomes: ['species_survival_rate', 'ecosystem_resilience', 'adaptation_cost', 'co_benefits'],
                timeHorizon: 30
            },
            'sustainable_finance': {
                name: 'Biodiversity Finance Mechanism',
                description: 'Economic modeling of conservation financing strategies',
                parameters: ['investment_amount', 'return_expectation', 'risk_tolerance', 'impact_weighting'],
                outcomes: ['financial_return', 'biodiversity_impact', 'social_benefits', 'sustainability_score'],
                timeHorizon: 25
            },
            'invasive_species_control': {
                name: 'Invasive Species Management',
                description: 'Predictive modeling of invasive species control programs',
                parameters: ['control_budget', 'detection_probability', 'eradication_success', 'prevention_measures'],
                outcomes: ['native_species_recovery', 'control_cost', 'long_term_savings', 'ecosystem_health'],
                timeHorizon: 15
            },
            'ecosystem_restoration': {
                name: 'Large-scale Ecosystem Restoration',
                description: 'Monte Carlo simulation of restoration project outcomes',
                parameters: ['restoration_area', 'species_reintroduction', 'monitoring_intensity', 'stakeholder_support'],
                outcomes: ['biodiversity_gain', 'carbon_sequestration', 'water_quality', 'community_benefits'],
                timeHorizon: 50
            }
        };

        // Monte Carlo simulation parameters
        this.monteCarloParams = {
            iterations: 10000,
            confidence_intervals: [0.05, 0.95], // 90% confidence interval
            random_seed: 42
        };
    }

    async initializeSimulationsDirectory() {
        try {
            await fs.mkdir(this.simulationsPath, { recursive: true });
        } catch (error) {
            console.error('Policy simulations directory initialization error:', error);
        }
    }

    async runMonteCarloSimulation(simulationId, params) {
        const {
            policy_framework,
            baseline_data,
            intervention_scenarios,
            monte_carlo_iterations = 10000,
            time_horizon = 20
        } = params;

        try {
            await this.updateSimulationStatus(simulationId, {
                status: 'running',
                stage: 'initialization',
                policy_framework,
                startTime: new Date().toISOString(),
                progress: 0,
                monte_carlo_iterations
            });

            // Validate policy framework
            if (!this.policyFrameworks[policy_framework]) {
                throw new Error(`Unknown policy framework: ${policy_framework}`);
            }

            const framework = this.policyFrameworks[policy_framework];

            await this.updateSimulationStatus(simulationId, {
                stage: 'running_monte_carlo',
                progress: 10
            });

            // Run Monte Carlo simulation
            const simulationResults = await this.executeMonteCarloSimulation(
                framework,
                baseline_data,
                intervention_scenarios,
                monte_carlo_iterations,
                time_horizon
            );

            await this.updateSimulationStatus(simulationId, {
                stage: 'analyzing_results',
                progress: 80
            });

            // Analyze results and generate insights
            const analysis = this.analyzeSimulationResults(simulationResults, framework);
            const recommendations = this.generatePolicyRecommendations(analysis, framework);

            await this.updateSimulationStatus(simulationId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: simulationResults,
                analysis,
                recommendations
            });

            return { simulationResults, analysis, recommendations };

        } catch (error) {
            await this.updateSimulationStatus(simulationId, {
                status: 'failed',
                stage: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    async executeMonteCarloSimulation(framework, baselineData, scenarios, iterations, timeHorizon) {
        const results = {
            baseline: [],
            scenarios: {},
            iterations_completed: 0,
            computation_time: 0
        };

        const startTime = Date.now();

        // Generate baseline scenario
        for (let i = 0; i < iterations; i++) {
            const baselineOutcome = this.simulatePolicyOutcome(
                framework,
                baselineData,
                null, // no intervention
                timeHorizon
            );
            results.baseline.push(baselineOutcome);
        }

        // Generate intervention scenarios
        for (const [scenarioName, scenarioParams] of Object.entries(scenarios)) {
            results.scenarios[scenarioName] = [];

            for (let i = 0; i < iterations; i++) {
                const scenarioOutcome = this.simulatePolicyOutcome(
                    framework,
                    baselineData,
                    scenarioParams,
                    timeHorizon
                );
                results.scenarios[scenarioName].push(scenarioOutcome);
            }
        }

        results.iterations_completed = iterations;
        results.computation_time = Date.now() - startTime;

        return results;
    }

    simulatePolicyOutcome(framework, baselineData, interventionParams, timeHorizon) {
        const outcome = {};

        // Simulate each outcome metric over time
        framework.outcomes.forEach(outcomeMetric => {
            outcome[outcomeMetric] = this.simulateOutcomeTrajectory(
                outcomeMetric,
                baselineData,
                interventionParams,
                timeHorizon,
                framework.name
            );
        });

        // Calculate net present value and benefit-cost ratio
        outcome.npv = this.calculateNPV(outcome, timeHorizon);
        outcome.bcr = this.calculateBenefitCostRatio(outcome);

        return outcome;
    }

    simulateOutcomeTrajectory(metric, baselineData, interventionParams, timeHorizon, frameworkName) {
        const trajectory = [];
        let currentValue = baselineData[metric] || this.getBaselineValue(metric, frameworkName);

        for (let year = 0; year <= timeHorizon; year++) {
            // Apply stochastic growth model
            const growthRate = this.calculateGrowthRate(
                metric,
                currentValue,
                interventionParams,
                year,
                frameworkName
            );

            // Add uncertainty (Monte Carlo noise)
            const uncertainty = this.generateUncertainty(metric, frameworkName);
            const adjustedGrowth = growthRate * (1 + uncertainty);

            currentValue *= (1 + adjustedGrowth);
            trajectory.push({
                year,
                value: currentValue,
                growth_rate: adjustedGrowth,
                uncertainty
            });
        }

        return trajectory;
    }

    calculateGrowthRate(metric, currentValue, interventionParams, year, frameworkName) {
        // Base growth rates by framework and metric
        const baseRates = {
            'mpa_expansion': {
                'biodiversity_recovery': 0.02,
                'fisheries_benefit': 0.015,
                'tourism_revenue': 0.03,
                'enforcement_cost': 0.01
            },
            'climate_adaptation': {
                'species_survival_rate': 0.005,
                'ecosystem_resilience': 0.008,
                'adaptation_cost': 0.02,
                'co_benefits': 0.012
            },
            'sustainable_finance': {
                'financial_return': 0.08,
                'biodiversity_impact': 0.015,
                'social_benefits': 0.01,
                'sustainability_score': 0.005
            }
        };

        let baseRate = baseRates[frameworkName]?.[metric] || 0.01;

        // Apply intervention effects
        if (interventionParams) {
            baseRate = this.applyInterventionEffects(baseRate, metric, interventionParams, year);
        }

        // Diminishing returns over time
        const diminishingFactor = Math.max(0.1, 1 - (year * 0.02));

        return baseRate * diminishingFactor;
    }

    applyInterventionEffects(baseRate, metric, interventionParams, year) {
        let adjustedRate = baseRate;

        // Framework-specific intervention effects
        if (metric === 'biodiversity_recovery' && interventionParams.expansion_rate) {
            adjustedRate *= (1 + interventionParams.expansion_rate * 0.5);
        }

        if (metric === 'enforcement_cost' && interventionParams.enforcement_level) {
            adjustedRate *= (1 + interventionParams.enforcement_level * 0.3);
        }

        if (metric === 'adaptation_cost' && interventionParams.adaptation_budget) {
            adjustedRate *= (1 - interventionParams.adaptation_budget * 0.2);
        }

        if (metric === 'financial_return' && interventionParams.investment_amount) {
            adjustedRate *= (1 + Math.log10(interventionParams.investment_amount) * 0.1);
        }

        // Time-dependent effects (interventions take time to show results)
        if (year < 3) {
            adjustedRate *= 0.5; // Initial implementation phase
        } else if (year < 5) {
            adjustedRate *= 0.8; // Ramp-up phase
        }

        return adjustedRate;
    }

    generateUncertainty(metric, frameworkName) {
        // Generate realistic uncertainty based on metric type
        const uncertaintyProfiles = {
            'biodiversity_recovery': { mean: 0, std: 0.15 }, // High uncertainty
            'financial_return': { mean: 0, std: 0.08 },     // Market uncertainty
            'enforcement_cost': { mean: 0, std: 0.12 },     // Implementation uncertainty
            'species_survival_rate': { mean: 0, std: 0.10 } // Ecological uncertainty
        };

        const profile = uncertaintyProfiles[metric] || { mean: 0, std: 0.05 };
        return this.generateNormalRandom(profile.mean, profile.std);
    }

    generateNormalRandom(mean, std) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * std;
    }

    getBaselineValue(metric, frameworkName) {
        // Realistic baseline values
        const baselines = {
            'biodiversity_recovery': 0.7,
            'fisheries_benefit': 1000000,
            'tourism_revenue': 500000,
            'enforcement_cost': 200000,
            'species_survival_rate': 0.8,
            'ecosystem_resilience': 0.6,
            'adaptation_cost': 300000,
            'co_benefits': 150000,
            'financial_return': 1000000,
            'biodiversity_impact': 0.75,
            'social_benefits': 200000,
            'sustainability_score': 0.7
        };

        return baselines[metric] || 1.0;
    }

    calculateNPV(outcome, timeHorizon) {
        const discountRate = 0.05; // 5% annual discount rate
        let npv = 0;

        // Sum discounted benefits minus costs
        for (let year = 0; year <= timeHorizon; year++) {
            const discountFactor = 1 / Math.pow(1 + discountRate, year);

            // Simplified: assume benefits are positive, costs are negative
            Object.entries(outcome).forEach(([metric, trajectory]) => {
                if (Array.isArray(trajectory) && trajectory[year]) {
                    const value = trajectory[year].value;

                    // Classify as benefit or cost based on metric name
                    const isBenefit = !metric.includes('cost');
                    const discountedValue = value * discountFactor;

                    npv += isBenefit ? discountedValue : -discountedValue;
                }
            });
        }

        return npv;
    }

    calculateBenefitCostRatio(outcome) {
        // Simplified BCR calculation
        const finalYear = outcome[Object.keys(outcome)[0]]?.length - 1 || 0;
        if (finalYear === 0) return 1.0;

        let totalBenefits = 0;
        let totalCosts = 0;

        Object.entries(outcome).forEach(([metric, trajectory]) => {
            if (Array.isArray(trajectory) && trajectory[finalYear]) {
                const finalValue = trajectory[finalYear].value;

                if (metric.includes('cost')) {
                    totalCosts += finalValue;
                } else if (typeof finalValue === 'number') {
                    totalBenefits += finalValue;
                }
            }
        });

        return totalCosts > 0 ? totalBenefits / totalCosts : 1.0;
    }

    analyzeSimulationResults(results, framework) {
        const analysis = {
            summary_statistics: {},
            confidence_intervals: {},
            risk_assessment: {},
            scenario_comparison: {}
        };

        // Calculate summary statistics for each scenario
        const allScenarios = { baseline: results.baseline, ...results.scenarios };

        Object.entries(allScenarios).forEach(([scenarioName, outcomes]) => {
            analysis.summary_statistics[scenarioName] = this.calculateSummaryStats(outcomes, framework.outcomes);
        });

        // Calculate confidence intervals
        Object.entries(allScenarios).forEach(([scenarioName, outcomes]) => {
            analysis.confidence_intervals[scenarioName] = this.calculateConfidenceIntervals(outcomes);
        });

        // Risk assessment
        analysis.risk_assessment = this.assessRisks(allScenarios, framework);

        // Scenario comparison
        analysis.scenario_comparison = this.compareScenarios(allScenarios, framework);

        return analysis;
    }

    calculateSummaryStats(outcomes, metrics) {
        const stats = {};

        metrics.forEach(metric => {
            const values = outcomes.map(o => o[metric]?.[o[metric].length - 1]?.value || 0);

            if (values.length > 0) {
                stats[metric] = {
                    mean: values.reduce((a, b) => a + b, 0) / values.length,
                    median: this.calculateMedian(values),
                    std: this.calculateStd(values),
                    min: Math.min(...values),
                    max: Math.max(...values),
                    percentile_5: this.calculatePercentile(values, 5),
                    percentile_95: this.calculatePercentile(values, 95)
                };
            }
        });

        return stats;
    }

    calculateConfidenceIntervals(outcomes) {
        const intervals = {};

        outcomes.forEach(outcome => {
            Object.entries(outcome).forEach(([metric, trajectory]) => {
                if (Array.isArray(trajectory)) {
                    const finalValues = outcomes.map(o => o[metric]?.[o[metric].length - 1]?.value || 0);
                    intervals[metric] = {
                        confidence_90: {
                            lower: this.calculatePercentile(finalValues, 5),
                            upper: this.calculatePercentile(finalValues, 95)
                        }
                    };
                }
            });
        });

        return intervals;
    }

    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    calculateStd(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);

        if (lower === upper) {
            return sorted[lower];
        }

        return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
    }

    assessRisks(scenarios, framework) {
        const riskAssessment = {};

        Object.entries(scenarios).forEach(([scenarioName, outcomes]) => {
            const scenarioRisks = {};

            framework.outcomes.forEach(metric => {
                const values = outcomes.map(o => o[metric]?.[o[metric].length - 1]?.value || 0);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const std = this.calculateStd(values);

                // Risk metrics
                scenarioRisks[metric] = {
                    coefficient_of_variation: std / Math.abs(mean),
                    downside_risk: this.calculateDownsideRisk(values, mean),
                    probability_of_loss: this.calculateProbabilityOfLoss(values, 0)
                };
            });

            riskAssessment[scenarioName] = scenarioRisks;
        });

        return riskAssessment;
    }

    calculateDownsideRisk(values, reference) {
        const downsideValues = values.filter(v => v < reference);
        return downsideValues.length > 0 ?
            Math.sqrt(downsideValues.reduce((sum, v) => sum + Math.pow(v - reference, 2), 0) / downsideValues.length) : 0;
    }

    calculateProbabilityOfLoss(values, threshold) {
        const losses = values.filter(v => v < threshold);
        return losses.length / values.length;
    }

    compareScenarios(scenarios, framework) {
        const comparison = {};
        const scenarioNames = Object.keys(scenarios);

        if (scenarioNames.length < 2) return comparison;

        const baseline = scenarios.baseline || scenarios[scenarioNames[0]];

        scenarioNames.forEach(scenarioName => {
            if (scenarioName === 'baseline') return;

            comparison[scenarioName] = {};

            framework.outcomes.forEach(metric => {
                const baselineValues = baseline.map(o => o[metric]?.[o[metric].length - 1]?.value || 0);
                const scenarioValues = scenarios[scenarioName].map(o => o[metric]?.[o[metric].length - 1]?.value || 0);

                const baselineMean = baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length;
                const scenarioMean = scenarioValues.reduce((a, b) => a + b, 0) / scenarioValues.length;

                comparison[scenarioName][metric] = {
                    improvement: scenarioMean - baselineMean,
                    improvement_percentage: baselineMean !== 0 ? ((scenarioMean - baselineMean) / Math.abs(baselineMean)) * 100 : 0,
                    statistical_significance: this.testStatisticalSignificance(baselineValues, scenarioValues)
                };
            });
        });

        return comparison;
    }

    testStatisticalSignificance(group1, group2) {
        // Simplified t-test implementation
        const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
        const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;

        const var1 = this.calculateVariance(group1);
        const var2 = this.calculateVariance(group2);

        const pooledVar = ((group1.length - 1) * var1 + (group2.length - 1) * var2) / (group1.length + group2.length - 2);
        const se = Math.sqrt(pooledVar * (1/group1.length + 1/group2.length));

        const tStatistic = Math.abs(mean1 - mean2) / se;

        // Approximate p-value (simplified)
        return tStatistic > 2.0 ? 'significant' : 'not_significant';
    }

    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    }

    generatePolicyRecommendations(analysis, framework) {
        const recommendations = [];

        // Find best performing scenario
        const scenarioStats = analysis.summary_statistics;
        const bestScenario = Object.entries(scenarioStats)
            .filter(([name]) => name !== 'baseline')
            .reduce((best, [name, stats]) => {
                const bestNPV = best[1]?.npv?.mean || 0;
                const currentNPV = stats?.npv?.mean || 0;
                return currentNPV > bestNPV ? [name, stats] : best;
            }, ['baseline', scenarioStats.baseline]);

        recommendations.push(`Best performing scenario: ${bestScenario[0]}`);

        // Risk-based recommendations
        const riskAssessment = analysis.risk_assessment;
        Object.entries(riskAssessment).forEach(([scenario, risks]) => {
            const highRiskMetrics = Object.entries(risks)
                .filter(([_, risk]) => risk.coefficient_of_variation > 0.3)
                .map(([metric]) => metric);

            if (highRiskMetrics.length > 0) {
                recommendations.push(`High uncertainty in ${scenario} for: ${highRiskMetrics.join(', ')}`);
            }
        });

        // Cost-benefit recommendations
        Object.entries(scenarioStats).forEach(([scenario, stats]) => {
            if (stats.bcr?.mean > 1.5) {
                recommendations.push(`${scenario} shows strong benefit-cost ratio (${stats.bcr.mean.toFixed(2)})`);
            }
        });

        return recommendations;
    }

    async updateSimulationStatus(simulationId, status) {
        const statusFile = path.join(this.simulationsPath, simulationId, 'status.json');
        const currentStatus = this.activeSimulations.get(simulationId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeSimulations.set(simulationId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating policy simulation status:', error);
        }

        return newStatus;
    }

    async getSimulationStatus(simulationId) {
        if (this.activeSimulations.has(simulationId)) {
            return this.activeSimulations.get(simulationId);
        }

        try {
            const statusFile = path.join(this.simulationsPath, simulationId, 'status.json');
            const statusData = await fs.readFile(statusFile, 'utf8');
            const status = JSON.parse(statusData);
            this.activeSimulations.set(simulationId, status);
            return status;
        } catch (error) {
            return null;
        }
    }

    generateSimulationId() {
        return `policy_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableFrameworks() {
        return Object.keys(this.policyFrameworks).map(key => ({
            id: key,
            ...this.policyFrameworks[key]
        }));
    }
}

// Initialize policy simulation service
const policySimulationService = new PolicySimulationService();

// Routes
router.get('/frameworks', verifyToken, async (req, res) => {
    try {
        res.json({
            frameworks: policySimulationService.getAvailableFrameworks(),
            total: Object.keys(policySimulationService.policyFrameworks).length,
            monte_carlo_defaults: policySimulationService.monteCarloParams
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/run', verifyToken, async (req, res) => {
    try {
        const {
            policy_framework,
            baseline_data,
            intervention_scenarios,
            monte_carlo_iterations = 10000,
            time_horizon = 20
        } = req.body;

        if (!policy_framework || !baseline_data || !intervention_scenarios) {
            return res.status(400).json({
                error: 'policy_framework, baseline_data, and intervention_scenarios are required'
            });
        }

        const simulationId = policySimulationService.generateSimulationId();

        // Start simulation asynchronously
        policySimulationService.runMonteCarloSimulation(simulationId, {
            policy_framework,
            baseline_data,
            intervention_scenarios,
            monte_carlo_iterations,
            time_horizon
        }).catch(error => {
            console.error(`Policy simulation ${simulationId} failed:`, error);
        });

        res.json({
            success: true,
            simulationId,
            message: 'Monte Carlo policy simulation started',
            policy_framework,
            monte_carlo_iterations,
            time_horizon,
            estimatedDuration: `${Math.ceil(monte_carlo_iterations / 1000)} minutes`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/simulation/:simulationId/status', verifyToken, async (req, res) => {
    try {
        const { simulationId } = req.params;
        const status = await policySimulationService.getSimulationStatus(simulationId);

        if (!status) {
            return res.status(404).json({ error: 'Simulation not found' });
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/simulation/:simulationId/results', verifyToken, async (req, res) => {
    try {
        const { simulationId } = req.params;
        const status = await policySimulationService.getSimulationStatus(simulationId);

        if (!status) {
            return res.status(404).json({ error: 'Simulation not found' });
        }

        if (status.status !== 'completed') {
            return res.status(400).json({
                error: 'Simulation not completed',
                currentStatus: status.status,
                stage: status.stage
            });
        }

        res.json({
            simulationId,
            results: status.results,
            analysis: status.analysis,
            recommendations: status.recommendations,
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/simulations', verifyToken, async (req, res) => {
    try {
        const simulations = Array.from(policySimulationService.activeSimulations.entries()).map(([simulationId, status]) => ({
            simulationId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
            policy_framework: status.policy_framework,
            startTime: status.startTime,
            lastUpdate: status.lastUpdate
        }));

        res.json({
            simulations,
            total: simulations.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/scenario-analysis', verifyToken, async (req, res) => {
    try {
        const { policy_framework, scenarios, baseline_data, time_horizon = 20 } = req.body;

        if (!policy_framework || !scenarios || !Array.isArray(scenarios)) {
            return res.status(400).json({ error: 'policy_framework and scenarios array are required' });
        }

        const analysisResults = {};

        for (const scenario of scenarios) {
            try {
                const simulationId = policySimulationService.generateSimulationId();
                const result = await policySimulationService.runMonteCarloSimulation(simulationId, {
                    policy_framework,
                    baseline_data: baseline_data || {},
                    intervention_scenarios: { [scenario.name]: scenario.parameters },
                    monte_carlo_iterations: 5000, // Faster for scenario analysis
                    time_horizon
                });

                analysisResults[scenario.name] = {
                    status: 'success',
                    results: result,
                    simulationId
                };
            } catch (error) {
                analysisResults[scenario.name] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Generate comparative analysis
        const comparison = policySimulationService.generateScenarioComparison(analysisResults);

        res.json({
            scenario_analysis: analysisResults,
            comparison,
            policy_framework,
            scenarios_analyzed: scenarios.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/sensitivity-analysis', verifyToken, async (req, res) => {
    try {
        const { policy_framework, baseline_data, parameter_ranges, time_horizon = 20 } = req.body;

        if (!policy_framework || !parameter_ranges) {
            return res.status(400).json({ error: 'policy_framework and parameter_ranges are required' });
        }

        const sensitivityResults = {};

        // Test each parameter range
        for (const [param, range] of Object.entries(parameter_ranges)) {
            sensitivityResults[param] = [];

            for (const value of range) {
                const scenarioParams = { [param]: value };

                try {
                    const simulationId = policySimulationService.generateSimulationId();
                    const result = await policySimulationService.runMonteCarloSimulation(simulationId, {
                        policy_framework,
                        baseline_data: baseline_data || {},
                        intervention_scenarios: { [`${param}_${value}`]: scenarioParams },
                        monte_carlo_iterations: 1000, // Smaller for sensitivity analysis
                        time_horizon
                    });

                    sensitivityResults[param].push({
                        value,
                        results: result,
                        simulationId
                    });
                } catch (error) {
                    sensitivityResults[param].push({
                        value,
                        error: error.message
                    });
                }
            }
        }

        res.json({
            sensitivity_analysis: sensitivityResults,
            policy_framework,
            parameters_tested: Object.keys(parameter_ranges),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper methods
policySimulationService.generateScenarioComparison = function(analysisResults) {
    const successfulResults = Object.entries(analysisResults)
        .filter(([_, result]) => result.status === 'success')
        .map(([name, result]) => ({ name, ...result.results }));

    if (successfulResults.length === 0) {
        return { error: 'No successful scenario results to compare' };
    }

    const comparison = {
        scenarios_compared: successfulResults.length,
        best_scenario: successfulResults.reduce((best, current) => {
            const bestNPV = best.analysis?.summary_statistics?.[best.name]?.npv?.mean || 0;
            const currentNPV = current.analysis?.summary_statistics?.[current.name]?.npv?.mean || 0;
            return currentNPV > bestNPV ? current : best;
        }),
        risk_rankings: successfulResults.map(result => ({
            scenario: result.name,
            risk_score: this.calculateRiskScore(result.analysis?.risk_assessment?.[result.name])
        })).sort((a, b) => a.risk_score - b.risk_score)
    };

    return comparison;
};

policySimulationService.calculateRiskScore = function(riskAssessment) {
    if (!riskAssessment) return 1.0;

    let totalRisk = 0;
    let metricsCount = 0;

    Object.values(riskAssessment).forEach(metricRisk => {
        if (metricRisk.coefficient_of_variation) {
            totalRisk += metricRisk.coefficient_of_variation;
            metricsCount++;
        }
    });

    return metricsCount > 0 ? totalRisk / metricsCount : 1.0;
};

module.exports = router;