const performanceMonitor = require('./performance_monitor');

class AdaptiveModelSelector {
    constructor() {
        this.modelPerformance = new Map();
        this.userPreferences = new Map();
        this.systemLoad = { cpu: 0, memory: 0, network: 0 };
        this.modelCompatibility = new Map();
        this.lastSelectionTime = 0;
        this.selectionHistory = [];

        this.initializeModelCompatibility();
    }

    initializeModelCompatibility() {
        // Define model capabilities and requirements
        this.modelCompatibility.set('nucleotide-transformer-2.5b', {
            capabilities: ['species_classification', 'novelty_detection', 'sequence_embedding'],
            requirements: { min_sequence_length: 50, max_sequence_length: 10000 },
            performance_profile: { speed: 'medium', accuracy: 'high', resource_usage: 'high' },
            local: false,
            cost_per_request: 0.02
        });

        this.modelCompatibility.set('hyenadna', {
            capabilities: ['species_classification', 'novelty_detection', 'long_sequence_analysis'],
            requirements: { min_sequence_length: 1000, max_sequence_length: 100000 },
            performance_profile: { speed: 'slow', accuracy: 'very_high', resource_usage: 'very_high' },
            local: false,
            cost_per_request: 0.05
        });

        this.modelCompatibility.set('codellama-dna', {
            capabilities: ['species_classification', 'sequence_analysis', 'pattern_recognition'],
            requirements: { min_sequence_length: 10, max_sequence_length: 5000 },
            performance_profile: { speed: 'fast', accuracy: 'medium', resource_usage: 'medium' },
            local: true,
            cost_per_request: 0.001
        });

        this.modelCompatibility.set('llama2-dna', {
            capabilities: ['species_classification', 'contextual_analysis', 'literature_integration'],
            requirements: { min_sequence_length: 20, max_sequence_length: 2000 },
            performance_profile: { speed: 'medium', accuracy: 'high', resource_usage: 'high' },
            local: true,
            cost_per_request: 0.002
        });

        this.modelCompatibility.set('mistral-dna', {
            capabilities: ['species_classification', 'efficiency_focused', 'multilingual_support'],
            requirements: { min_sequence_length: 15, max_sequence_length: 4000 },
            performance_profile: { speed: 'fast', accuracy: 'medium', resource_usage: 'low' },
            local: true,
            cost_per_request: 0.001
        });

        this.modelCompatibility.set('qiime2-lite', {
            capabilities: ['microbiome_analysis', 'diversity_analysis', 'taxonomy_classification'],
            requirements: { min_sequence_length: 100, max_sequence_length: 10000, min_sequences: 3 },
            performance_profile: { speed: 'medium', accuracy: 'high', resource_usage: 'medium' },
            local: true,
            cost_per_request: 0.005
        });

        this.modelCompatibility.set('microbiome-pipeline', {
            capabilities: ['microbiome_analysis', 'clustering', 'diversity_metrics'],
            requirements: { min_sequence_length: 50, max_sequence_length: 5000, min_sequences: 3 },
            performance_profile: { speed: 'fast', accuracy: 'medium', resource_usage: 'low' },
            local: true,
            cost_per_request: 0.003
        });

        this.modelCompatibility.set('caduceus', {
            capabilities: ['dna_sequence_modeling', 'long_range_dependencies', 'structure_prediction'],
            requirements: { min_sequence_length: 500, max_sequence_length: 50000 },
            performance_profile: { speed: 'slow', accuracy: 'high', resource_usage: 'high' },
            local: true,
            cost_per_request: 0.008
        });

        this.modelCompatibility.set('mamba-dna', {
            capabilities: ['efficient_sequence_modeling', 'long_context', 'fast_inference'],
            requirements: { min_sequence_length: 100, max_sequence_length: 25000 },
            performance_profile: { speed: 'fast', accuracy: 'medium', resource_usage: 'medium' },
            local: true,
            cost_per_request: 0.004
        });
    }

