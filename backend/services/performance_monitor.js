const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            model_response_times: new Map(),
            accuracy_trends: new Map(),
            fallback_usage: new Map(),
            user_satisfaction: new Map(),
            system_load: [],
            api_calls: new Map()
        };

        this.maxEntriesPerModel = 1000;
        this.performanceLogPath = path.join(__dirname, '../logs/performance.json');
        this.initializeLogging();
    }

    async initializeLogging() {
        try {
            await fs.mkdir(path.dirname(this.performanceLogPath), { recursive: true });
        } catch (error) {
            console.warn('Performance logging directory creation failed:', error);
        }
    }

    trackModelPerformance(modelName, responseTime, accuracy, success, metadata = {}) {
        if (!this.metrics.model_response_times.has(modelName)) {
            this.metrics.model_response_times.set(modelName, []);
            this.metrics.accuracy_trends.set(modelName, []);
            this.metrics.fallback_usage.set(modelName, []);
        }

        const timestamp = Date.now();
        const performanceEntry = {
            timestamp,
            response_time: responseTime,
            accuracy: accuracy,
            success: success,
            ...metadata
        };

        // Track response times
        const responseTimes = this.metrics.model_response_times.get(modelName);
        responseTimes.push(performanceEntry);

        // Track accuracy trends
        const accuracyTrends = this.metrics.accuracy_trends.get(modelName);
        accuracyTrends.push({
            timestamp,
            accuracy,
            success
        });

        // Track fallback usage
        if (metadata.fallback_used) {
            const fallbackUsage = this.metrics.fallback_usage.get(modelName);
            fallbackUsage.push({
                timestamp,
                fallback_reason: metadata.fallback_reason,
                original_model: metadata.original_model
            });
        }

        // Maintain size limits
        this.maintainSizeLimits(modelName);

        // Log to file periodically
        if (Math.random() < 0.1) { // 10% chance to log
            this.persistMetrics();
        }
    }

    trackSystemLoad(cpuUsage, memoryUsage, networkUsage) {
        this.metrics.system_load.push({
            timestamp: Date.now(),
            cpu: cpuUsage,
            memory: memoryUsage,
            network: networkUsage
        });

        // Keep only last 100 system load entries
        if (this.metrics.system_load.length > 100) {
            this.metrics.system_load = this.metrics.system_load.slice(-100);
        }
    }

    trackApiCall(endpoint, method, responseTime, statusCode, userAgent = '') {
        const key = `${method}:${endpoint}`;

        if (!this.metrics.api_calls.has(key)) {
            this.metrics.api_calls.set(key, []);
        }

        const calls = this.metrics.api_calls.get(key);
        calls.push({
            timestamp: Date.now(),
            response_time: responseTime,
            status_code: statusCode,
            user_agent: userAgent
        });

        // Keep only last 500 calls per endpoint
        if (calls.length > 500) {
            calls.splice(0, calls.length - 500);
        }
    }

    trackUserSatisfaction(userId, rating, feedback = '') {
        if (!this.metrics.user_satisfaction.has(userId)) {
            this.metrics.user_satisfaction.set(userId, []);
        }

        const satisfactionData = this.metrics.user_satisfaction.get(userId);
        satisfactionData.push({
            timestamp: Date.now(),
            rating: Math.max(1, Math.min(5, rating)), // Ensure 1-5 rating
            feedback: feedback
        });

        // Keep only last 50 ratings per user
        if (satisfactionData.length > 50) {
            satisfactionData.splice(0, satisfactionData.length - 50);
        }
    }

    getPerformanceReport(timeRange = 3600000) { // Default: last hour
        const now = Date.now();
        const cutoff = now - timeRange;

        const report = {
            timestamp: now,
            time_range: timeRange,
            models: {},
            system_health: this.getSystemHealthReport(),
            api_performance: this.getApiPerformanceReport(cutoff),
            user_satisfaction: this.getUserSatisfactionReport(),
            recommendations: []
        };

        // Analyze each model's performance
        for (const [modelName, responseTimes] of this.metrics.model_response_times.entries()) {
            const recentData = responseTimes.filter(entry => entry.timestamp >= cutoff);

            if (recentData.length === 0) continue;

            const successfulCalls = recentData.filter(d => d.success);
            const avgResponseTime = successfulCalls.reduce((sum, d) => sum + d.response_time, 0) / successfulCalls.length;
            const avgAccuracy = successfulCalls.reduce((sum, d) => sum + d.accuracy, 0) / successfulCalls.length;
            const successRate = successfulCalls.length / recentData.length;

            // Calculate trends
            const trend = this.calculateTrend(recentData);

            report.models[modelName] = {
                average_response_time: avgResponseTime,
                average_accuracy: avgAccuracy,
                success_rate: successRate,
                total_calls: recentData.length,
                successful_calls: successfulCalls.length,
                trend: trend,
                performance_score: this.calculatePerformanceScore(avgResponseTime, avgAccuracy, successRate)
            };
        }

        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);

        return report;
    }

    calculateTrend(recentData) {
        if (recentData.length < 10) return 'insufficient_data';

        const midPoint = Math.floor(recentData.length / 2);
        const firstHalf = recentData.slice(0, midPoint);
        const secondHalf = recentData.slice(midPoint);

        const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.accuracy, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.accuracy, 0) / secondHalf.length;

        const improvement = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        if (improvement > 5) return 'improving';
        if (improvement < -5) return 'declining';
        return 'stable';
    }

    calculatePerformanceScore(avgResponseTime, avgAccuracy, successRate) {
        // Normalize to 0-100 scale
        const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // Lower is better
        const accuracyScore = avgAccuracy * 100;
        const reliabilityScore = successRate * 100;

        return (responseTimeScore * 0.3 + accuracyScore * 0.4 + reliabilityScore * 0.3);
    }

    getSystemHealthReport() {
        if (this.metrics.system_load.length === 0) {
            return { status: 'unknown', message: 'No system metrics available' };
        }

        const recentLoad = this.metrics.system_load[this.metrics.system_load.length - 1];
        const avgLoad = this.metrics.system_load.reduce((acc, load) => ({
            cpu: acc.cpu + load.cpu,
            memory: acc.memory + load.memory,
            network: acc.network + load.network
        }), { cpu: 0, memory: 0, network: 0 });

        const count = this.metrics.system_load.length;
        avgLoad.cpu /= count;
        avgLoad.memory /= count;
        avgLoad.network /= count;

        let status = 'healthy';
        let message = 'System operating normally';

        if (avgLoad.cpu > 80 || avgLoad.memory > 80) {
            status = 'warning';
            message = 'High system load detected';
        }

        if (avgLoad.cpu > 95 || avgLoad.memory > 95) {
            status = 'critical';
            message = 'Critical system load - performance may be degraded';
        }

        return {
            status,
            message,
            current_load: recentLoad,
            average_load: avgLoad,
            timestamp: Date.now()
        };
    }

    getApiPerformanceReport(cutoff) {
        const apiReport = {};

        for (const [endpoint, calls] of this.metrics.api_calls.entries()) {
            const recentCalls = calls.filter(call => call.timestamp >= cutoff);

            if (recentCalls.length === 0) continue;

            const avgResponseTime = recentCalls.reduce((sum, call) => sum + call.response_time, 0) / recentCalls.length;
            const errorRate = recentCalls.filter(call => call.status_code >= 400).length / recentCalls.length;

            apiReport[endpoint] = {
                average_response_time: avgResponseTime,
                error_rate: errorRate,
                total_calls: recentCalls.length,
                status_codes: this.groupStatusCodes(recentCalls)
            };
        }

        return apiReport;
    }

    groupStatusCodes(calls) {
        const codes = {};
        calls.forEach(call => {
            const code = Math.floor(call.status_code / 100) * 100;
            codes[code] = (codes[code] || 0) + 1;
        });
        return codes;
    }

    getUserSatisfactionReport() {
        if (this.metrics.user_satisfaction.size === 0) {
            return { average_rating: 0, total_ratings: 0, distribution: {} };
        }

        let totalRating = 0;
        let totalCount = 0;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        for (const [userId, ratings] of this.metrics.user_satisfaction.entries()) {
            ratings.forEach(rating => {
                totalRating += rating.rating;
                totalCount++;
                distribution[rating.rating]++;
            });
        }

        return {
            average_rating: totalCount > 0 ? totalRating / totalCount : 0,
            total_ratings: totalCount,
            distribution: distribution
        };
    }

    generateRecommendations(report) {
        const recommendations = [];

        // Model performance recommendations
        for (const [modelName, metrics] of Object.entries(report.models)) {
            if (metrics.success_rate < 0.8) {
                recommendations.push(`Consider optimizing ${modelName} - success rate is ${Math.round(metrics.success_rate * 100)}%`);
            }

            if (metrics.average_response_time > 5000) {
                recommendations.push(`${modelName} response time is slow (${Math.round(metrics.average_response_time)}ms) - consider optimization`);
            }

            if (metrics.trend === 'declining') {
                recommendations.push(`${modelName} performance is declining - investigate potential issues`);
            }
        }

        // System health recommendations
        const systemHealth = report.system_health;
        if (systemHealth.status === 'warning') {
            recommendations.push('System load is high - consider scaling resources');
        } else if (systemHealth.status === 'critical') {
            recommendations.push('Critical system load detected - immediate action required');
        }

        // API performance recommendations
        for (const [endpoint, metrics] of Object.entries(report.api_performance)) {
            if (metrics.error_rate > 0.1) {
                recommendations.push(`${endpoint} has high error rate (${Math.round(metrics.error_rate * 100)}%) - investigate issues`);
            }

            if (metrics.average_response_time > 2000) {
                recommendations.push(`${endpoint} is slow (${Math.round(metrics.average_response_time)}ms) - consider optimization`);
            }
        }

        return recommendations;
    }

    maintainSizeLimits(modelName) {
        const responseTimes = this.metrics.model_response_times.get(modelName);
        const accuracyTrends = this.metrics.accuracy_trends.get(modelName);
        const fallbackUsage = this.metrics.fallback_usage.get(modelName);

        // Maintain size limits
        if (responseTimes.length > this.maxEntriesPerModel) {
            responseTimes.splice(0, responseTimes.length - this.maxEntriesPerModel);
        }

        if (accuracyTrends.length > this.maxEntriesPerModel) {
            accuracyTrends.splice(0, accuracyTrends.length - this.maxEntriesPerModel);
        }

        if (fallbackUsage.length > this.maxEntriesPerModel) {
            fallbackUsage.splice(0, fallbackUsage.length - this.maxEntriesPerModel);
        }
    }

    async persistMetrics() {
        try {
            const metricsToSave = {
                timestamp: Date.now(),
                metrics: Object.fromEntries(
                    Array.from(this.metrics.model_response_times.entries()).map(([key, value]) => [
                        key,
                        value.slice(-100) // Save only last 100 entries
                    ])
                ),
                system_load: this.metrics.system_load.slice(-50),
                summary: this.getPerformanceReport(3600000) // Last hour summary
            };

            await fs.writeFile(this.performanceLogPath, JSON.stringify(metricsToSave, null, 2));
        } catch (error) {
            console.warn('Failed to persist performance metrics:', error);
        }
    }

    async loadPersistedMetrics() {
        try {
            const data = await fs.readFile(this.performanceLogPath, 'utf8');
            const persisted = JSON.parse(data);

            // Restore metrics (basic implementation)
            if (persisted.metrics) {
                for (const [modelName, data] of Object.entries(persisted.metrics)) {
                    if (!this.metrics.model_response_times.has(modelName)) {
                        this.metrics.model_response_times.set(modelName, data);
                    }
                }
            }
        } catch (error) {
            // File doesn't exist or is corrupted - start fresh
            console.log('No persisted metrics found, starting fresh');
        }
    }

    getCacheStats() {
        const stats = {
            models_tracked: this.metrics.model_response_times.size,
            total_measurements: 0,
            system_load_entries: this.metrics.system_load.length,
            api_endpoints_tracked: this.metrics.api_calls.size,
            users_with_feedback: this.metrics.user_satisfaction.size
        };

        for (const measurements of this.metrics.model_response_times.values()) {
            stats.total_measurements += measurements.length;
        }

        return stats;
    }

    // Cleanup old data
    cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const cutoff = Date.now() - maxAge;

        for (const [modelName, measurements] of this.metrics.model_response_times.entries()) {
            const filtered = measurements.filter(m => m.timestamp >= cutoff);
            this.metrics.model_response_times.set(modelName, filtered);
        }

        for (const [modelName, trends] of this.metrics.accuracy_trends.entries()) {
            const filtered = trends.filter(t => t.timestamp >= cutoff);
            this.metrics.accuracy_trends.set(modelName, filtered);
        }

        for (const [modelName, fallbacks] of this.metrics.fallback_usage.entries()) {
            const filtered = fallbacks.filter(f => f.timestamp >= cutoff);
            this.metrics.fallback_usage.set(modelName, filtered);
        }

        this.metrics.system_load = this.metrics.system_load.filter(load => load.timestamp >= cutoff);

        for (const [endpoint, calls] of this.metrics.api_calls.entries()) {
            const filtered = calls.filter(call => call.timestamp >= cutoff);
            this.metrics.api_calls.set(endpoint, filtered);
        }

        console.log(`Cleaned up data older than ${maxAge / (24 * 60 * 60 * 1000)} days`);
    }
}

module.exports = new PerformanceMonitor();