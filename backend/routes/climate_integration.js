const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Climate Integration Service for IPCC Climate Models and Biodiversity Impact Assessment
class ClimateIntegrationService {
    constructor() {
        this.climateDataPath = path.join(__dirname, '../reports/climate_data');
        this.activeAssessments = new Map();
        this.initializeClimateDataDirectory();

        // IPCC climate scenarios
        this.climateScenarios = {
            'ssp1_1_9': {
                name: 'SSP1-1.9 (Sustainability)',
                description: 'Low emissions scenario with strong sustainability focus',
                temperature_increase: 1.4,
                co2_concentration: 400,
                sea_level_rise: 0.3,
                description_long: 'Sustainable development with low population growth, high education, strong institutions'
            },
            'ssp1_2_6': {
                name: 'SSP1-2.6 (Low Emissions)',
                description: 'Low emissions scenario with rapid technological change',
                temperature_increase: 1.8,
                co2_concentration: 450,
                sea_level_rise: 0.4,
                description_long: 'Strong mitigation policies with rapid technological innovation'
            },
            'ssp2_4_5': {
                name: 'SSP2-4.5 (Middle of the Road)',
                description: 'Moderate emissions scenario with current trends',
                temperature_increase: 2.7,
                co2_concentration: 550,
                sea_level_rise: 0.6,
                description_long: 'Continued current trends with moderate mitigation efforts'
            },
            'ssp3_7_0': {
                name: 'SSP3-7.0 (Regional Rivalry)',
                description: 'High emissions scenario with regional conflicts',
                temperature_increase: 4.4,
                co2_concentration: 800,
                sea_level_rise: 1.0,
                description_long: 'High population growth, slow technological development, regional conflicts'
            },
            'ssp5_8_5': {
                name: 'SSP5-8.5 (Fossil-Fueled Development)',
                description: 'High emissions scenario with fossil fuel dominance',
                temperature_increase: 4.4,
                co2_concentration: 1200,
                sea_level_rise: 0.8,
                description_long: 'High fossil fuel use, rapid technological development, high economic growth'
            }
        };

        // Biodiversity vulnerability categories
        this.vulnerabilityCategories = {
            'extremely_vulnerable': {
                threshold: 0.8,
                species: ['coral_reef_species', 'arctic_species', 'mountain_species'],
                description: 'Species with >80% habitat loss risk'
            },
            'highly_vulnerable': {
                threshold: 0.6,
                species: ['coastal_species', 'tropical_species', 'endemic_species'],
                description: 'Species with 60-80% habitat loss risk'
            },
            'moderately_vulnerable': {
                threshold: 0.4,
                species: ['temperate_species', 'generalist_species'],
                description: 'Species with 40-60% habitat loss risk'
            },
            'low_vulnerability': {
                threshold: 0.2,
                species: ['cosmopolitan_species', 'adaptive_species'],
                description: 'Species with <40% habitat loss risk'
            }
        };

        // Climate impact models
        this.impactModels = {
            'species_distribution': {
                name: 'Species Distribution Modeling',
                description: 'Predict species range shifts under climate change',
                inputs: ['current_distribution', 'climate_variables', 'species_traits'],
                outputs: ['future_distribution', 'range_shift_distance', 'habitat_loss_percentage']
            },
            'phenology_modeling': {
                name: 'Phenology Modeling',
                description: 'Predict changes in species life cycle timing',
                inputs: ['phenological_data', 'temperature_records', 'species_characteristics'],
                outputs: ['timing_shifts', 'mismatch_risks', 'adaptation_potential']
            },
            'ocean_acidification': {
                name: 'Ocean Acidification Impact',
                description: 'Model marine species response to ocean acidification',
                inputs: ['ocean_ph_data', 'species_sensitivity', 'calcification_rates'],
                outputs: ['survival_rates', 'calcification_impacts', 'population_decline']
            },
            'extreme_events': {
                name: 'Extreme Weather Events',
                description: 'Assess impacts of heatwaves, droughts, and storms',
                inputs: ['weather_extremes', 'species_tolerance', 'recovery_rates'],
                outputs: ['mortality_rates', 'population_impacts', 'recovery_times']
            }
        };
    }

    async initializeClimateDataDirectory() {
        try {
            await fs.mkdir(this.climateDataPath, { recursive: true });
        } catch (error) {
            console.error('Climate data directory initialization error:', error);
        }
    }