    selectOptimalModels(task, userId, sequences, constraints = {}) {
        const startTime = Date.now();
        const availableModels = this.getAvailableModels();
        const userPrefs = this.userPreferences.get(userId) || {};
        const systemLoad = this.getCurrentSystemLoad();
        const sequenceCharacteristics = this.analyzeSequenceCharacteristics(sequences);

        // Score each model
        const scoredModels = availableModels.map(model => ({
            ...model,
            score: this.calculateModelScore(model, task, userPrefs, systemLoad, sequenceCharacteristics, constraints)
        }));

        // Sort by score and select top models
        scoredModels.sort((a, b) => b.score - a.score);

        const selectedModels = scoredModels.slice(0, constraints.max_models || 5);

        // Record selection for learning
        this.recordSelection(task, userId, selectedModels, sequences.length, Date.now() - startTime);

        return selectedModels;
    }

    calculateModelScore(model, task, userPrefs, systemLoad, sequenceCharacteristics, constraints) {
        let score = 0;
        const modelInfo = this.modelCompatibility.get(model.name);

        if (!modelInfo) return 0;

        // Task suitability (35%)
        score += this.getTaskSuitability(modelInfo, task) * 0.35;

        // Performance history (25%)
        score += this.getPerformanceScore(model.name, task) * 0.25;

        // User preferences (15%)
        score += this.getUserPreferenceScore(model.name, userPrefs) * 0.15;

        // System load compatibility (10%)
        score += this.getSystemLoadScore(modelInfo, systemLoad) * 0.10;

        // Sequence compatibility (10%)
        score += this.getSequenceCompatibilityScore(modelInfo, sequenceCharacteristics) * 0.10;

        // Cost efficiency (5%)
        score += this.getCostEfficiencyScore(modelInfo, constraints.budget_limit) * 0.05;

        return Math.max(0, Math.min(100, score));
    }

    getTaskSuitability(modelInfo, task) {
        if (!modelInfo.capabilities.includes(task)) {
            return 0; // Model doesn't support this task
        }

        // Base suitability for supported tasks
        const suitabilityMap = {
            'species_classification': 80,
            'novelty_detection': 70,
            'microbiome_analysis': 60,
            'sequence_embedding': 50,
            'long_sequence_analysis': 40,
            'pattern_recognition': 45,
            'contextual_analysis': 55,
            'efficiency_focused': 65,
            'clustering': 50,
            'diversity_metrics': 45,
            'dna_sequence_modeling': 60,
            'structure_prediction': 55,
            'long_context': 50,
            'fast_inference': 75,
            'taxonomy_classification': 70
        };

        return suitabilityMap[task] || 50;
    }

    getPerformanceScore(modelName, task) {
        const performanceData = performanceMonitor.getPerformanceReport(3600000); // Last hour
        const modelMetrics = performanceData.models[modelName];

        if (!modelMetrics) return 50; // Neutral score for unknown models

        // Combine accuracy, success rate, and response time
        const accuracyScore = modelMetrics.average_accuracy * 100;
        const reliabilityScore = modelMetrics.success_rate * 100;
        const speedScore = Math.max(0, 100 - (modelMetrics.average_response_time / 100)); // Lower time = higher score

        return (accuracyScore * 0.4 + reliabilityScore * 0.4 + speedScore * 0.2);
    }

    getUserPreferenceScore(modelName, userPrefs) {
        if (userPrefs.preferred_models?.includes(modelName)) return 100;
        if (userPrefs.avoided_models?.includes(modelName)) return 0;

        // Check historical performance for this user
        const userHistory = userPrefs.history || [];
        const modelUsage = userHistory.filter(h => h.model === modelName);

        if (modelUsage.length === 0) return 50; // Neutral

        const avgSatisfaction = modelUsage.reduce((sum, h) => sum + (h.satisfaction || 3), 0) / modelUsage.length;
        return (avgSatisfaction / 5) * 100; // Convert 1-5 scale to 0-100
    }

    getSystemLoadScore(modelInfo, systemLoad) {
        const resourceUsage = modelInfo.performance_profile.resource_usage;

        // Prefer lightweight models when system is busy
        if (systemLoad.cpu > 80 || systemLoad.memory > 80) {
            switch (resourceUsage) {
                case 'low': return 100;
                case 'medium': return 70;
                case 'high': return 40;
                case 'very_high': return 20;
                default: return 50;
            }
        }

        // Normal load - prefer accuracy over speed
        switch (resourceUsage) {
            case 'low': return 60;
            case 'medium': return 80;
            case 'high': return 90;
            case 'very_high': return 100;
            default: return 50;
        }
    }

