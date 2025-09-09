const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Advanced Economic Modeling Service for Biodiversity Valuation
class EconomicModelingService {
    constructor() {
        this.economicDataPath = path.join(__dirname, '../reports/economic_modeling');
        this.activeModels = new Map();
        this.initializeEconomicDataDirectory();

        // Economic valuation methods
        this.valuationMethods = {
            'market_pricing': {
                name: 'Market Pricing Method',
                description: 'Direct market values of biodiversity resources',
                applications: ['timber', 'fisheries', 'agricultural_products'],
                strengths: ['objectively_measurable', 'directly_observable'],
                limitations: ['excludes_non_market_values', 'underestimates_total_value']
            },
            'replacement_cost': {
                name: 'Replacement Cost Method',
                description: 'Cost of replacing biodiversity services artificially',
                applications: ['water_purification', 'pollination', 'flood_control'],
                strengths: ['conservative_estimates', 'policy_relevant'],
                limitations: ['overestimates_replacement_costs', 'technological_assumptions']
            },
            'contingent_valuation': {
                name: 'Contingent Valuation Method',
                description: 'Willingness-to-pay surveys for biodiversity preservation',
                applications: ['existence_values', 'bequest_values', 'option_values'],
                strengths: ['captures_non_use_values', 'comprehensive_coverage'],
                limitations: ['hypothetical_bias', 'survey_design_challenges']
            },
            'hedonic_pricing': {
                name: 'Hedonic Pricing Method',
                description: 'Property value impacts of biodiversity proximity',
                applications: ['amenity_values', 'environmental_quality'],
                strengths: ['revealed_preferences', 'large_sample_sizes'],
                limitations: ['attribution_difficulties', 'spatial_scale_issues']
            },
            'travel_cost': {
                name: 'Travel Cost Method',
                description: 'Recreation value based on travel expenditures',
                applications: ['recreational_benefits', 'eco_tourism'],
                strengths: ['behavioral_data', 'site_specific'],
                limitations: ['day_trip_bias', 'substitution_effects']
            },
            'benefit_transfer': {
                name: 'Benefit Transfer Method',
                description: 'Transferring values from existing studies',
                applications: ['rapid_assessments', 'policy_analysis'],
                strengths: ['cost_effective', 'quick_results'],
                limitations: ['transfer_errors', 'context_differences']
            },
            'inclusive_wealth': {
                name: 'Inclusive Wealth Framework',
                description: 'Comprehensive wealth accounting including natural capital',
                applications: ['sustainable_development', 'national_accounts'],
                strengths: ['holistic_approach', 'policy_integration'],
                limitations: ['data_intensity', 'valuation_challenges']
            },
            'tebv': {
                name: 'Total Economic Value of Biodiversity',
                description: 'Comprehensive framework including all value categories',
                applications: ['comprehensive_assessments', 'policy_evaluation'],
                strengths: ['complete_coverage', 'decision_support'],
                limitations: ['complexity', 'data_requirements']
            }
        };

        // Economic sectors and services
        this.economicSectors = {
            'provisioning_services': {
                name: 'Provisioning Services',
                description: 'Products obtained from ecosystems',
                examples: ['food', 'water', 'timber', 'medicinal_plants'],
                valuation_methods: ['market_pricing', 'replacement_cost']
            },
            'regulating_services': {
                name: 'Regulating Services',
                description: 'Benefits from ecosystem processes',
                examples: ['climate_regulation', 'water_purification', 'pollination', 'flood_control'],
                valuation_methods: ['replacement_cost', 'contingent_valuation']
            },
            'cultural_services': {
                name: 'Cultural Services',
                description: 'Non-material benefits from ecosystems',
                examples: ['recreation', 'spiritual_values', 'education', 'aesthetic_values'],
                valuation_methods: ['travel_cost', 'contingent_valuation', 'hedonic_pricing']
            },
            'supporting_services': {
                name: 'Supporting Services',
                description: 'Underlying ecosystem functions',
                examples: ['soil_formation', 'nutrient_cycling', 'primary_production'],
                valuation_methods: ['benefit_transfer', 'inclusive_wealth']
            }
        };

        // Discount rates for different contexts
        this.discountRates = {
            'conservative': 0.03,    // 3% - for long-term conservation
            'moderate': 0.05,        // 5% - standard economic analysis
            'aggressive': 0.07,      // 7% - for commercial investments
            'social': 0.02          // 2% - for intergenerational equity
        };

        // Currency conversion rates (simplified)
        this.currencyRates = {
            'USD': 1.0,
            'EUR': 0.85,
            'GBP': 0.73,
            'INR': 83.0,
            'JPY': 110.0,
            'CNY': 6.45
        };
    }

    async initializeEconomicDataDirectory() {
        try {
            await fs.mkdir(this.economicDataPath, { recursive: true });
        } catch (error) {
            console.error('Economic modeling directory initialization error:', error);
        }
    }