    async runClimateImpactAssessment(assessmentId, params) {
        const {
            species_data,
            location_coordinates,
            climate_scenario = 'ssp2_4_5',
            time_horizon = 2050,
            impact_models = ['species_distribution', 'phenology_modeling']
        } = params;

        try {
            await this.updateAssessmentStatus(assessmentId, {
                status: 'running',
                stage: 'initialization',
                climate_scenario,
                time_horizon,
                startTime: new Date().toISOString(),
                progress: 0
            });

            // Validate inputs
            const validation = this.validateClimateAssessmentInputs(species_data, location_coordinates, climate_scenario);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            await this.updateAssessmentStatus(assessmentId, {
                stage: 'fetching_climate_data',
                progress: 10
            });

            // Fetch climate projection data
            const climateData = await this.fetchClimateProjectionData(location_coordinates, climate_scenario, time_horizon);

            await this.updateAssessmentStatus(assessmentId, {
                stage: 'running_impact_models',
                progress: 30
            });

            // Run impact models
            const impactResults = {};
            for (const model of impact_models) {
                impactResults[model] = await this.runImpactModel(model, species_data, climateData, time_horizon);
            }

            await this.updateAssessmentStatus(assessmentId, {
                stage: 'calculating_vulnerability',
                progress: 70
            });

            // Calculate vulnerability scores
            const vulnerabilityAssessment = this.calculateVulnerabilityScores(species_data, impactResults);

            // Generate adaptation strategies
            const adaptationStrategies = this.generateAdaptationStrategies(vulnerabilityAssessment, climate_scenario);

            await this.updateAssessmentStatus(assessmentId, {
                stage: 'generating_report',
                progress: 90
            });

            // Generate comprehensive report
            const report = this.generateClimateImpactReport(
                species_data,
                climateData,
                impactResults,
                vulnerabilityAssessment,
                adaptationStrategies,
                time_horizon
            );

            await this.updateAssessmentStatus(assessmentId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: {
                    climate_data: climateData,
                    impact_results: impactResults,
                    vulnerability_assessment: vulnerabilityAssessment,
                    adaptation_strategies: adaptationStrategies,
                    report: report
                }
            });

            return {
                climate_data: climateData,
                impact_results: impactResults,
                vulnerability_assessment: vulnerabilityAssessment,
                adaptation_strategies: adaptationStrategies,
                report: report
            };

        } catch (error) {
            await this.updateAssessmentStatus(assessmentId, {
                status: 'failed',
                stage: 'error',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    validateClimateAssessmentInputs(speciesData, coordinates, scenario) {
        if (!speciesData || !Array.isArray(speciesData) || speciesData.length === 0) {
            return { valid: false, error: 'Species data array is required and cannot be empty' };
        }

        if (!coordinates || !coordinates.lat || !coordinates.lon) {
            return { valid: false, error: 'Location coordinates (lat, lon) are required' };
        }

        if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lon < -180 || coordinates.lon > 180) {
            return { valid: false, error: 'Invalid coordinates' };
        }

        if (!this.climateScenarios[scenario]) {
            return { valid: false, error: `Unknown climate scenario: ${scenario}` };
        }

        // Validate species data structure
        for (const species of speciesData) {
            if (!species.name || !species.scientific_name) {
                return { valid: false, error: 'Each species must have name and scientific_name' };
            }
        }

        return { valid: true };
    }

    async fetchClimateProjectionData(coordinates, scenario, timeHorizon) {
        // Simulate fetching climate projection data
        // In practice, this would connect to IPCC data repositories or climate APIs

        const scenarioData = this.climateScenarios[scenario];
        const baselineYear = 2020;
        const targetYear = timeHorizon;

        // Generate realistic climate projections based on IPCC scenarios
        const temperatureProjection = this.generateTemperatureProjection(
            coordinates, scenarioData.temperature_increase, baselineYear, targetYear
        );

        const precipitationProjection = this.generatePrecipitationProjection(
            coordinates, scenario, baselineYear, targetYear
        );

        const seaLevelProjection = this.generateSeaLevelProjection(
            coordinates, scenarioData.sea_level_rise, baselineYear, targetYear
        );

        return {
            scenario: scenario,
            scenario_name: scenarioData.name,
            location: coordinates,
            time_period: { baseline: baselineYear, target: targetYear },
            projections: {
                temperature: temperatureProjection,
                precipitation: precipitationProjection,
                sea_level: seaLevelProjection,
                extreme_events: this.generateExtremeEventsProjection(scenario, coordinates)
            },
            confidence_level: 'medium', // Based on IPCC confidence ratings
            data_sources: ['IPCC_AR6', 'CMIP6_models', 'Regional_climate_models']
        };
    }

    generateTemperatureProjection(coordinates, totalIncrease, baselineYear, targetYear) {
        const years = [];
        const temperatures = [];
        const yearsDiff = targetYear - baselineYear;

        // Use sigmoid curve for realistic warming trajectory
        for (let year = baselineYear; year <= targetYear; year++) {
            const progress = (year - baselineYear) / yearsDiff;
            // Sigmoid function for gradual increase accelerating over time
            const sigmoidProgress = 1 / (1 + Math.exp(-6 * (progress - 0.5)));
            const temperatureIncrease = totalIncrease * sigmoidProgress;

            years.push(year);
            temperatures.push(15 + coordinates.lat * 0.1 + temperatureIncrease); // Base temperature + lat effect + warming
        }

        return {
            years: years,
            temperatures_celsius: temperatures,
            total_increase_celsius: totalIncrease,
            rate_per_decade: totalIncrease / (yearsDiff / 10)
        };
    }

    generatePrecipitationProjection(coordinates, scenario, baselineYear, targetYear) {
        const years = [];
        const precipitation = [];
        const baselinePrecipitation = this.getBaselinePrecipitation(coordinates);

        // Precipitation changes vary by scenario and region
        const precipitationMultiplier = this.getPrecipitationMultiplier(scenario, coordinates);

        for (let year = baselineYear; year <= targetYear; year++) {
            const progress = (year - baselineYear) / (targetYear - baselineYear);
            const adjustedPrecipitation = baselinePrecipitation * (1 + precipitationMultiplier * progress);

            years.push(year);
            precipitation.push(adjustedPrecipitation);
        }

        return {
            years: years,
            precipitation_mm_per_year: precipitation,
            baseline_precipitation: baselinePrecipitation,
            change_percentage: precipitationMultiplier * 100
        };
    }

    getBaselinePrecipitation(coordinates) {
        // Simplified precipitation model based on latitude
        const absLat = Math.abs(coordinates.lat);
        if (absLat < 10) return 2000; // Tropical
        if (absLat < 30) return 800;  // Subtropical
        if (absLat < 50) return 600;  // Temperate
        if (absLat < 70) return 400;  // Subarctic
        return 200; // Arctic
    }

    getPrecipitationMultiplier(scenario, coordinates) {
        // Precipitation changes based on scenario and latitude
        const baseMultiplier = {
            'ssp1_1_9': -0.05,  // Slight decrease in low emissions
            'ssp1_2_6': -0.03,  // Minimal change
            'ssp2_4_5': 0.02,   // Slight increase
            'ssp3_7_0': 0.08,   // Moderate increase
            'ssp5_8_5': 0.12    // Significant increase
        }[scenario] || 0;

        // Latitude-based modification (more extreme at poles)
        const latModifier = Math.abs(coordinates.lat) / 90;
        return baseMultiplier * (1 + latModifier * 0.5);
    }

    generateSeaLevelProjection(coordinates, totalRise, baselineYear, targetYear) {
        const years = [];
        const seaLevels = [];

        for (let year = baselineYear; year <= targetYear; year++) {
            const progress = (year - baselineYear) / (targetYear - baselineYear);
            // Sea level rise accelerates over time
            const accelerationFactor = 1 + progress * 0.5;
            const seaLevelRise = totalRise * progress * accelerationFactor;

            years.push(year);
            seaLevels.push(seaLevelRise);
        }

        return {
            years: years,
            sea_level_rise_meters: seaLevels,
            total_rise_meters: totalRise,
            acceleration_factor: 1.25 // Average acceleration
        };
    }

    generateExtremeEventsProjection(scenario, coordinates) {
        // Generate projections for extreme weather events
        const scenarioMultipliers = {
            'ssp1_1_9': { heatwaves: 1.2, droughts: 1.1, storms: 1.1 },
            'ssp1_2_6': { heatwaves: 1.5, droughts: 1.3, storms: 1.2 },
            'ssp2_4_5': { heatwaves: 2.0, droughts: 1.8, storms: 1.5 },
            'ssp3_7_0': { heatwaves: 2.5, droughts: 2.2, storms: 1.8 },
            'ssp5_8_5': { heatwaves: 3.0, droughts: 2.5, storms: 2.0 }
        };

        const multipliers = scenarioMultipliers[scenario] || { heatwaves: 1.5, droughts: 1.3, storms: 1.2 };

        return {
            heatwave_frequency_multiplier: multipliers.heatwaves,
            drought_frequency_multiplier: multipliers.droughts,
            storm_intensity_multiplier: multipliers.storms,
            flood_risk_increase: multipliers.storms * 1.3,
            wildfire_risk_increase: multipliers.heatwaves * 1.2
        };
    }

    async runImpactModel(modelName, speciesData, climateData, timeHorizon) {
        const model = this.impactModels[modelName];
        if (!model) {
            throw new Error(`Unknown impact model: ${modelName}`);
        }

        // Simulate running the impact model
        const results = {};

        for (const species of speciesData) {
            results[species.scientific_name] = this.calculateSpeciesImpact(
                species, climateData, modelName, timeHorizon
            );
        }

        return {
            model_name: modelName,
            model_description: model.description,
            species_impacts: results,
            summary_statistics: this.calculateImpactSummary(results)
        };
    }

    calculateSpeciesImpact(species, climateData, modelName, timeHorizon) {
        // Calculate species-specific climate impacts
        const baseVulnerability = this.getSpeciesVulnerability(species);
        const climateStressors = this.calculateClimateStressors(species, climateData, timeHorizon);

        let impactScore = 0;
        let adaptationPotential = 0;

        switch (modelName) {
            case 'species_distribution':
                impactScore = this.calculateDistributionImpact(species, climateData, timeHorizon);
                adaptationPotential = this.calculateMigrationPotential(species);
                break;
            case 'phenology_modeling':
                impactScore = this.calculatePhenologyImpact(species, climateData);
                adaptationPotential = this.calculatePhenologicalPlasticity(species);
                break;
            case 'ocean_acidification':
                impactScore = this.calculateAcidificationImpact(species, climateData);
                adaptationPotential = this.calculateAcidificationTolerance(species);
                break;
            case 'extreme_events':
                impactScore = this.calculateExtremeEventsImpact(species, climateData);
                adaptationPotential = this.calculateExtremeTolerance(species);
                break;
        }

        return {
            species_name: species.name,
            scientific_name: species.scientific_name,
            impact_score: Math.min(impactScore, 1.0), // 0-1 scale
            adaptation_potential: Math.min(adaptationPotential, 1.0),
            vulnerability_category: this.classifyVulnerability(impactScore),
            climate_stressors: climateStressors,
            recommended_actions: this.generateSpeciesRecommendations(species, impactScore, adaptationPotential)
        };
    }

    getSpeciesVulnerability(species) {
        // Simplified vulnerability assessment based on species traits
        let vulnerability = 0.5; // Base vulnerability

        // Habitat specificity increases vulnerability
        if (species.habitat_specificity === 'high') vulnerability += 0.2;
        if (species.habitat_specificity === 'low') vulnerability -= 0.1;

        // Geographic range affects vulnerability
        if (species.geographic_range === 'narrow') vulnerability += 0.2;
        if (species.geographic_range === 'wide') vulnerability -= 0.1;

        // Life history traits
        if (species.generation_time === 'long') vulnerability += 0.1;
        if (species.dispersal_ability === 'low') vulnerability += 0.15;

        return Math.max(0, Math.min(1, vulnerability));
    }

    calculateClimateStressors(species, climateData, timeHorizon) {
        const stressors = [];

        // Temperature stress
        const tempIncrease = climateData.projections.temperature.total_increase_celsius;
        if (tempIncrease > 2) {
            stressors.push({
                type: 'temperature_increase',
                severity: Math.min(tempIncrease / 5, 1),
                description: `${tempIncrease.toFixed(1)}°C increase by ${timeHorizon}`
            });
        }

        // Precipitation change
        const precipChange = climateData.projections.precipitation.change_percentage;
        if (Math.abs(precipChange) > 10) {
            stressors.push({
                type: 'precipitation_change',
                severity: Math.min(Math.abs(precipChange) / 50, 1),
                description: `${precipChange > 0 ? '+' : ''}${precipChange.toFixed(1)}% change in precipitation`
            });
        }

        // Sea level rise (for coastal species)
        if (species.habitat_type === 'coastal' || species.habitat_type === 'marine') {
            const seaLevelRise = climateData.projections.sea_level.total_rise_meters;
            stressors.push({
                type: 'sea_level_rise',
                severity: Math.min(seaLevelRise / 2, 1),
                description: `${seaLevelRise.toFixed(2)}m sea level rise`
            });
        }

        return stressors;
    }

    calculateDistributionImpact(species, climateData, timeHorizon) {
        let impact = 0;

        // Temperature-based range shift
        const tempIncrease = climateData.projections.temperature.total_increase_celsius;
        impact += tempIncrease * 0.1; // 10% habitat loss per degree

        // Precipitation change impact
        const precipChange = Math.abs(climateData.projections.precipitation.change_percentage) / 100;
        impact += precipChange * 0.3; // 30% impact per 100% precipitation change

        // Species-specific modifiers
        if (species.dispersal_ability === 'low') impact += 0.2;
        if (species.habitat_specificity === 'high') impact += 0.15;

        return Math.min(impact, 1.0);
    }

    calculatePhenologyImpact(species, climateData) {
        const tempIncrease = climateData.projections.temperature.total_increase_celsius;
        // Phenological shifts of 2-8 days per degree
        const shiftDays = tempIncrease * 5;
        const impact = Math.min(shiftDays / 30, 1.0); // Convert to 0-1 scale

        return impact;
    }

    calculateAcidificationImpact(species, climateData) {
        // Ocean acidification impact (simplified)
        if (species.calcifying === true) {
            return 0.6; // High impact for calcifying species
        }
        if (species.calcifying === false) {
            return 0.2; // Low impact for non-calcifying species
        }
        return 0.4; // Medium impact for unknown
    }

    calculateExtremeEventsImpact(species, climateData) {
        const extremeEvents = climateData.projections.extreme_events;
        let impact = 0;

        impact += (extremeEvents.heatwave_frequency_multiplier - 1) * 0.2;
        impact += (extremeEvents.drought_frequency_multiplier - 1) * 0.15;
        impact += (extremeEvents.storm_intensity_multiplier - 1) * 0.1;

        return Math.min(impact, 1.0);
    }

    calculateMigrationPotential(species) {
        let potential = 0.5; // Base potential

        if (species.dispersal_ability === 'high') potential += 0.3;
        if (species.dispersal_ability === 'low') potential -= 0.2;

        if (species.generation_time === 'short') potential += 0.1;
        if (species.generation_time === 'long') potential -= 0.1;

        return Math.max(0, Math.min(1, potential));
    }

    calculatePhenologicalPlasticity(species) {
        // Phenological adaptation potential
        let plasticity = 0.5;

        if (species.phenological_flexibility === 'high') plasticity += 0.2;
        if (species.phenological_flexibility === 'low') plasticity -= 0.2;

        return Math.max(0, Math.min(1, plasticity));
    }

    calculateAcidificationTolerance(species) {
        if (species.acidification_tolerance === 'high') return 0.8;
        if (species.acidification_tolerance === 'low') return 0.2;
        return 0.5; // Default
    }

    calculateExtremeTolerance(species) {
        let tolerance = 0.5;

        if (species.extreme_tolerance === 'high') tolerance += 0.2;
        if (species.extreme_tolerance === 'low') tolerance -= 0.2;

        return Math.max(0, Math.min(1, tolerance));
    }

    classifyVulnerability(impactScore) {
        for (const [category, config] of Object.entries(this.vulnerabilityCategories)) {
            if (impactScore >= config.threshold) {
                return category;
            }
        }
        return 'low_vulnerability';
    }

    generateSpeciesRecommendations(species, impactScore, adaptationPotential) {
        const recommendations = [];

        if (impactScore > 0.7) {
            recommendations.push('Immediate conservation intervention required');
            recommendations.push('Consider assisted migration programs');
            recommendations.push('Establish ex-situ conservation populations');
        } else if (impactScore > 0.5) {
            recommendations.push('Monitor population trends closely');
            recommendations.push('Enhance habitat connectivity');
            recommendations.push('Implement adaptive management strategies');
        } else if (impactScore > 0.3) {
            recommendations.push('Regular monitoring of climate impacts');
            recommendations.push('Maintain habitat quality');
        } else {
            recommendations.push('Continue current conservation measures');
        }

        if (adaptationPotential < 0.3) {
            recommendations.push('Focus on habitat protection and restoration');
        } else if (adaptationPotential > 0.7) {
            recommendations.push('Species likely to adapt naturally with minimal intervention');
        }

        return recommendations;
    }

    calculateImpactSummary(impactResults) {
        const speciesImpacts = Object.values(impactResults);
        const impactScores = speciesImpacts.map(s => s.impact_score);

        return {
            total_species: speciesImpacts.length,
            average_impact_score: impactScores.reduce((a, b) => a + b, 0) / impactScores.length,
            high_impact_species: speciesImpacts.filter(s => s.impact_score > 0.7).length,
            moderate_impact_species: speciesImpacts.filter(s => s.impact_score > 0.4 && s.impact_score <= 0.7).length,
            low_impact_species: speciesImpacts.filter(s => s.impact_score <= 0.4).length,
            vulnerability_distribution: this.calculateVulnerabilityDistribution(speciesImpacts)
        };
    }

    calculateVulnerabilityDistribution(speciesImpacts) {
        const distribution = {};

        for (const category of Object.keys(this.vulnerabilityCategories)) {
            distribution[category] = speciesImpacts.filter(s => s.vulnerability_category === category).length;
        }

        return distribution;
    }

    calculateVulnerabilityScores(speciesData, impactResults) {
        const vulnerabilityScores = {};

        for (const species of speciesData) {
            const speciesImpacts = Object.values(impactResults).map(model =>
                model.species_impacts[species.scientific_name]
            ).filter(impact => impact);

            if (speciesImpacts.length > 0) {
                // Calculate overall vulnerability as average of all impact models
                const avgImpactScore = speciesImpacts.reduce((sum, impact) => sum + impact.impact_score, 0) / speciesImpacts.length;
                const avgAdaptationPotential = speciesImpacts.reduce((sum, impact) => sum + impact.adaptation_potential, 0) / speciesImpacts.length;

                vulnerabilityScores[species.scientific_name] = {
                    species_name: species.name,
                    overall_vulnerability: avgImpactScore,
                    adaptation_potential: avgAdaptationPotential,
                    vulnerability_category: this.classifyVulnerability(avgImpactScore),
                    model_results: speciesImpacts,
                    priority_score: this.calculatePriorityScore(avgImpactScore, avgAdaptationPotential, species)
                };
            }
        }

        return {
            species_scores: vulnerabilityScores,
            summary: this.calculateVulnerabilitySummary(vulnerabilityScores),
            priority_species: this.identifyPrioritySpecies(vulnerabilityScores)
        };
    }

    calculatePriorityScore(impactScore, adaptationPotential, species) {
        // Priority = Impact × (1 - Adaptation) × Conservation Value
        const conservationMultiplier = this.getConservationMultiplier(species);
        return impactScore * (1 - adaptationPotential) * conservationMultiplier;
    }

    getConservationMultiplier(species) {
        let multiplier = 1.0;

        // IUCN status increases priority
        if (species.iucn_status === 'Critically Endangered') multiplier *= 3.0;
        else if (species.iucn_status === 'Endangered') multiplier *= 2.5;
        else if (species.iucn_status === 'Vulnerable') multiplier *= 2.0;
        else if (species.iucn_status === 'Near Threatened') multiplier *= 1.5;

        // Endemic species get higher priority
        if (species.endemic === true) multiplier *= 1.5;

        // Ecosystem engineers get higher priority
        if (species.ecosystem_engineer === true) multiplier *= 1.3;

        return multiplier;
    }

    calculateVulnerabilitySummary(vulnerabilityScores) {
        const scores = Object.values(vulnerabilityScores);
        const vulnerabilityValues = scores.map(s => s.overall_vulnerability);

        return {
            total_species_assessed: scores.length,
            average_vulnerability: vulnerabilityValues.reduce((a, b) => a + b, 0) / vulnerabilityValues.length,
            highly_vulnerable_species: scores.filter(s => s.overall_vulnerability > 0.7).length,
            moderately_vulnerable_species: scores.filter(s => s.overall_vulnerability > 0.4 && s.overall_vulnerability <= 0.7).length,
            low_vulnerability_species: scores.filter(s => s.overall_vulnerability <= 0.4).length,
            adaptation_potential_distribution: this.calculateAdaptationDistribution(scores)
        };
    }

    calculateAdaptationDistribution(scores) {
        const adaptationScores = scores.map(s => s.adaptation_potential);
        return {
            high_adaptation: adaptationScores.filter(s => s > 0.7).length,
            moderate_adaptation: adaptationScores.filter(s => s > 0.4 && s <= 0.7).length,
            low_adaptation: adaptationScores.filter(s => s <= 0.4).length
        };
    }

    identifyPrioritySpecies(vulnerabilityScores) {
        return Object.entries(vulnerabilityScores)
            .map(([scientificName, data]) => ({
                scientific_name: scientificName,
                common_name: data.species_name,
                priority_score: data.priority_score,
                vulnerability: data.overall_vulnerability,
                adaptation_potential: data.adaptation_potential
            }))
            .sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, 10); // Top 10 priority species
    }

    generateAdaptationStrategies(vulnerabilityAssessment, climateScenario) {
        const strategies = {
            habitat_protection: [],
            assisted_migration: [],
            captive_breeding: [],
            genetic_rescue: [],
            habitat_restoration: [],
            monitoring_enhancement: []
        };

        const prioritySpecies = vulnerabilityAssessment.priority_species;

        for (const species of prioritySpecies) {
            if (species.vulnerability > 0.7) {
                strategies.captive_breeding.push({
                    species: species.scientific_name,
                    priority: 'critical',
                    rationale: 'Extremely high vulnerability requires immediate ex-situ measures'
                });
            } else if (species.vulnerability > 0.5) {
                strategies.assisted_migration.push({
                    species: species.scientific_name,
                    priority: 'high',
                    rationale: 'High vulnerability suggests need for range expansion assistance'
                });
            }

            if (species.adaptation_potential < 0.3) {
                strategies.habitat_protection.push({
                    species: species.scientific_name,
                    priority: 'high',
                    rationale: 'Low adaptation potential requires habitat-focused interventions'
                });
            }
        }

        return strategies;
    }

    generateClimateImpactReport(speciesData, climateData, impactResults, vulnerabilityAssessment, adaptationStrategies, timeHorizon) {
        const report = {
            title: `Climate Change Impact Assessment Report - ${timeHorizon}`,
            executive_summary: this.generateExecutiveSummary(vulnerabilityAssessment, climateData),
            methodology: {
                climate_scenario: climateData.scenario_name,
                impact_models_used: Object.keys(impactResults),
                time_horizon: timeHorizon,
                assessment_date: new Date().toISOString()
            },
            climate_projections: climateData.projections,
            species_assessment: {
                total_species: speciesData.length,
                vulnerability_summary: vulnerabilityAssessment.summary,
                priority_species: vulnerabilityAssessment.priority_species.slice(0, 5)
            },
            impact_details: impactResults,
            adaptation_recommendations: adaptationStrategies,
            uncertainty_analysis: this.generateUncertaintyAnalysis(vulnerabilityAssessment),
            policy_implications: this.generatePolicyImplications(vulnerabilityAssessment, climateData),
            monitoring_recommendations: this.generateMonitoringRecommendations(vulnerabilityAssessment)
        };

        return report;
    }

    generateExecutiveSummary(vulnerabilityAssessment, climateData) {
        const summary = vulnerabilityAssessment.summary;
        const highVulnerabilityCount = summary.highly_vulnerable_species;
        const totalSpecies = summary.total_species_assessed;

        return {
            key_findings: [
                `${highVulnerabilityCount} out of ${totalSpecies} species assessed as highly vulnerable to climate change`,
                `Average vulnerability score: ${(summary.average_vulnerability * 100).toFixed(1)}%`,
                `Climate scenario: ${climateData.scenario_name}`,
                `${vulnerabilityAssessment.priority_species.length} species identified as conservation priorities`
            ],
            overall_risk_level: highVulnerabilityCount > totalSpecies * 0.5 ? 'high' :
                               highVulnerabilityCount > totalSpecies * 0.3 ? 'moderate' : 'low',
            immediate_actions_required: highVulnerabilityCount > totalSpecies * 0.2
        };
    }

    generateUncertaintyAnalysis(vulnerabilityAssessment) {
        // Simplified uncertainty analysis
        return {
            confidence_level: 'medium',
            main_uncertainties: [
                'Climate model projections uncertainty',
                'Species-specific response variability',
                'Local adaptation potential uncertainty',
                'Extreme events unpredictability'
            ],
            sensitivity_analysis: {
                temperature_sensitivity: 'high',
                precipitation_sensitivity: 'medium',
                sea_level_sensitivity: 'low'
            },
            recommendations: [
                'Use ensemble of climate models for projections',
                'Conduct species-specific sensitivity testing',
                'Monitor local climate adaptation indicators',
                'Regular reassessment every 5 years'
            ]
        };
    }

    generatePolicyImplications(vulnerabilityAssessment, climateData) {
        const implications = [];

        if (vulnerabilityAssessment.summary.highly_vulnerable_species > 10) {
            implications.push({
                policy_area: 'Conservation Funding',
                implication: 'Significant increase in conservation funding required',
                recommendation: 'Allocate additional 20-30% to climate adaptation programs'
            });
        }

        if (climateData.scenario.includes('ssp5') || climateData.scenario.includes('ssp3')) {
            implications.push({
                policy_area: 'Climate Policy',
                implication: 'Current climate policies insufficient for biodiversity protection',
                recommendation: 'Strengthen Nationally Determined Contributions (NDCs)'
            });
        }

        implications.push({
            policy_area: 'Protected Areas',
            implication: 'Existing protected areas may become ineffective under climate change',
            recommendation: 'Implement dynamic protected area management and connectivity corridors'
        });

        return implications;
    }

    generateMonitoringRecommendations(vulnerabilityAssessment) {
        const recommendations = [];

        recommendations.push({
            type: 'species_monitoring',
            frequency: 'annual',
            targets: vulnerabilityAssessment.priority_species.slice(0, 5).map(s => s.scientific_name),
            indicators: ['population_size', 'distribution_shifts', 'phenological_changes']
        });

        recommendations.push({
            type: 'climate_monitoring',
            frequency: 'monthly',
            targets: ['temperature', 'precipitation', 'extreme_events'],
            indicators: ['trends', 'anomalies', 'threshold_exceedances']
        });

        recommendations.push({
            type: 'habitat_monitoring',
            frequency: 'quarterly',
            targets: ['habitat_quality', 'connectivity', 'restoration_success'],
            indicators: ['fragmentation_index', 'quality_metrics', 'recovery_rates']
        });

        return recommendations;
    }

    async updateAssessmentStatus(assessmentId, status) {
        const statusFile = path.join(this.climateDataPath, assessmentId, 'status.json');
        const currentStatus = this.activeAssessments.get(assessmentId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeAssessments.set(assessmentId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating climate assessment status:', error);
        }

        return newStatus;
    }

    async getAssessmentStatus(assessmentId) {
        if (this.activeAssessments.has(assessmentId)) {
            return this.activeAssessments.get(assessmentId);
        }

        try {
            const statusFile = path.join(this.climateDataPath, assessmentId, 'status.json');
            const statusData = await fs.readFile(statusFile, 'utf8');
            const status = JSON.parse(statusData);
            this.activeAssessments.set(assessmentId, status);
            return status;
        } catch (error) {
            return null;
        }
    }

    generateAssessmentId() {
        return `climate_assessment_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableScenarios() {
        return Object.keys(this.climateScenarios).map(key => ({
            id: key,
            ...this.climateScenarios[key]
        }));
    }

    getAvailableModels() {
        return Object.keys(this.impactModels).map(key => ({
            id: key,
            ...this.impactModels[key]
        }));
    }
}

// Initialize climate integration service
const climateIntegrationService = new ClimateIntegrationService();

// Routes
router.get('/scenarios', verifyToken, async (req, res) => {
    try {
        res.json({
            scenarios: climateIntegrationService.getAvailableScenarios(),
            total: Object.keys(climateIntegrationService.climateScenarios).length,
            default_scenario: 'ssp2_4_5'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/models', verifyToken, async (req, res) => {
    try {
        res.json({
            models: climateIntegrationService.getAvailableModels(),
            total: Object.keys(climateIntegrationService.impactModels).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/assess', verifyToken, async (req, res) => {
    try {
        const {
            species_data,
            location_coordinates,
            climate_scenario = 'ssp2_4_5',
            time_horizon = 2050,
            impact_models = ['species_distribution', 'phenology_modeling']
        } = req.body;

        if (!species_data || !location_coordinates) {
            return res.status(400).json({ error: 'Species data and location coordinates are required' });
        }

        const assessmentId = climateIntegrationService.generateAssessmentId();

        // Start assessment asynchronously
        climateIntegrationService.runClimateImpactAssessment(assessmentId, {
            species_data,
            location_coordinates,
            climate_scenario,
            time_horizon,
            impact_models
        }).catch(error => {
            console.error(`Climate assessment ${assessmentId} failed:`, error);
        });

        res.json({
            success: true,
            assessmentId,
            message: 'Climate impact assessment started',
            climate_scenario,
            time_horizon,
            impact_models,
            estimatedDuration: '5-15 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assessment/:assessmentId/status', verifyToken, async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const status = await climateIntegrationService.getAssessmentStatus(assessmentId);

        if (!status) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assessment/:assessmentId/results', verifyToken, async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const status = await climateIntegrationService.getAssessmentStatus(assessmentId);

        if (!status) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        if (status.status !== 'completed') {
            return res.status(400).json({
                error: 'Assessment not completed',
                currentStatus: status.status,
                stage: status.stage
            });
        }

        res.json({
            assessmentId,
            results: status.results,
            completedAt: status.endTime,
            duration: new Date(status.endTime) - new Date(status.startTime)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assessments', verifyToken, async (req, res) => {
    try {
        const assessments = Array.from(climateIntegrationService.activeAssessments.entries()).map(([assessmentId, status]) => ({
            assessmentId,
            status: status.status,
            stage: status.stage,
            progress: status.progress,
            climate_scenario: status.climate_scenario,
            time_horizon: status.time_horizon,
            startTime: status.startTime,
            lastUpdate: status.lastUpdate
        }));

        res.json({
            assessments,
            total: assessments.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/compare-scenarios', verifyToken, async (req, res) => {
    try {
        const {
            species_data,
            location_coordinates,
            scenarios = ['ssp1_2_6', 'ssp2_4_5', 'ssp5_8_5'],
            time_horizon = 2050,
            impact_models = ['species_distribution']
        } = req.body;

        if (!species_data || !location_coordinates) {
            return res.status(400).json({ error: 'Species data and location coordinates are required' });
        }

        const comparisonResults = {};

        for (const scenario of scenarios) {
            try {
                const assessmentId = climateIntegrationService.generateAssessmentId();
                const result = await climateIntegrationService.runClimateImpactAssessment(assessmentId, {
                    species_data,
                    location_coordinates,
                    climate_scenario: scenario,
                    time_horizon,
                    impact_models
                });
                comparisonResults[scenario] = {
                    status: 'success',
                    results: result,
                    assessmentId
                };
            } catch (error) {
                comparisonResults[scenario] = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Generate scenario comparison
        const comparison = climateIntegrationService.generateScenarioComparison(comparisonResults);

        res.json({
            comparison: comparisonResults,
            scenario_comparison: comparison,
            scenarios_compared: scenarios,
            species_count: species_data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper methods
climateIntegrationService.generateScenarioComparison = function(comparisonResults) {
    const successfulResults = Object.entries(comparisonResults)
        .filter(([_, result]) => result.status === 'success')
        .map(([scenario, result]) => ({ scenario, ...result.results }));

    if (successfulResults.length === 0) {
        return { error: 'No successful scenario results to compare' };
    }

    const comparison = {
        scenarios_compared: successfulResults.length,
        most_severe_scenario: successfulResults.reduce((worst, current) => {
            const worstVulnerability = worst.vulnerability_assessment?.summary?.average_vulnerability || 0;
            const currentVulnerability = current.vulnerability_assessment?.summary?.average_vulnerability || 0;
            return currentVulnerability > worstVulnerability ? current : worst;
        }),
        least_severe_scenario: successfulResults.reduce((best, current) => {
            const bestVulnerability = best.vulnerability_assessment?.summary?.average_vulnerability || 1;
            const currentVulnerability = current.vulnerability_assessment?.summary?.average_vulnerability || 1;
            return currentVulnerability < bestVulnerability ? current : best;
        }),
        vulnerability_range: this.calculateVulnerabilityRange(successfulResults)
    };

    return comparison;
};

climateIntegrationService.calculateVulnerabilityRange = function(results) {
    const vulnerabilities = results.map(r => r.vulnerability_assessment?.summary?.average_vulnerability || 0);
    return {
        min_vulnerability: Math.min(...vulnerabilities),
        max_vulnerability: Math.max(...vulnerabilities),
        range: Math.max(...vulnerabilities) - Math.min(...vulnerabilities)
    };
};

module.exports = router;