    getSequenceCompatibilityScore(modelInfo, sequenceCharacteristics) {
        const requirements = modelInfo.requirements;

        // Check sequence length compatibility
        const avgLength = sequenceCharacteristics.average_length;
        if (avgLength < requirements.min_sequence_length || avgLength > requirements.max_sequence_length) {
            return 20; // Poor compatibility
        }

        // Check sequence count for microbiome models
        if (requirements.min_sequences && sequenceCharacteristics.count < requirements.min_sequences) {
            return 30; // Insufficient sequences
        }

        // Length is in optimal range
        if (avgLength >= requirements.min_sequence_length * 1.2 && avgLength <= requirements.max_sequence_length * 0.8) {
            return 100; // Perfect match
        }

        return 80; // Good match
    }

    getCostEfficiencyScore(modelInfo, budgetLimit) {
        if (!budgetLimit) return 50; // No budget constraint

        const costPerRequest = modelInfo.cost_per_request;

        if (costPerRequest <= budgetLimit * 0.1) return 100; // Very cheap
        if (costPerRequest <= budgetLimit * 0.3) return 80;  // Reasonable
        if (costPerRequest <= budgetLimit * 0.5) return 60;  // Moderate
        if (costPerRequest <= budgetLimit) return 40;       // Expensive but within budget

        return 20; // Too expensive
    }

