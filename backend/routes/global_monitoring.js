const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Global Biodiversity Monitoring System
class GlobalMonitoringService {
    constructor() {
        this.monitoringDataPath = path.join(__dirname, '../reports/global_monitoring');
        this.activeMonitors = new Map();
        this.alertsQueue = [];
        this.initializeMonitoringDirectory();

        // Start alert monitoring
        this.startAlertMonitoring();
    }

    async initializeMonitoringDirectory() {
        try {
            await fs.mkdir(this.monitoringDataPath, { recursive: true });
        } catch (error) {
            console.error('Global monitoring directory initialization error:', error);
        }
    }

    async setupMonitoringNetwork(networkId, params) {
        const {
            regions = [],
            species_groups = [],
            indicators = [],
            alert_thresholds = {},
            data_sources = [],
            update_frequency = 'daily'
        } = params;

        try {
            const networkConfig = {
                networkId,
                regions,
                species_groups,
                indicators,
                alert_thresholds: { ...this.alertThresholds, ...alert_thresholds },
                data_sources,
                update_frequency,
                status: 'active',
                last_update: new Date().toISOString(),
                baseline_data: await this.establishBaselineData(regions, species_groups, indicators)
            };

            this.activeMonitors.set(networkId, networkConfig);
            await this.saveNetworkConfig(networkId, networkConfig);

            return {
                success: true,
                networkId,
                message: 'Monitoring network established',
                config: networkConfig
            };
        } catch (error) {
            console.error(`Error setting up monitoring network ${networkId}:`, error);
            throw error;
        }
    }