    async runEconomicValuation(modelId, params) {
        const {
            biodiversity_assets,
            valuation_methods = ['market_pricing', 'contingent_valuation'],
            time_horizon = 50,
            discount_rate = 'moderate',
            currency = 'USD',
            geographic_scope = 'local',
            stakeholder_groups = ['general_public', 'industries', 'government']
        } = params;

        try {
            await this.updateModelStatus(modelId, {
                status: 'running',
                stage: 'initialization',
                valuation_methods,
                time_horizon,
                startTime: new Date().toISOString(),
                progress: 0
            });

            // Validate inputs
            const validation = this.validateEconomicInputs(biodiversity_assets, valuation_methods);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            await this.updateModelStatus(modelId, {
                stage: 'data_processing',
                progress: 10
            });

            // Process biodiversity asset data
            const processedAssets = this.processBiodiversityAssets(biodiversity_assets);

            await this.updateModelStatus(modelId, {
                stage: 'valuation_calculations',
                progress: 30
            });

            // Calculate valuations using different methods
            const valuations = {};
            for (const method of valuation_methods) {
                valuations[method] = await this.calculateValuation(
                    processedAssets,
                    method,
                    time_horizon,
                    discount_rate,
                    geographic_scope
                );
            }

            await this.updateModelStatus(modelId, {
                stage: 'benefit_cost_analysis',
                progress: 60
            });

            // Perform benefit-cost analysis
            const benefitCostAnalysis = this.performBenefitCostAnalysis(
                valuations,
                processedAssets,
                time_horizon,
                discount_rate
            );

            await this.updateModelStatus(modelId, {
                stage: 'sensitivity_analysis',
                progress: 80
            });

            // Conduct sensitivity analysis
            const sensitivityAnalysis = this.performSensitivityAnalysis(
                valuations,
                processedAssets,
                time_horizon
            );

            // Generate stakeholder analysis
            const stakeholderAnalysis = this.analyzeStakeholderImpacts(
                valuations,
                stakeholder_groups,
                geographic_scope
            );

            await this.updateModelStatus(modelId, {
                stage: 'report_generation',
                progress: 95
            });

            // Generate comprehensive report
            const report = this.generateEconomicReport(
                processedAssets,
                valuations,
                benefitCostAnalysis,
                sensitivityAnalysis,
                stakeholderAnalysis,
                time_horizon,
                currency
            );

            await this.updateModelStatus(modelId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: {
                    processed_assets: processedAssets,
                    valuations,
                    benefit_cost_analysis: benefitCostAnalysis,
                    sensitivity_analysis: sensitivityAnalysis,
                    stakeholder_analysis: stakeholderAnalysis,
                    report
                }
            });

            return {
                processed_assets: processedAssets,
                valuations,
                benefit_cost_analysis: benefitCostAnalysis,
                sensitivity_analysis: sensitivityAnalysis,
                stakeholder_analysis: stakeholderAnalysis,
                report
            };

        } catch (error) {
            await this.updateModelStatus(modelId, {
                status: 'failed',
                stage: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    validateEconomicInputs(biodiversityAssets, valuationMethods) {
        if (!biodiversityAssets || !Array.isArray(biodiversityAssets) || biodiversityAssets.length === 0) {
            return { valid: false, error: 'Biodiversity assets array is required and cannot be empty' };
        }

        if (!valuationMethods || !Array.isArray(valuationMethods) || valuationMethods.length === 0) {
            return { valid: false, error: 'At least one valuation method must be specified' };
        }

        // Validate valuation methods
        for (const method of valuationMethods) {
            if (!this.valuationMethods[method]) {
                return { valid: false, error: `Unknown valuation method: ${method}` };
            }
        }

        // Validate biodiversity assets
        for (const asset of biodiversityAssets) {
            if (!asset.name || !asset.type || !asset.quantity) {
                return { valid: false, error: 'Each biodiversity asset must have name, type, and quantity' };
            }
        }

        return { valid: true };
    }

    processBiodiversityAssets(biodiversityAssets) {
        return biodiversityAssets.map(asset => ({
            ...asset,
            processed_quantity: this.normalizeQuantity(asset.quantity, asset.unit),
            economic_sector: this.classifyEconomicSector(asset.type),
            conservation_status: asset.iucn_status || 'Not Evaluated',
            market_value: this.estimateMarketValue(asset),
            non_market_value: this.estimateNonMarketValue(asset),
            risk_factors: this.assessRiskFactors(asset)
        }));
    }

    normalizeQuantity(quantity, unit) {
        // Normalize quantities to standard units
        const conversionFactors = {
            'hectares': 1.0,
            'acres': 0.4047,
            'square_km': 100.0,
            'individuals': 1.0,
            'tonnes': 1.0,
            'kg': 0.001
        };

        return quantity * (conversionFactors[unit] || 1.0);
    }

    classifyEconomicSector(assetType) {
        const sectorMapping = {
            'forest': 'provisioning_services',
            'wetland': 'regulating_services',
            'coral_reef': 'cultural_services',
            'species': 'supporting_services',
            'agricultural_land': 'provisioning_services',
            'freshwater': 'provisioning_services'
        };

        return sectorMapping[assetType] || 'supporting_services';
    }

    estimateMarketValue(asset) {
        // Simplified market value estimation based on asset type
        const marketValues = {
            'forest': { per_hectare: 5000, unit: 'USD' },
            'wetland': { per_hectare: 8000, unit: 'USD' },
            'coral_reef': { per_hectare: 12000, unit: 'USD' },
            'agricultural_land': { per_hectare: 3000, unit: 'USD' },
            'freshwater': { per_cubic_meter: 0.001, unit: 'USD' }
        };

        const valueData = marketValues[asset.type];
        if (valueData) {
            const quantity = this.normalizeQuantity(asset.quantity, asset.unit);
            return quantity * (valueData.per_hectare || valueData.per_cubic_meter || 0);
        }

        return 0;
    }

    estimateNonMarketValue(asset) {
        // Estimate non-market values using various methods
        let nonMarketValue = 0;

        // Existence value (people willing to pay for preservation)
        nonMarketValue += this.estimateExistenceValue(asset);

        // Option value (future potential uses)
        nonMarketValue += this.estimateOptionValue(asset);

        // Bequest value (leaving for future generations)
        nonMarketValue += this.estimateBequestValue(asset);

        return nonMarketValue;
    }

    estimateExistenceValue(asset) {
        // Simplified existence value based on conservation status and uniqueness
        const baseValue = 1000; // Base USD per asset
        let multiplier = 1.0;

        if (asset.iucn_status === 'Critically Endangered') multiplier = 5.0;
        else if (asset.iucn_status === 'Endangered') multiplier = 3.0;
        else if (asset.iucn_status === 'Vulnerable') multiplier = 2.0;

        if (asset.endemic === true) multiplier *= 1.5;
        if (asset.ecosystem_engineer === true) multiplier *= 1.3;

        return baseValue * multiplier;
    }

    estimateOptionValue(asset) {
        // Value of keeping options open for future use
        const baseValue = 500;
        let multiplier = 1.0;

        // Higher option value for assets with potential pharmaceutical or technological uses
        if (asset.biotechnological_potential === 'high') multiplier = 3.0;
        else if (asset.biotechnological_potential === 'medium') multiplier = 2.0;

        return baseValue * multiplier;
    }

    estimateBequestValue(asset) {
        // Value of preserving for future generations
        const baseValue = 800;
        let multiplier = 1.0;

        // Higher bequest value for culturally significant assets
        if (asset.cultural_significance === 'high') multiplier = 2.5;
        else if (asset.cultural_significance === 'medium') multiplier = 1.5;

        return baseValue * multiplier;
    }

    assessRiskFactors(asset) {
        const risks = [];

        if (asset.threat_level === 'high') {
            risks.push({
                type: 'habitat_loss',
                probability: 0.8,
                impact: 'severe',
                description: 'High risk of habitat destruction'
            });
        }

        if (asset.climate_vulnerability === 'high') {
            risks.push({
                type: 'climate_change',
                probability: 0.7,
                impact: 'moderate',
                description: 'Vulnerable to climate change impacts'
            });
        }

        if (asset.invasive_species_threat === true) {
            risks.push({
                type: 'invasive_species',
                probability: 0.6,
                impact: 'moderate',
                description: 'Threatened by invasive species'
            });
        }

        return risks;
    }

    async calculateValuation(processedAssets, method, timeHorizon, discountRate, geographicScope) {
        const methodConfig = this.valuationMethods[method];
        const discountRateValue = this.discountRates[discountRate] || 0.05;

        let totalValue = 0;
        const assetValuations = [];

        for (const asset of processedAssets) {
            const assetValuation = this.calculateAssetValuation(
                asset,
                method,
                timeHorizon,
                discountRateValue,
                geographicScope
            );

            assetValuations.push(assetValuation);
            totalValue += assetValuation.present_value;
        }

        return {
            method,
            method_name: methodConfig.name,
            total_present_value: totalValue,
            total_annual_value: totalValue / timeHorizon,
            asset_valuations: assetValuations,
            confidence_interval: this.calculateConfidenceInterval(totalValue, method),
            assumptions: this.getMethodAssumptions(method),
            limitations: methodConfig.limitations
        };
    }

    calculateAssetValuation(asset, method, timeHorizon, discountRate, geographicScope) {
        let annualValue = 0;

        switch (method) {
            case 'market_pricing':
                annualValue = asset.market_value / timeHorizon;
                break;
            case 'replacement_cost':
                annualValue = this.calculateReplacementCost(asset);
                break;
            case 'contingent_valuation':
                annualValue = asset.non_market_value * 0.1; // Willingness to pay
                break;
            case 'hedonic_pricing':
                annualValue = this.calculateHedonicValue(asset, geographicScope);
                break;
            case 'travel_cost':
                annualValue = this.calculateTravelCostValue(asset);
                break;
            case 'benefit_transfer':
                annualValue = this.calculateBenefitTransferValue(asset);
                break;
            default:
                annualValue = asset.market_value / timeHorizon;
        }

        // Calculate present value using discount rate
        const presentValue = this.calculatePresentValue(annualValue, timeHorizon, discountRate);

        return {
            asset_name: asset.name,
            asset_type: asset.type,
            annual_value: annualValue,
            present_value: presentValue,
            discount_rate: discountRate,
            time_horizon: timeHorizon,
            valuation_method: method
        };
    }

    calculateReplacementCost(asset) {
        // Cost of replacing ecosystem services artificially
        const replacementCosts = {
            'wetland': { per_hectare: 15000, unit: 'USD' },
            'coral_reef': { per_hectare: 25000, unit: 'USD' },
            'forest': { per_hectare: 8000, unit: 'USD' }
        };

        const costData = replacementCosts[asset.type];
        if (costData) {
            const quantity = this.normalizeQuantity(asset.quantity, asset.unit);
            return quantity * costData.per_hectare;
        }

        return asset.market_value * 2; // Default: 2x market value
    }

    calculateHedonicValue(asset, geographicScope) {
        // Property value premium from biodiversity proximity
        const hedonicPremiums = {
            'local': 0.05,    // 5% property value increase
            'regional': 0.03, // 3% property value increase
            'national': 0.01  // 1% property value increase
        };

        const premium = hedonicPremiums[geographicScope] || 0.03;
        const affectedProperties = this.estimateAffectedProperties(asset, geographicScope);

        return affectedProperties * 200000 * premium; // Assuming $200k average property value
    }

    calculateTravelCostValue(asset) {
        // Recreation value based on visitor willingness to travel
        const visitorDays = this.estimateVisitorDays(asset);
        const averageTravelCost = 50; // USD per visitor day
        const consumerSurplus = 0.5; // 50% consumer surplus

        return visitorDays * averageTravelCost * (1 + consumerSurplus);
    }

    calculateBenefitTransferValue(asset) {
        // Transfer values from similar studies
        const transferRatios = {
            'forest': 1.2,
            'wetland': 1.5,
            'coral_reef': 2.0,
            'species': 1.8
        };

        const ratio = transferRatios[asset.type] || 1.0;
        return (asset.market_value + asset.non_market_value) * ratio;
    }

    calculatePresentValue(annualValue, timeHorizon, discountRate) {
        if (discountRate === 0) {
            return annualValue * timeHorizon;
        }

        // Present value of annuity formula
        const presentValueFactor = (1 - Math.pow(1 + discountRate, -timeHorizon)) / discountRate;
        return annualValue * presentValueFactor;
    }

    calculateConfidenceInterval(value, method) {
        // Simplified confidence intervals based on method reliability
        const confidenceFactors = {
            'market_pricing': { lower: 0.9, upper: 1.1 },
            'contingent_valuation': { lower: 0.7, upper: 1.4 },
            'hedonic_pricing': { lower: 0.8, upper: 1.3 },
            'travel_cost': { lower: 0.75, upper: 1.35 },
            'replacement_cost': { lower: 0.85, upper: 1.2 },
            'benefit_transfer': { lower: 0.6, upper: 1.6 }
        };

        const factors = confidenceFactors[method] || { lower: 0.8, upper: 1.2 };

        return {
            lower_bound: value * factors.lower,
            upper_bound: value * factors.upper,
            confidence_level: 0.95
        };
    }

    getMethodAssumptions(method) {
        const assumptions = {
            'market_pricing': [
                'All values are captured in market transactions',
                'No externalities or public goods',
                'Perfect market competition'
            ],
            'contingent_valuation': [
                'Respondents understand the valuation scenario',
                'No strategic bias in responses',
                'Survey design captures true willingness to pay'
            ],
            'hedonic_pricing': [
                'Property markets are efficient',
                'Biodiversity proximity is correctly measured',
                'No omitted variable bias'
            ]
        };

        return assumptions[method] || ['Standard economic valuation assumptions apply'];
    }

    estimateAffectedProperties(asset, geographicScope) {
        const propertyCounts = {
            'local': 1000,
            'regional': 10000,
            'national': 100000
        };

        return propertyCounts[geographicScope] || 10000;
    }

    estimateVisitorDays(asset) {
        const visitorEstimates = {
            'national_park': 50000,
            'wildlife_sanctuary': 25000,
            'marine_protected_area': 15000,
            'forest_reserve': 10000
        };

        return visitorEstimates[asset.type] || 10000;
    }

    performBenefitCostAnalysis(valuations, processedAssets, timeHorizon, discountRate) {
        const discountRateValue = this.discountRates[discountRate] || 0.05;

        // Calculate total benefits
        const totalBenefits = Object.values(valuations).reduce((sum, valuation) => {
            return sum + valuation.total_present_value;
        }, 0);

        // Estimate costs (conservation, monitoring, etc.)
        const totalCosts = this.estimateConservationCosts(processedAssets, timeHorizon, discountRateValue);

        // Calculate benefit-cost ratio
        const bcr = totalCosts > 0 ? totalBenefits / totalCosts : 0;

        // Calculate net present value
        const npv = totalBenefits - totalCosts;

        // Calculate internal rate of return (simplified)
        const irr = this.calculateIRR(totalBenefits, totalCosts, timeHorizon);

        return {
            total_benefits: totalBenefits,
            total_costs: totalCosts,
            net_present_value: npv,
            benefit_cost_ratio: bcr,
            internal_rate_of_return: irr,
            payback_period: this.calculatePaybackPeriod(totalBenefits, totalCosts, timeHorizon),
            sensitivity_analysis: this.performSimpleSensitivityAnalysis(totalBenefits, totalCosts)
        };
    }

    estimateConservationCosts(processedAssets, timeHorizon, discountRate) {
        let totalCosts = 0;

        for (const asset of processedAssets) {
            // Base conservation cost per hectare/year
            const baseCostPerHectare = 500; // USD
            const quantity = this.normalizeQuantity(asset.quantity, asset.unit);

            // Annual cost
            const annualCost = quantity * baseCostPerHectare;

            // Present value of costs
            const presentValueCost = this.calculatePresentValue(annualCost, timeHorizon, discountRate);
            totalCosts += presentValueCost;
        }

        return totalCosts;
    }

    calculateIRR(benefits, costs, timeHorizon) {
        // Simplified IRR calculation
        const netCashFlow = benefits - costs;

        if (netCashFlow <= 0) return 0;

        // Approximate IRR using simple formula
        const averageAnnualReturn = netCashFlow / timeHorizon;
        const initialInvestment = costs / timeHorizon;

        return initialInvestment > 0 ? averageAnnualReturn / initialInvestment : 0;
    }

    calculatePaybackPeriod(benefits, costs, timeHorizon) {
        const annualBenefits = benefits / timeHorizon;
        const annualCosts = costs / timeHorizon;

        if (annualBenefits <= annualCosts) return timeHorizon; // Never pays back

        return annualCosts / (annualBenefits - annualCosts);
    }

    performSimpleSensitivityAnalysis(benefits, costs) {
        const scenarios = [
            { name: 'pessimistic', benefit_multiplier: 0.8, cost_multiplier: 1.2 },
            { name: 'base_case', benefit_multiplier: 1.0, cost_multiplier: 1.0 },
            { name: 'optimistic', benefit_multiplier: 1.2, cost_multiplier: 0.8 }
        ];

        return scenarios.map(scenario => ({
            scenario: scenario.name,
            npv: (benefits * scenario.benefit_multiplier) - (costs * scenario.cost_multiplier),
            bcr: (benefits * scenario.benefit_multiplier) / (costs * scenario.cost_multiplier)
        }));
    }

    performSensitivityAnalysis(valuations, processedAssets, timeHorizon) {
        const sensitivityTests = [];

        // Test different discount rates
        const discountRateTests = [0.02, 0.05, 0.08];
        for (const rate of discountRateTests) {
            const testValuations = {};
            for (const [method, valuation] of Object.entries(valuations)) {
                testValuations[method] = {
                    ...valuation,
                    total_present_value: this.recalculateWithDiscountRate(valuation, rate)
                };
            }

            const testBCA = this.performBenefitCostAnalysis(testValuations, processedAssets, timeHorizon, 'custom');

            sensitivityTests.push({
                parameter: 'discount_rate',
                value: rate,
                results: testBCA
            });
        }

        // Test different time horizons
        const timeHorizonTests = [20, 30, 50];
        for (const horizon of timeHorizonTests) {
            const testBCA = this.performBenefitCostAnalysis(valuations, processedAssets, horizon, 'moderate');
            sensitivityTests.push({
                parameter: 'time_horizon',
                value: horizon,
                results: testBCA
            });
        }

        return {
            sensitivity_tests: sensitivityTests,
            most_sensitive_parameter: this.identifyMostSensitiveParameter(sensitivityTests),
            recommendations: this.generateSensitivityRecommendations(sensitivityTests)
        };
    }

    recalculateWithDiscountRate(valuation, newRate) {
        // Simplified recalculation
        const annualValue = valuation.total_present_value / valuation.time_horizon;
        return this.calculatePresentValue(annualValue, valuation.time_horizon, newRate);
    }

    identifyMostSensitiveParameter(sensitivityTests) {
        // Find parameter with largest NPV variation
        const parameterVariations = {};

        for (const test of sensitivityTests) {
            const param = test.parameter;
            if (!parameterVariations[param]) {
                parameterVariations[param] = [];
            }
            parameterVariations[param].push(test.results.net_present_value);
        }

        let mostSensitive = null;
        let maxVariation = 0;

        for (const [param, values] of Object.entries(parameterVariations)) {
            const variation = Math.max(...values) - Math.min(...values);
            if (variation > maxVariation) {
                maxVariation = variation;
                mostSensitive = param;
            }
        }

        return mostSensitive;
    }

    generateSensitivityRecommendations(sensitivityTests) {
        const recommendations = [];

        const mostSensitive = this.identifyMostSensitiveParameter(sensitivityTests);
        if (mostSensitive === 'discount_rate') {
            recommendations.push('Results are sensitive to discount rate choice - consider using social discount rates for conservation projects');
        } else if (mostSensitive === 'time_horizon') {
            recommendations.push('Long-term benefits are significant - ensure adequate time horizon for biodiversity valuation');
        }

        // Check for robust results
        const baseCase = sensitivityTests.find(t => t.parameter === 'discount_rate' && t.value === 0.05);
        if (baseCase && baseCase.results.benefit_cost_ratio > 1.5) {
            recommendations.push('Strong benefit-cost ratio is robust across sensitivity tests');
        }

        return recommendations;
    }

    analyzeStakeholderImpacts(valuations, stakeholderGroups, geographicScope) {
        const stakeholderAnalysis = {};

        for (const group of stakeholderGroups) {
            stakeholderAnalysis[group] = {
                benefits: this.calculateStakeholderBenefits(valuations, group, geographicScope),
                costs: this.calculateStakeholderCosts(valuations, group, geographicScope),
                net_impact: 0, // Will be calculated
                distribution: this.analyzeBenefitDistribution(valuations, group)
            };

            // Calculate net impact
            stakeholderAnalysis[group].net_impact =
                stakeholderAnalysis[group].benefits - stakeholderAnalysis[group].costs;
        }

        return {
            stakeholder_impacts: stakeholderAnalysis,
            equity_analysis: this.performEquityAnalysis(stakeholderAnalysis),
            redistribution_recommendations: this.generateRedistributionRecommendations(stakeholderAnalysis)
        };
    }

    calculateStakeholderBenefits(valuations, stakeholderGroup, geographicScope) {
        // Different stakeholder groups receive different types of benefits
        const benefitMultipliers = {
            'general_public': {
                'contingent_valuation': 1.0,
                'hedonic_pricing': 0.8,
                'travel_cost': 0.6
            },
            'industries': {
                'market_pricing': 1.0,
                'replacement_cost': 0.7,
                'benefit_transfer': 0.5
            },
            'government': {
                'inclusive_wealth': 1.0,
                'tebv': 0.9,
                'contingent_valuation': 0.6
            },
            'local_communities': {
                'market_pricing': 0.8,
                'travel_cost': 1.0,
                'contingent_valuation': 0.9
            }
        };

        const multipliers = benefitMultipliers[stakeholderGroup] || {};
        let totalBenefits = 0;

        for (const [method, valuation] of Object.entries(valuations)) {
            const multiplier = multipliers[method] || 0.5;
            totalBenefits += valuation.total_present_value * multiplier;
        }

        // Geographic scope adjustment
        const scopeMultipliers = {
            'local': 1.0,
            'regional': 0.7,
            'national': 0.4,
            'global': 0.2
        };

        return totalBenefits * (scopeMultipliers[geographicScope] || 0.5);
    }

    calculateStakeholderCosts(valuations, stakeholderGroup, geographicScope) {
        // Costs are distributed differently among stakeholders
        const costShares = {
            'general_public': 0.3,    // Through taxes
            'industries': 0.4,        // Through regulations
            'government': 0.8,        // Implementation costs
            'local_communities': 0.6  // Opportunity costs
        };

        const totalValue = Object.values(valuations).reduce((sum, v) => sum + v.total_present_value, 0);
        const costShare = costShares[stakeholderGroup] || 0.5;

        return totalValue * costShare * 0.1; // Assume 10% of total value as costs
    }

    analyzeBenefitDistribution(valuations, stakeholderGroup) {
        // Analyze how benefits are distributed across different valuation methods
        const distribution = {};

        for (const [method, valuation] of Object.entries(valuations)) {
            distribution[method] = {
                value: valuation.total_present_value,
                percentage: 0, // Will be calculated
                stakeholder_relevance: this.getStakeholderRelevance(method, stakeholderGroup)
            };
        }

        // Calculate percentages
        const totalValue = Object.values(distribution).reduce((sum, d) => sum + d.value, 0);
        for (const method of Object.keys(distribution)) {
            distribution[method].percentage = (distribution[method].value / totalValue) * 100;
        }

        return distribution;
    }

    getStakeholderRelevance(method, stakeholderGroup) {
        const relevanceMatrix = {
            'general_public': {
                'contingent_valuation': 'high',
                'hedonic_pricing': 'medium',
                'travel_cost': 'medium'
            },
            'industries': {
                'market_pricing': 'high',
                'replacement_cost': 'medium',
                'benefit_transfer': 'low'
            },
            'government': {
                'inclusive_wealth': 'high',
                'tebv': 'high',
                'contingent_valuation': 'medium'
            }
        };

        return relevanceMatrix[stakeholderGroup]?.[method] || 'low';
    }

    performEquityAnalysis(stakeholderAnalysis) {
        const impacts = Object.values(stakeholderAnalysis);
        const netImpacts = impacts.map(s => s.net_impact);

        return {
            gini_coefficient: this.calculateGiniCoefficient(netImpacts),
            palma_ratio: this.calculatePalmaRatio(netImpacts),
            equity_assessment: this.assessEquity(netImpacts),
            redistribution_needed: this.assessRedistributionNeed(netImpacts)
        };
    }

    calculateGiniCoefficient(values) {
        // Simplified Gini coefficient calculation
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        let sum = 0;

        for (let i = 0; i < n; i++) {
            sum += (i + 1) * sorted[i];
        }

        const mean = values.reduce((a, b) => a + b, 0) / n;
        return mean > 0 ? (2 * sum) / (n * n * mean) - (n + 1) / n : 0;
    }

    calculatePalmaRatio(values) {
        // Palma ratio: ratio of richest 10% to poorest 40%
        const sorted = [...values].sort((a, b) => b - a);
        const top10Percent = sorted.slice(0, Math.ceil(sorted.length * 0.1));
        const bottom40Percent = sorted.slice(-Math.ceil(sorted.length * 0.4));

        const topAverage = top10Percent.reduce((a, b) => a + b, 0) / top10Percent.length;
        const bottomAverage = bottom40Percent.reduce((a, b) => a + b, 0) / bottom40Percent.length;

        return bottomAverage > 0 ? topAverage / bottomAverage : 0;
    }

    assessEquity(netImpacts) {
        const gini = this.calculateGiniCoefficient(netImpacts);

        if (gini < 0.2) return 'high_equity';
        if (gini < 0.35) return 'moderate_equity';
        if (gini < 0.5) return 'low_equity';
        return 'very_low_equity';
    }

    assessRedistributionNeed(netImpacts) {
        const palmaRatio = this.calculatePalmaRatio(netImpacts);
        return palmaRatio > 2.0; // Significant inequality if top 10% have more than 2x the bottom 40%
    }

    generateRedistributionRecommendations(stakeholderAnalysis) {
        const recommendations = [];
        const equityAnalysis = this.performEquityAnalysis(stakeholderAnalysis);

        if (equityAnalysis.redistribution_needed) {
            recommendations.push('Implement benefit-sharing mechanisms to address stakeholder equity');
            recommendations.push('Consider payment for ecosystem services (PES) programs');
            recommendations.push('Develop community-based conservation initiatives');
        }

        // Identify stakeholders with negative net impacts
        const negativeImpactStakeholders = Object.entries(stakeholderAnalysis)
            .filter(([_, analysis]) => analysis.net_impact < 0)
            .map(([stakeholder]) => stakeholder);

        if (negativeImpactStakeholders.length > 0) {
            recommendations.push(`Provide compensation mechanisms for: ${negativeImpactStakeholders.join(', ')}`);
        }

        return recommendations;
    }

    generateEconomicReport(processedAssets, valuations, benefitCostAnalysis, sensitivityAnalysis, stakeholderAnalysis, timeHorizon, currency) {
        const totalValue = Object.values(valuations).reduce((sum, v) => sum + v.total_present_value, 0);

        const report = {
            title: `Biodiversity Economic Valuation Report - ${timeHorizon} Year Analysis`,
            executive_summary: {
                total_economic_value: this.convertCurrency(totalValue, 'USD', currency),
                currency: currency,
                time_horizon: timeHorizon,
                valuation_methods_used: Object.keys(valuations),
                key_findings: this.generateKeyFindings(valuations, benefitCostAnalysis),
                policy_recommendations: this.generatePolicyRecommendations(valuations, benefitCostAnalysis)
            },
            methodology: {
                valuation_methods: Object.keys(valuations).map(method => ({
                    method,
                    name: this.valuationMethods[method].name,
                    description: this.valuationMethods[method].description,
                    assumptions: this.getMethodAssumptions(method),
                    limitations: this.valuationMethods[method].limitations
                })),
                discount_rate: 'moderate (5%)',
                geographic_scope: 'regional',
                confidence_intervals: '95% for all estimates'
            },
            results: {
                asset_valuations: processedAssets.map(asset => ({
                    name: asset.name,
                    type: asset.type,
                    economic_sector: asset.economic_sector,
                    market_value: this.convertCurrency(asset.market_value, 'USD', currency),
                    non_market_value: this.convertCurrency(asset.non_market_value, 'USD', currency),
                    total_value: this.convertCurrency(asset.market_value + asset.non_market_value, 'USD', currency)
                })),
                method_comparison: Object.entries(valuations).map(([method, valuation]) => ({
                    method: method,
                    method_name: this.valuationMethods[method].name,
                    total_value: this.convertCurrency(valuation.total_present_value, 'USD', currency),
                    confidence_interval: {
                        lower: this.convertCurrency(valuation.confidence_interval.lower_bound, 'USD', currency),
                        upper: this.convertCurrency(valuation.confidence_interval.upper_bound, 'USD', currency)
                    }
                })),
                benefit_cost_analysis: {
                    ...benefitCostAnalysis,
                    total_benefits: this.convertCurrency(benefitCostAnalysis.total_benefits, 'USD', currency),
                    total_costs: this.convertCurrency(benefitCostAnalysis.total_costs, 'USD', currency),
                    net_present_value: this.convertCurrency(benefitCostAnalysis.net_present_value, 'USD', currency)
                }
            },
            sensitivity_analysis: sensitivityAnalysis,
            stakeholder_analysis: stakeholderAnalysis,
            uncertainty_analysis: {
                confidence_levels: '95% for all estimates',
                sensitivity_to_parameters: sensitivityAnalysis.most_sensitive_parameter,
                robustness_assessment: this.assessOverallRobustness(valuations, benefitCostAnalysis)
            },
            appendices: {
                detailed_valuations: valuations,
                raw_data: processedAssets,
                methodological_details: this.generateMethodologicalDetails()
            }
        };

        return report;
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        const fromRate = this.currencyRates[fromCurrency] || 1.0;
        const toRate = this.currencyRates[toCurrency] || 1.0;

        return (amount / fromRate) * toRate;
    }

    generateKeyFindings(valuations, benefitCostAnalysis) {
        const findings = [];
        const totalValue = Object.values(valuations).reduce((sum, v) => sum + v.total_present_value, 0);

        findings.push(`Total economic value of biodiversity assets: $${totalValue.toLocaleString()}`);

        if (benefitCostAnalysis.benefit_cost_ratio > 1) {
            findings.push(`Positive benefit-cost ratio of ${benefitCostAnalysis.benefit_cost_ratio.toFixed(2)}`);
        }

        if (benefitCostAnalysis.net_present_value > 0) {
            findings.push(`Positive net present value: $${benefitCostAnalysis.net_present_value.toLocaleString()}`);
        }

        const methodValues = Object.entries(valuations).map(([method, v]) => ({
            method: this.valuationMethods[method].name,
            value: v.total_present_value
        })).sort((a, b) => b.value - a.value);

        if (methodValues.length > 1) {
            findings.push(`Highest valuation from ${methodValues[0].method} method`);
        }

        return findings;
    }

    generatePolicyRecommendations(valuations, benefitCostAnalysis) {
        const recommendations = [];

        if (benefitCostAnalysis.benefit_cost_ratio > 1.5) {
            recommendations.push('Strong economic case for biodiversity conservation investments');
        }

        if (benefitCostAnalysis.payback_period < 10) {
            recommendations.push('Short payback period supports rapid implementation');
        }

        const nonMarketValue = valuations.contingent_valuation?.total_present_value || 0;
        const marketValue = valuations.market_pricing?.total_present_value || 0;

        if (nonMarketValue > marketValue) {
            recommendations.push('Significant non-market values suggest need for comprehensive valuation approaches');
        }

        return recommendations;
    }

    assessOverallRobustness(valuations, benefitCostAnalysis) {
        let robustnessScore = 1.0;

        // Reduce score based on various factors
        if (benefitCostAnalysis.benefit_cost_ratio < 1.2) robustnessScore -= 0.2;
        if (Object.keys(valuations).length < 3) robustnessScore -= 0.1;

        // Check confidence interval widths
        for (const valuation of Object.values(valuations)) {
            const ciWidth = valuation.confidence_interval.upper_bound - valuation.confidence_interval.lower_bound;
            const relativeWidth = ciWidth / valuation.total_present_value;
            if (relativeWidth > 0.5) robustnessScore -= 0.1;
        }

        if (robustnessScore > 0.8) return 'high_robustness';
        if (robustnessScore > 0.6) return 'moderate_robustness';
        if (robustnessScore > 0.4) return 'low_robustness';
        return 'very_low_robustness';
    }

    generateMethodologicalDetails() {
        return {
            valuation_frameworks: Object.entries(this.valuationMethods).map(([id, method]) => ({
                id,
                ...method
            })),
            economic_sectors: Object.entries(this.economicSectors).map(([id, sector]) => ({
                id,
                ...sector
            })),
            discount_rates: this.discountRates,
            currency_conversion_rates: this.currencyRates,
            statistical_assumptions: [
                'Normal distribution of valuation estimates',
                'Independence of valuation methods',
                'Stationarity of economic values over time',
                'No systematic bias in valuation methods'
            ]
        };
    }

    async updateModelStatus(modelId, status) {
        const statusFile = path.join(this.economicDataPath, modelId, 'status.json');
        const currentStatus = this.activeModels.get(modelId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeModels.set(modelId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating economic model status:', error);
        }

        return newStatus;
    }

    async getModelStatus(modelId) {
        if (this.activeModels.has(modelId)) {
            return this.activeModels.get(modelId);
        }

        try {
            const statusFile = path.join(this.economicDataPath, modelId, 'status.json');
            const statusData = await fs.readFile(statusFile, 'utf8');
            const status = JSON.parse(statusData);
            this.activeModels.set(status);
            return status;
        } catch (error) {
            return null;
        }
    }

    generateModelId() {
        return `economic_model_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableMethods() {
        return Object.keys(this.valuationMethods).map(key => ({
            id: key,
            ...this.valuationMethods[key]
        }));
    }

    getAvailableSectors() {
        return Object.keys(this.economicSectors).map(key => ({
            id: key,
            ...this.economicSectors[key]
        }));
    }
}

// Initialize economic modeling service
const economicModelingService = new EconomicModelingService();

// Routes
router.get('/methods', verifyToken, async (req, res) => {
    try {
        res.json({
            methods: economicModelingService.getAvailableMethods(),
            sectors: economicModelingService.getAvailableSectors(),
            discount_rates: economicModelingService.discountRates,
            currencies: Object.keys(economicModelingService.currencyRates),
            total_methods: Object.keys(economicModelingService.valuationMethods).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/valuate', verifyToken, async (req, res) => {
    try {
        const {
            biodiversity_assets,
            valuation_methods = ['market_pricing', 'contingent_valuation'],
            time_horizon = 50,
            discount_rate = 'moderate',
            currency = 'USD',
            geographic_scope = 'local',
            stakeholder_groups = ['general_public', 'industries', 'government']
        } = req.body;

        if (!biodiversity_assets) {
            return res.status(400).json({ error: 'Biodiversity assets are required' });
        }

        const modelId = economicModelingService.generateModelId();

        // Start economic valuation asynchronously
        economicModelingService.runEconomicValuation(modelId, {
            biodiversity_assets,
            valuation_methods,
            time_horizon,
            discount_rate,
            currency,
            geographic_scope,
            stakeholder_groups
        }).catch(error => {
            console.error(`Economic valuation ${modelId} failed:`, error);
        });

        res.json({
            success: true,
            modelId,
            message: 'Economic valuation started',
            valuation_methods,
            time_horizon,
            currency
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