    analyzeSequenceCharacteristics(sequences) {
        if (!sequences || sequences.length === 0) {
            return { count: 0, average_length: 0, length_variance: 0 };
        }

        const lengths = sequences.map(seq => seq.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

        return {
            count: sequences.length,
            average_length: avgLength,
            length_variance: variance,
            min_length: Math.min(...lengths),
            max_length: Math.max(...lengths),
            length_distribution: this.categorizeLengths(lengths)
        };
    }

    categorizeLengths(lengths) {
        return {
            short: lengths.filter(l => l < 500).length,
            medium: lengths.filter(l => l >= 500 && l < 2000).length,
            long: lengths.filter(l => l >= 2000 && l < 10000).length,
            very_long: lengths.filter(l => l >= 10000).length
        };
    }

    getAvailableModels() {
        return Array.from(this.modelCompatibility.entries()).map(([name, info]) => ({
            name,
            local: info.local,
            capabilities: info.capabilities,
            performance_profile: info.performance_profile,
            cost_per_request: info.cost_per_request
        }));
    }

    getCurrentSystemLoad() {
        // In a real implementation, this would query system metrics
        // For now, return mock data
        return {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            network: Math.random() * 100,
            timestamp: Date.now()
        };
    }

    recordSelection(task, userId, selectedModels, sequenceCount, selectionTime) {
        this.selectionHistory.push({
            timestamp: Date.now(),
            task,
            userId,
            selectedModels: selectedModels.map(m => m.name),
            sequenceCount,
            selectionTime,
            systemLoad: this.systemLoad
        });

        // Keep only last 1000 selections
        if (this.selectionHistory.length > 1000) {
            this.selectionHistory = this.selectionHistory.slice(-1000);
        }
    }

    updateUserPreferences(userId, modelName, satisfaction, feedback = '') {
        if (!this.userPreferences.has(userId)) {
            this.userPreferences.set(userId, {
                preferred_models: [],
                avoided_models: [],
                history: []
            });
        }

        const prefs = this.userPreferences.get(userId);

        // Record interaction
        prefs.history.push({
            timestamp: Date.now(),
            model: modelName,
            satisfaction,
            feedback
        });

        // Keep only last 100 interactions
        if (prefs.history.length > 100) {
            prefs.history = prefs.history.slice(-100);
        }

        // Update preferences based on satisfaction
        if (satisfaction >= 4) {
            if (!prefs.preferred_models.includes(modelName)) {
                prefs.preferred_models.push(modelName);
            }
            // Remove from avoided if present
            prefs.avoided_models = prefs.avoided_models.filter(m => m !== modelName);
        } else if (satisfaction <= 2) {
            if (!prefs.avoided_models.includes(modelName)) {
                prefs.avoided_models.push(modelName);
            }
            // Remove from preferred if present
            prefs.preferred_models = prefs.preferred_models.filter(m => m !== modelName);
        }

        // Limit preference lists
        if (prefs.preferred_models.length > 10) {
            prefs.preferred_models = prefs.preferred_models.slice(-10);
        }
        if (prefs.avoided_models.length > 5) {
            prefs.avoided_models = prefs.avoided_models.slice(-5);
        }
    }

    getModelRecommendations(userId, task, constraints = {}) {
        const userPrefs = this.userPreferences.get(userId) || {};
        const recommendations = [];

        // Get user's most successful models for this task
        const taskHistory = userPrefs.history?.filter(h => {
            const modelInfo = this.modelCompatibility.get(h.model);
            return modelInfo && modelInfo.capabilities.includes(task) && h.satisfaction >= 4;
        }) || [];

        if (taskHistory.length > 0) {
            const topModels = this.getTopModelsBySatisfaction(taskHistory);
            recommendations.push({
                type: 'personalized',
                models: topModels,
                reason: 'Based on your successful past interactions'
            });
        }

        // Get high-performance models for this task
        const highPerfModels = this.getHighPerformanceModels(task);
        if (highPerfModels.length > 0) {
            recommendations.push({
                type: 'performance_based',
                models: highPerfModels,
                reason: 'High-performance models for this task'
            });
        }

        // Get cost-effective options
        if (constraints.budget_conscious) {
            const cheapModels = this.getCostEffectiveModels(task);
            recommendations.push({
                type: 'cost_effective',
                models: cheapModels,
                reason: 'Cost-effective options'
            });
        }

        return recommendations;
    }

    getTopModelsBySatisfaction(history) {
        const modelStats = {};

        history.forEach(h => {
            if (!modelStats[h.model]) {
                modelStats[h.model] = { total: 0, count: 0 };
            }
            modelStats[h.model].total += h.satisfaction;
            modelStats[h.model].count += 1;
        });

        return Object.entries(modelStats)
            .map(([model, stats]) => ({
                model,
                avg_satisfaction: stats.total / stats.count
            }))
            .sort((a, b) => b.avg_satisfaction - a.avg_satisfaction)
            .slice(0, 3);
    }

    getHighPerformanceModels(task) {
        const performanceData = performanceMonitor.getPerformanceReport(3600000);
        const taskModels = Array.from(this.modelCompatibility.entries())
            .filter(([_, info]) => info.capabilities.includes(task))
            .map(([name, info]) => ({ name, info, metrics: performanceData.models[name] }))
            .filter(m => m.metrics && m.metrics.success_rate > 0.8)
            .sort((a, b) => b.metrics.average_accuracy - a.metrics.average_accuracy)
            .slice(0, 3);

        return taskModels.map(m => ({
            model: m.name,
            accuracy: m.metrics.average_accuracy,
            response_time: m.metrics.average_response_time
        }));
    }

    getCostEffectiveModels(task) {
        return Array.from(this.modelCompatibility.entries())
            .filter(([_, info]) => info.capabilities.includes(task))
            .sort((a, b) => a[1].cost_per_request - b[1].cost_per_request)
            .slice(0, 3)
            .map(([name, info]) => ({
                model: name,
                cost_per_request: info.cost_per_request,
                local: info.local
            }));
    }

    getSelectionAnalytics(timeRange = 86400000) { // 24 hours default
        const cutoff = Date.now() - timeRange;
        const recentSelections = this.selectionHistory.filter(s => s.timestamp >= cutoff);

        const analytics = {
            total_selections: recentSelections.length,
            average_selection_time: 0,
            popular_models: {},
            task_distribution: {},
            user_distribution: {},
            performance_trends: {}
        };

        if (recentSelections.length === 0) return analytics;

        // Calculate average selection time
        analytics.average_selection_time = recentSelections.reduce((sum, s) => sum + s.selectionTime, 0) / recentSelections.length;

        // Count popular models
        recentSelections.forEach(selection => {
            selection.selectedModels.forEach(model => {
                analytics.popular_models[model] = (analytics.popular_models[model] || 0) + 1;
            });

            analytics.task_distribution[selection.task] = (analytics.task_distribution[selection.task] || 0) + 1;
            analytics.user_distribution[selection.userId] = (analytics.user_distribution[selection.userId] || 0) + 1;
        });

        return analytics;
    }
}

module.exports = new AdaptiveModelSelector();