    async runMonitoringAnalysis(analysisId, params) {
        const {
            network_id,
            time_period = { start: '2020-01-01', end: new Date().toISOString().split('T')[0] },
            analysis_type = 'trend_analysis',
            indicators = [],
            regions = []
        } = params;

        try {
            await this.updateAnalysisStatus(analysisId, {
                status: 'running',
                stage: 'data_collection',
                network_id,
                time_period,
                analysis_type,
                startTime: new Date().toISOString(),
                progress: 0
            });

            const networkConfig = this.activeMonitors.get(network_id);
            if (!networkConfig) {
                throw new Error(`Monitoring network ${network_id} not found`);
            }

            await this.updateAnalysisStatus(analysisId, {
                stage: 'data_processing',
                progress: 20
            });

            // Collect monitoring data
            const monitoringData = await this.collectMonitoringData(
                networkConfig,
                time_period,
                regions.length > 0 ? regions : networkConfig.regions
            );

            await this.updateAnalysisStatus(analysisId, {
                stage: 'indicator_calculation',
                progress: 50
            });

            // Calculate biodiversity indicators
            const calculatedIndicators = await this.calculateIndicators(
                monitoringData,
                indicators.length > 0 ? indicators : networkConfig.indicators
            );

            await this.updateAnalysisStatus(analysisId, {
                stage: 'trend_analysis',
                progress: 70
            });

            // Perform trend analysis
            const trendAnalysis = this.performTrendAnalysis(
                calculatedIndicators,
                time_period,
                analysis_type
            );

            await this.updateAnalysisStatus(analysisId, {
                stage: 'alert_generation',
                progress: 90
            });

            // Generate alerts
            const alerts = this.generateAlerts(
                calculatedIndicators,
                trendAnalysis,
                networkConfig.alert_thresholds
            );

            // Add alerts to queue
            this.alertsQueue.push(...alerts);

            await this.updateAnalysisStatus(analysisId, {
                status: 'completed',
                stage: 'finished',
                progress: 100,
                endTime: new Date().toISOString(),
                results: {
                    monitoring_data: monitoringData,
                    calculated_indicators: calculatedIndicators,
                    trend_analysis: trendAnalysis,
                    alerts: alerts,
                    summary: this.generateMonitoringSummary(calculatedIndicators, trendAnalysis, alerts)
                }
            });

            return {
                monitoring_data: monitoringData,
                calculated_indicators: calculatedIndicators,
                trend_analysis: trendAnalysis,
                alerts: alerts,
                summary: this.generateMonitoringSummary(calculatedIndicators, trendAnalysis, alerts)
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

    async collectMonitoringData(networkConfig, timePeriod, regions) {
        const collectedData = {
            timestamp: new Date().toISOString(),
            network: networkConfig.networkId,
            regions: regions,
            data_sources: networkConfig.data_sources,
            datasets: []
        };

        // Simulate data collection from various sources
        for (const source of networkConfig.data_sources) {
            const sourceData = await this.collectFromDataSource(source, timePeriod, regions);
            collectedData.datasets.push(sourceData);
        }

        return collectedData;
    }

    async collectFromDataSource(source, timePeriod, regions) {
        // Simulate data collection based on source type
        const sourceTypes = {
            'gbif': this.collectGBIFData,
            'lter': this.collectLTERData,
            'citizen_science': this.collectCitizenScienceData,
            'remote_sensing': this.collectRemoteSensingData,
            'acoustic_monitoring': this.collectAcousticData,
            'genetic_monitoring': this.collectGeneticData
        };

        const collector = sourceTypes[source] || this.collectGenericData;
        return await collector.call(this, timePeriod, regions);
    }

    async collectGBIFData(timePeriod, regions) {
        return {
            source: 'gbif',
            data_type: 'species_occurrences',
            records: this.generateMockSpeciesData(regions, timePeriod),
            quality_score: 0.85,
            coverage: 'high'
        };
    }

    async collectLTERData(timePeriod, regions) {
        return {
            source: 'lter',
            data_type: 'ecosystem_metrics',
            records: this.generateMockEcosystemData(regions, timePeriod),
            quality_score: 0.95,
            coverage: 'medium'
        };
    }

    async collectCitizenScienceData(timePeriod, regions) {
        return {
            source: 'citizen_science',
            data_type: 'observations',
            records: this.generateMockObservationData(regions, timePeriod),
            quality_score: 0.75,
            coverage: 'variable'
        };
    }

    async collectRemoteSensingData(timePeriod, regions) {
        return {
            source: 'remote_sensing',
            data_type: 'land_cover',
            records: this.generateMockRemoteSensingData(regions, timePeriod),
            quality_score: 0.90,
            coverage: 'high'
        };
    }

    async collectAcousticData(timePeriod, regions) {
        return {
            source: 'acoustic_monitoring',
            data_type: 'bioacoustic',
            records: this.generateMockAcousticData(regions, timePeriod),
            quality_score: 0.80,
            coverage: 'low'
        };
    }

    async collectGeneticData(timePeriod, regions) {
        return {
            source: 'genetic_monitoring',
            data_type: 'edna',
            records: this.generateMockGeneticData(regions, timePeriod),
            quality_score: 0.85,
            coverage: 'low'
        };
    }

    async collectGenericData(timePeriod, regions) {
        return {
            source: 'generic',
            data_type: 'mixed',
            records: this.generateMockGenericData(regions, timePeriod),
            quality_score: 0.70,
            coverage: 'variable'
        };
    }

    generateMockSpeciesData(regions, timePeriod) {
        const species = ['Panthera tigris', 'Elephas maximus', 'Pavo cristatus', 'Bos gaurus'];
        const records = [];

        for (const region of regions) {
            for (const speciesName of species) {
                records.push({
                    species: speciesName,
                    region: region,
                    count: Math.floor(Math.random() * 100) + 1,
                    date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                    coordinates: this.randomCoordinatesInRegion(region),
                    observer: 'automated_monitoring',
                    confidence: Math.random() * 0.3 + 0.7
                });
            }
        }

        return records;
    }

    generateMockEcosystemData(regions, timePeriod) {
        const metrics = ['biomass', 'productivity', 'soil_moisture', 'temperature'];
        const records = [];

        for (const region of regions) {
            for (const metric of metrics) {
                records.push({
                    metric: metric,
                    region: region,
                    value: Math.random() * 100,
                    unit: metric === 'temperature' ? 'celsius' : 'kg/ha',
                    date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                    site_id: `site_${region}_${Math.floor(Math.random() * 10)}`
                });
            }
        }

        return records;
    }

    generateMockObservationData(regions, timePeriod) {
        const species = ['Corvus splendens', 'Passer domesticus', 'Columba livia', 'Acridotheres tristis'];
        const records = [];

        for (const region of regions) {
            for (const speciesName of species) {
                records.push({
                    species: speciesName,
                    region: region,
                    count: Math.floor(Math.random() * 50) + 1,
                    date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                    observer: 'citizen_scientist',
                    coordinates: this.randomCoordinatesInRegion(region),
                    observation_method: 'visual_count'
                });
            }
        }

        return records;
    }

    generateMockRemoteSensingData(regions, timePeriod) {
        const indices = ['ndvi', 'evi', 'land_cover_class'];
        const records = [];

        for (const region of regions) {
            for (const index of indices) {
                records.push({
                    index: index,
                    region: region,
                    value: index.includes('vi') ? Math.random() * 0.8 + 0.2 : Math.floor(Math.random() * 10),
                    date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                    satellite: 'Landsat_8',
                    resolution: '30m'
                });
            }
        }

        return records;
    }

    generateMockAcousticData(regions, timePeriod) {
        const species = ['Oriolus kundoo', 'Pycnonotus cafer', 'Copsychus saularis'];
        const records = [];

        for (const region of regions) {
            for (const speciesName of species) {
                records.push({
                    species: speciesName,
                    region: region,
                    detections: Math.floor(Math.random() * 20) + 1,
                    date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                    recorder_id: `recorder_${region}_${Math.floor(Math.random() * 5)}`,
                    audio_quality: Math.random() * 0.3 + 0.7
                });
            }
        }

        return records;
    }

    generateMockGeneticData(regions, timePeriod) {
        const taxa = ['fish', 'amphibians', 'insects', 'plants'];
        const records = [];

        for (const region of regions) {
            for (const taxon of taxa) {
                records.push({
                    taxon: taxon,
                    region: region,
                    sequences_detected: Math.floor(Math.random() * 15) + 1,
                    date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                    sample_site: `site_${region}_${Math.floor(Math.random() * 10)}`,
                    sequencing_method: 'metabarcoding'
                });
            }
        }

        return records;
    }

    generateMockGenericData(regions, timePeriod) {
        const records = [];

        for (const region of regions) {
            records.push({
                region: region,
                biodiversity_index: Math.random() * 50 + 25,
                date: this.randomDateInRange(timePeriod.start, timePeriod.end),
                data_quality: Math.random() * 0.3 + 0.7
            });
        }

        return records;
    }

    randomDateInRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(randomTime).toISOString().split('T')[0];
    }

    randomCoordinatesInRegion(region) {
        const regionBounds = {
            'asia': { lat: [0, 50], lon: [60, 150] },
            'europe': { lat: [35, 70], lon: [-10, 40] },
            'africa': { lat: [-35, 35], lon: [-20, 50] },
            'americas': { lat: [-55, 70], lon: [-170, -35] },
            'oceania': { lat: [-50, 20], lon: [110, 180] }
        };

        const bounds = regionBounds[region.toLowerCase()] || { lat: [-90, 90], lon: [-180, 180] };

        return {
            lat: bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0]),
            lon: bounds.lon[0] + Math.random() * (bounds.lon[1] - bounds.lon[0])
        };
    }

    async calculateIndicators(monitoringData, indicators) {
        const calculatedIndicators = {};

        for (const indicator of indicators) {
            calculatedIndicators[indicator] = {
                indicator: indicator,
                name: this.biodiversityIndicators[indicator]?.name || indicator,
                values: await this.calculateIndicatorValues(monitoringData, indicator),
                trend: this.calculateIndicatorTrend(calculatedIndicators[indicator].values),
                status: this.assessIndicatorStatus(calculatedIndicators[indicator])
            };
        }

        return calculatedIndicators;
    }

    async calculateIndicatorValues(monitoringData, indicator) {
        const values = [];
        const timeGroups = this.groupDataByTime(monitoringData.datasets);

        for (const [period, data] of Object.entries(timeGroups)) {
            const value = await this.calculateIndicatorForPeriod(data, indicator);
            values.push({
                period: period,
                value: value,
                confidence: Math.random() * 0.2 + 0.8,
                sample_size: data.length
            });
        }

        return values.sort((a, b) => a.period.localeCompare(b.period));
    }

    groupDataByTime(datasets) {
        const timeGroups = {};

        for (const dataset of datasets) {
            for (const record of dataset.records) {
                const period = this.getTimePeriod(record.date);
                if (!timeGroups[period]) {
                    timeGroups[period] = [];
                }
                timeGroups[period].push({ ...record, source: dataset.source });
            }
        }

        return timeGroups;
    }

    getTimePeriod(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        return `${year}-Q${quarter}`;
    }

    async calculateIndicatorForPeriod(data, indicator) {
        switch (indicator) {
            case 'species_richness':
                return this.calculateSpeciesRichness(data);
            case 'shannon_diversity':
                return this.calculateShannonDiversity(data);
            case 'simpson_diversity':
                return this.calculateSimpsonDiversity(data);
            default:
                return Math.random() * 50 + 25;
        }
    }

    calculateSpeciesRichness(data) {
        const species = new Set();
        for (const record of data) {
            if (record.species) species.add(record.species);
        }
        return species.size;
    }

    calculateShannonDiversity(data) {
        const speciesCounts = {};
        let totalCount = 0;

        for (const record of data) {
            if (record.species && record.count) {
                speciesCounts[record.species] = (speciesCounts[record.species] || 0) + record.count;
                totalCount += record.count;
            }
        }

        if (totalCount === 0) return 0;

        let shannonIndex = 0;
        for (const count of Object.values(speciesCounts)) {
            const proportion = count / totalCount;
            shannonIndex -= proportion * Math.log(proportion);
        }

        return shannonIndex;
    }

    calculateSimpsonDiversity(data) {
        const speciesCounts = {};
        let totalCount = 0;

        for (const record of data) {
            if (record.species && record.count) {
                speciesCounts[record.species] = (speciesCounts[record.species] || 0) + record.count;
                totalCount += record.count;
            }
        }

        if (totalCount === 0) return 0;

        let simpsonIndex = 0;
        for (const count of Object.values(speciesCounts)) {
            const proportion = count / totalCount;
            simpsonIndex += proportion * proportion;
        }

        return 1 - simpsonIndex;
    }

    calculateIndicatorTrend(values) {
        if (values.length < 2) return { slope: 0, direction: 'stable', significance: 'insufficient_data' };

        const n = values.length;
        const sumX = values.reduce((sum, val, i) => sum + i, 0);
        const sumY = values.reduce((sum, val) => sum + val.value, 0);
        const sumXY = values.reduce((sum, val, i) => sum + i * val.value, 0);
        const sumXX = values.reduce((sum, val, i) => sum + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

        let direction = 'stable';
        if (Math.abs(slope) > 0.01) {
            direction = slope > 0 ? 'increasing' : 'decreasing';
        }

        const rSquared = this.calculateRSquared(values, slope, sumX / n, sumY / n);
        let significance = 'low';
        if (rSquared > 0.7) significance = 'high';
        else if (rSquared > 0.5) significance = 'moderate';

        return {
            slope: slope,
            direction: direction,
            significance: significance,
            r_squared: rSquared,
            confidence_interval: this.calculateTrendConfidenceInterval(slope, values)
        };
    }

    calculateRSquared(values, slope, meanX, meanY) {
        const ssRes = values.reduce((sum, val, i) => {
            const predicted = slope * i + (meanY - slope * meanX);
            return sum + Math.pow(val.value - predicted, 2);
        }, 0);
        const ssTot = values.reduce((sum, val) => sum + Math.pow(val.value - meanY, 2), 0);
        return 1 - (ssRes / ssTot);
    }

    calculateTrendConfidenceInterval(slope, values) {
        const n = values.length;
        const standardError = Math.sqrt(
            values.reduce((sum, val, i) => {
                const predicted = slope * i + (values.reduce((s, v, j) => s + (v.value - slope * j), 0) / n);
                return sum + Math.pow(val.value - predicted, 2);
            }, 0) / (n - 2)
        ) / Math.sqrt(values.reduce((sum, val, i) => sum + Math.pow(i - (n - 1) / 2, 2), 0));

        const tValue = 1.96;
        const margin = tValue * standardError;

        return {
            lower: slope - margin,
            upper: slope + margin,
            margin_of_error: margin
        };
    }

    assessIndicatorStatus(indicatorData) {
        const latestValue = indicatorData.values[indicatorData.values.length - 1];
        const trend = indicatorData.trend;

        let status = 'stable';
        let risk_level = 'low';

        if (trend.significance === 'high') {
            if (trend.direction === 'decreasing') {
                status = 'declining';
                risk_level = 'high';
            } else if (trend.direction === 'increasing') {
                status = 'improving';
                risk_level = 'low';
            }
        }

        return {
            status: status,
            risk_level: risk_level,
            latest_value: latestValue.value,
            trend_direction: trend.direction,
            trend_significance: trend.significance,
            recommended_actions: this.generateIndicatorActions(status, risk_level, indicatorData.indicator)
        };
    }

    generateIndicatorActions(status, riskLevel, indicator) {
        const actions = [];

        if (status === 'declining' && riskLevel === 'high') {
            actions.push('Immediate conservation intervention required');
            actions.push('Implement emergency protection measures');
            actions.push('Conduct detailed threat assessment');
        } else if (status === 'declining' && riskLevel === 'moderate') {
            actions.push('Monitor trends closely');
            actions.push('Implement adaptive management strategies');
            actions.push('Enhance habitat protection');
        } else if (status === 'improving') {
            actions.push('Continue current conservation efforts');
            actions.push('Scale up successful interventions');
            actions.push('Share best practices');
        }

        return actions;
    }

    performTrendAnalysis(calculatedIndicators, timePeriod, analysisType) {
        const trends = {};

        for (const [indicator, data] of Object.entries(calculatedIndicators)) {
            trends[indicator] = {
                indicator: indicator,
                overall_trend: data.trend,
                seasonal_patterns: this.analyzeSeasonalPatterns(data.values),
                breakpoint_analysis: this.analyzeBreakpoints(data.values),
                forecast: this.generateTrendForecast(data.values, timePeriod)
            };
        }

        return {
            analysis_type: analysisType,
            time_period: timePeriod,
            indicator_trends: trends,
            overall_assessment: this.assessOverallTrends(trends),
            recommendations: this.generateTrendRecommendations(trends)
        };
    }

    analyzeSeasonalPatterns(values) {
        const quarterlyData = {};

        for (const value of values) {
            const quarter = value.period.split('-Q')[1];
            if (!quarterlyData[quarter]) {
                quarterlyData[quarter] = [];
            }
            quarterlyData[quarter].push(value.value);
        }

        const seasonalAverages = {};
        for (const [quarter, vals] of Object.entries(quarterlyData)) {
            seasonalAverages[quarter] = vals.reduce((a, b) => a + b, 0) / vals.length;
        }

        return {
            seasonal_variation: Math.max(...Object.values(seasonalAverages)) - Math.min(...Object.values(seasonalAverages)),
            peak_season: Object.entries(seasonalAverages).reduce((a, b) => seasonalAverages[a[0]] > seasonalAverages[b[0]] ? a : b)[0],
            seasonal_averages: seasonalAverages
        };
    }

    analyzeBreakpoints(values) {
        if (values.length < 4) return { breakpoints: [] };

        const breakpoints = [];
        const mean = values.reduce((sum, val) => sum + val.value, 0) / values.length;

        for (let i = 1; i < values.length - 1; i++) {
            const beforeMean = values.slice(0, i).reduce((sum, val) => sum + val.value, 0) / i;
            const afterMean = values.slice(i).reduce((sum, val) => sum + val.value, 0) / (values.length - i);

            const deviation = Math.abs(beforeMean - afterMean);
            if (deviation > mean * 0.2) {
                breakpoints.push({
                    period: values[i].period,
                    deviation: deviation,
                    before_mean: beforeMean,
                    after_mean: afterMean
                });
            }
        }

        return { breakpoints: breakpoints };
    }

    generateTrendForecast(values, timePeriod) {
        if (values.length < 3) return { forecast: 'insufficient_data' };

        const recentValues = values.slice(-3);
        const slope = this.calculateIndicatorTrend(recentValues).slope;

        const lastValue = recentValues[recentValues.length - 1];
        const forecastPeriods = 4;
        const forecast = [];

        for (let i = 1; i <= forecastPeriods; i++) {
            const forecastedValue = lastValue.value + slope * i;

            forecast.push({
                period: `forecast_${i}`,
                value: Math.max(0, forecastedValue),
                confidence_interval: {
                    lower: Math.max(0, forecastedValue * 0.8),
                    upper: forecastedValue * 1.2
                }
            });
        }

        return {
            method: 'linear_extrapolation',
            forecast_periods: forecastPeriods,
            forecasted_values: forecast,
            uncertainty_level: 'moderate'
        };
    }

    assessOverallTrends(trends) {
        const indicatorStatuses = Object.values(trends).map(t => t.overall_trend);
        const decliningCount = indicatorStatuses.filter(t => t.direction === 'decreasing' && t.significance === 'high').length;
        const improvingCount = indicatorStatuses.filter(t => t.direction === 'increasing' && t.significance === 'high').length;

        let overallStatus = 'stable';
        if (decliningCount > improvingCount) {
            overallStatus = 'declining';
        } else if (improvingCount > decliningCount) {
            overallStatus = 'improving';
        }

        return {
            overall_status: overallStatus,
            declining_indicators: decliningCount,
            improving_indicators: improvingCount,
            stable_indicators: indicatorStatuses.length - decliningCount - improvingCount,
            risk_assessment: this.assessOverallRisk(decliningCount, indicatorStatuses.length)
        };
    }

    assessOverallRisk(decliningCount, totalIndicators) {
        const riskRatio = decliningCount / totalIndicators;

        if (riskRatio > 0.7) return 'critical';
        if (riskRatio > 0.5) return 'high';
        if (riskRatio > 0.3) return 'moderate';
        if (riskRatio > 0.1) return 'low';
        return 'minimal';
    }

    generateTrendRecommendations(trends) {
        const recommendations = [];
        const overallAssessment = this.assessOverallTrends(trends);

        if (overallAssessment.overall_status === 'declining') {
            recommendations.push('Implement comprehensive conservation strategy');
            recommendations.push('Increase monitoring frequency');
            recommendations.push('Develop species recovery plans');
        } else if (overallAssessment.overall_status === 'improving') {
            recommendations.push('Continue current conservation efforts');
            recommendations.push('Scale up successful interventions');
            recommendations.push('Share best practices with other regions');
        }

        if (overallAssessment.risk_assessment === 'critical') {
            recommendations.push('URGENT: Implement emergency conservation measures');
            recommendations.push('Seek international conservation assistance');
            recommendations.push('Consider IUCN Red List assessments');
        }

        return recommendations;
    }

    generateAlerts(calculatedIndicators, trendAnalysis, alertThresholds) {
        const alerts = [];

        for (const [indicator, data] of Object.entries(calculatedIndicators)) {
            const status = data.status;

            if (status.risk_level === 'high' || status.status === 'declining') {
                alerts.push({
                    id: crypto.randomBytes(8).toString('hex'),
                    type: 'indicator_alert',
                    indicator: indicator,
                    severity: status.risk_level,
                    message: `${data.name} showing ${status.status} trend with ${status.risk_level} risk`,
                    details: {
                        current_value: status.latest_value,
                        trend_direction: status.trend_direction,
                        significance: status.trend_significance
                    },
                    recommended_actions: status.recommended_actions,
                    timestamp: new Date().toISOString(),
                    status: 'active'
                });
            }
        }

        const overallAssessment = trendAnalysis.overall_assessment;
        if (overallAssessment.risk_assessment === 'critical') {
            alerts.push({
                id: crypto.randomBytes(8).toString('hex'),
                type: 'system_alert',
                severity: 'critical',
                message: 'Critical biodiversity decline detected across monitoring network',
                details: {
                    declining_indicators: overallAssessment.declining_indicators,
                    total_indicators: overallAssessment.declining_indicators + overallAssessment.improving_indicators + overallAssessment.stable_indicators,
                    risk_assessment: overallAssessment.risk_assessment
                },
                recommended_actions: trendAnalysis.recommendations,
                timestamp: new Date().toISOString(),
                status: 'active'
            });
        }

        return alerts;
    }

    generateMonitoringSummary(calculatedIndicators, trendAnalysis, alerts) {
        const indicators = Object.values(calculatedIndicators);
        const activeAlerts = alerts.filter(a => a.status === 'active');

        return {
            monitoring_period: trendAnalysis.time_period,
            total_indicators: indicators.length,
            indicators_status: {
                improving: indicators.filter(i => i.status.status === 'improving').length,
                declining: indicators.filter(i => i.status.status === 'declining').length,
                stable: indicators.filter(i => i.status.status === 'stable').length
            },
            overall_trend: trendAnalysis.overall_assessment.overall_status,
            risk_level: trendAnalysis.overall_assessment.risk_assessment,
            active_alerts: activeAlerts.length,
            critical_alerts: activeAlerts.filter(a => a.severity === 'critical').length,
            key_findings: this.generateKeyFindings(indicators, trendAnalysis),
            recommendations: trendAnalysis.recommendations
        };
    }

    generateKeyFindings(indicators, trendAnalysis) {
        const findings = [];

        const decliningIndicators = indicators.filter(i => i.status.status === 'declining');
        if (decliningIndicators.length > 0) {
            findings.push(`${decliningIndicators.length} indicators showing declining trends`);
        }

        const improvingIndicators = indicators.filter(i => i.status.status === 'improving');
        if (improvingIndicators.length > 0) {
            findings.push(`${improvingIndicators.length} indicators showing improving trends`);
        }

        if (trendAnalysis.overall_assessment.risk_assessment === 'critical') {
            findings.push('Critical risk level detected - immediate action required');
        }

        return findings;
    }

    startAlertMonitoring() {
        setInterval(() => {
            this.processAlertQueue();
        }, 5 * 60 * 1000);

        setInterval(() => {
            this.cleanupOldAlerts();
        }, 24 * 60 * 60 * 1000);
    }

    async processAlertQueue() {
        if (this.alertsQueue.length === 0) return;

        const newAlerts = this.alertsQueue.splice(0);

        for (const alert of newAlerts) {
            console.log(`🚨 Biodiversity Alert: ${alert.message}`);
        }

        try {
            const alertsFile = path.join(this.monitoringDataPath, 'alerts.json');
            const existingAlerts = await this.loadExistingAlerts();
            const allAlerts = [...existingAlerts, ...newAlerts];

            await fs.writeFile(alertsFile, JSON.stringify(allAlerts, null, 2));
        } catch (error) {
            console.error('Error saving alerts:', error);
        }
    }

    async loadExistingAlerts() {
        try {
            const alertsFile = path.join(this.monitoringDataPath, 'alerts.json');
            const data = await fs.readFile(alertsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async cleanupOldAlerts() {
        try {
            const alerts = await this.loadExistingAlerts();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentAlerts = alerts.filter(alert => new Date(alert.timestamp) > thirtyDaysAgo);

            if (recentAlerts.length < alerts.length) {
                const alertsFile = path.join(this.monitoringDataPath, 'alerts.json');
                await fs.writeFile(alertsFile, JSON.stringify(recentAlerts, null, 2));
                console.log(`Cleaned up ${alerts.length - recentAlerts.length} old alerts`);
            }
        } catch (error) {
            console.error('Error cleaning up alerts:', error);
        }
    }

    async establishBaselineData(regions, speciesGroups, indicators) {
        const baseline = {
            established_date: new Date().toISOString(),
            regions: regions,
            species_groups: speciesGroups,
            indicators: indicators,
            baseline_values: {}
        };

        for (const indicator of indicators) {
            baseline.baseline_values[indicator] = {};

            for (const region of regions) {
                baseline.baseline_values[indicator][region] = {
                    value: Math.random() * 50 + 25,
                    date: new Date().toISOString(),
                    confidence: Math.random() * 0.2 + 0.8
                };
            }
        }

        return baseline;
    }

    async saveNetworkConfig(networkId, config) {
        try {
            const configFile = path.join(this.monitoringDataPath, `${networkId}_config.json`);
            await fs.writeFile(configFile, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error saving network config:', error);
        }
    }

    async updateAnalysisStatus(analysisId, status) {
        const statusFile = path.join(this.monitoringDataPath, `${analysisId}_status.json`);
        const currentStatus = this.activeMonitors.get(analysisId) || {};
        const newStatus = { ...currentStatus, ...status, lastUpdate: new Date().toISOString() };

        this.activeMonitors.set(analysisId, newStatus);

        try {
            await fs.mkdir(path.dirname(statusFile), { recursive: true });
            await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
        } catch (error) {
            console.error('Error updating analysis status:', error);
        }

        return newStatus;
    }

    generateAnalysisId() {
        return `monitoring_analysis_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    generateNetworkId() {
        return `monitoring_network_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    getAvailableNetworks() {
        return Object.keys(this.monitoringNetworks).map(key => ({
            id: key,
            name: this.monitoringNetworks[key].name,
            description: this.monitoringNetworks[key].description,
            data_types: this.monitoringNetworks[key].data_types,
            coverage: this.monitoringNetworks[key].coverage,
            update_frequency: this.monitoringNetworks[key].update_frequency
        }));
    }

    getAvailableIndicators() {
        return Object.keys(this.biodiversityIndicators).map(key => ({
            id: key,
            ...this.biodiversityIndicators[key]
        }));
    }

    // Biodiversity indicators (simplified)
    biodiversityIndicators = {
        'species_richness': {
            name: 'Species Richness',
            description: 'Number of different species in an area',
            trend_direction: 'increasing_better'
        },
        'shannon_diversity': {
            name: 'Shannon Diversity Index',
            description: 'Measure of species diversity and evenness',
            trend_direction: 'increasing_better'
        },
        'simpson_diversity': {
            name: 'Simpson Diversity Index',
            description: 'Measure of species dominance',
            trend_direction: 'increasing_better'
        }
    };

    // Alert thresholds (simplified)
    alertThresholds = {
        'species_extinction_risk': {
            critical: 0.9,
            high: 0.7,
            medium: 0.5,
            low: 0.3
        },
        'habitat_loss': {
            critical: 0.8,
            high: 0.6,
            medium: 0.4,
            low: 0.2
        }
    };

    // Monitoring networks (simplified)
    monitoringNetworks = {
        'gbif': {
            name: 'Global Biodiversity Information Facility',
            description: 'Global network of biodiversity data',
            data_types: ['species_occurrences', 'collections', 'observations'],
            coverage: 'global',
            update_frequency: 'daily'
        },
        'citizen_science': {
            name: 'Citizen Science Networks',
            description: 'Public participation in biodiversity monitoring',
            data_types: ['bird_counts', 'plant_observations', 'insect_surveys'],
            coverage: 'global',
            update_frequency: 'weekly'
        }
    };
}

// Initialize global monitoring service
const globalMonitoringService = new GlobalMonitoringService();

// Routes
router.get('/networks', verifyToken, async (req, res) => {
    try {
        res.json({
            available_networks: globalMonitoringService.getAvailableNetworks(),
            active_networks: Array.from(globalMonitoringService.activeMonitors.keys()),
            total_available: Object.keys(globalMonitoringService.monitoringNetworks).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/indicators', verifyToken, async (req, res) => {
    try {
        res.json({
            indicators: globalMonitoringService.getAvailableIndicators(),
            total: Object.keys(globalMonitoringService.biodiversityIndicators).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/network/setup', verifyToken, async (req, res) => {
    try {
        const {
            regions = [],
            species_groups = [],
            indicators = [],
            alert_thresholds = {},
            data_sources = [],
            update_frequency = 'daily'
        } = req.body;

        if (!regions || regions.length === 0) {
            return res.status(400).json({ error: 'At least one region must be specified' });
        }

        const networkId = globalMonitoringService.generateNetworkId();

        const result = await globalMonitoringService.setupMonitoringNetwork(networkId, {
            regions,
            species_groups,
            indicators,
            alert_thresholds,
            data_sources,
            update_frequency
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/analysis/run', verifyToken, async (req, res) => {
    try {
        const {
            network_id,
            time_period = { start: '2020-01-01', end: new Date().toISOString().split('T')[0] },
            analysis_type = 'trend_analysis',
            indicators = [],
            regions = []
        } = req.body;

        if (!network_id) {
            return res.status(400).json({ error: 'Network ID is required' });
        }

        const analysisId = globalMonitoringService.generateAnalysisId();

        globalMonitoringService.runMonitoringAnalysis(analysisId, {
            network_id,
            time_period,
            analysis_type,
            indicators,
            regions
        }).catch(error => {
            console.error(`Monitoring analysis ${analysisId} failed:`, error);
        });

        res.json({
            success: true,
            analysisId,
            message: 'Monitoring analysis started',
            network_id,
            time_period,
            analysis_type,
            estimatedDuration: '3-10 minutes'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analysis/:analysisId/status', verifyToken, async (req, res) => {
    try {
        const { analysisId } = req.params;
        const status = await globalMonitoringService.getAnalysisStatus(analysisId);

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
        const status = await globalMonitoringService.getAnalysisStatus(analysisId);

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

router.get('/alerts', verifyToken, async (req, res) => {
    try {
        const { status = 'active', severity, limit = 50 } = req.query;

        let alerts = await globalMonitoringService.loadExistingAlerts();

        if (status !== 'all') {
            alerts = alerts.filter(alert => alert.status === status);
        }

        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        alerts = alerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));

        res.json({
            alerts,
            total: alerts.length,
            filters: { status, severity, limit }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/alert/:alertId/status', verifyToken, async (req, res) => {
    try {
        const { alertId } = req.params;
        const { status } = req.body;

        if (!['active', 'acknowledged', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be: active, acknowledged, resolved, or dismissed' });
        }

        const alerts = await globalMonitoringService.loadExistingAlerts();
        const alertIndex = alerts.findIndex(alert => alert.id === alertId);

        if (alertIndex === -1) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        alerts[alertIndex].status = status;
        alerts[alertIndex].updatedAt = new Date().toISOString();

        const alertsFile = path.join(globalMonitoringService.monitoringDataPath, 'alerts.json');
        await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));

        res.json({
            success: true,
            alert: alerts[alertIndex],
            message: `Alert status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/networks/active', verifyToken, async (req, res) => {
    try {
        const networks = Array.from(globalMonitoringService.activeMonitors.entries()).map(([networkId, config]) => ({
            networkId,
            regions: config.regions,
            indicators: config.indicators,
            data_sources: config.data_sources,
            status: config.status,
            last_update: config.last_update
        }));

        res.json({
            networks,
            total: networks.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/dashboard/summary', verifyToken, async (req, res) => {
    try {
        const alerts = await globalMonitoringService.loadExistingAlerts();
        const activeNetworks = Array.from(globalMonitoringService.activeMonitors.values());

        const summary = {
            total_networks: activeNetworks.length,
            active_alerts: alerts.filter(a => a.status === 'active').length,
            critical_alerts: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
            total_regions: [...new Set(activeNetworks.flatMap(n => n.regions))].length,
            monitored_indicators: [...new Set(activeNetworks.flatMap(n => n.indicators))].length,
            recent_alerts: alerts
                .filter(a => a.status === 'active')
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5),
            system_health: globalMonitoringService.getSystemHealth()
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper methods for GlobalMonitoringService
globalMonitoringService.getAnalysisStatus = async function(analysisId) {
    if (this.activeMonitors.has(analysisId)) {
        return this.activeMonitors.get(analysisId);
    }

    try {
        const statusFile = path.join(this.monitoringDataPath, `${analysisId}_status.json`);
        const statusData = await fs.readFile(statusFile, 'utf8');
        const status = JSON.parse(statusData);
        this.activeMonitors.set(analysisId, status);
        return status;
    } catch (error) {
        return null;
    }
};

globalMonitoringService.getSystemHealth = function() {
    const activeNetworks = Array.from(this.activeMonitors.values());
    const totalNetworks = activeNetworks.length;
    const healthyNetworks = activeNetworks.filter(n => n.status === 'active').length;

    let healthStatus = 'healthy';
    if (healthyNetworks < totalNetworks * 0.8) healthStatus = 'warning';
    if (healthyNetworks < totalNetworks * 0.5) healthStatus = 'critical';

    return {
        status: healthStatus,
        active_networks: healthyNetworks,
        total_networks: totalNetworks,
        uptime_percentage: healthyNetworks / Math.max(totalNetworks, 1) * 100,
        last_check: new Date().toISOString()
    };
};

module.exports = router;