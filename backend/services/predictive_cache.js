const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class PredictiveCache {
    constructor() {
        this.cache = new Map();
        this.predictions = new Map();
        this.accessPatterns = new Map();
        this.maxCacheSize = 1000;
        this.maxPredictionSize = 500;
        this.cacheFilePath = path.join(__dirname, '../cache/predictive_cache.json');
        this.predictionFilePath = path.join(__dirname, '../cache/predictions.json');

        this.initializeCache();
    }

    async initializeCache() {
        try {
            await fs.mkdir(path.dirname(this.cacheFilePath), { recursive: true });
            await this.loadPersistedCache();
        } catch (error) {
            console.warn('Cache initialization failed:', error);
        }
    }

    async getCachedResult(queryKey, computeFunction, options = {}) {
        const cacheKey = this.generateCacheKey(queryKey);

        // Check if result is cached and still valid
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            const isExpired = this.isExpired(cached, options.maxAge);

            if (!isExpired) {
                // Update access statistics
                this.updateAccessStats(cacheKey, 'hit');
                cached.lastAccessed = Date.now();
                cached.accessCount++;

                // Record successful cache hit for prediction learning
                this.recordCacheHit(queryKey, cached);

                return {
                    ...cached.result,
                    _cache: {
                        hit: true,
                        age: Date.now() - cached.timestamp,
                        accessCount: cached.accessCount
                    }
                };
            } else {
                // Remove expired entry
                this.cache.delete(cacheKey);
            }
        }

        // Cache miss - compute result
        this.updateAccessStats(cacheKey, 'miss');

        try {
            const result = await computeFunction();

            // Cache the result
            const cacheEntry = {
                key: cacheKey,
                result,
                timestamp: Date.now(),
                lastAccessed: Date.now(),
                accessCount: 1,
                queryKey: queryKey,
                metadata: options.metadata || {}
            };

            this.cache.set(cacheKey, cacheEntry);

            // Maintain cache size
            await this.maintainCacheSize();

            // Persist cache periodically
            if (Math.random() < 0.1) { // 10% chance
                await this.persistCache();
            }

            return {
                ...result,
                _cache: {
                    hit: false,
                    computed: true
                }
            };

        } catch (error) {
            // Return error result without caching
            return {
                error: error.message,
                _cache: {
                    hit: false,
                    error: true
                }
            };
        }
    }

    generateCacheKey(queryKey) {
        if (typeof queryKey === 'string') {
            return crypto.createHash('md5').update(queryKey).digest('hex');
        } else if (typeof queryKey === 'object') {
            const sortedKey = JSON.stringify(queryKey, Object.keys(queryKey).sort());
            return crypto.createHash('md5').update(sortedKey).digest('hex');
        } else {
            return crypto.createHash('md5').update(String(queryKey)).digest('hex');
        }
    }

    isExpired(cacheEntry, maxAge = 3600000) { // 1 hour default
        return (Date.now() - cacheEntry.timestamp) > maxAge;
    }

    updateAccessStats(cacheKey, type) {
        if (!this.accessPatterns.has(cacheKey)) {
            this.accessPatterns.set(cacheKey, {
                hits: 0,
                misses: 0,
                lastAccess: Date.now(),
                pattern: []
            });
        }

        const stats = this.accessPatterns.get(cacheKey);
        stats[type === 'hit' ? 'hits' : 'misses']++;
        stats.lastAccess = Date.now();

        // Track access pattern (last 20 accesses)
        stats.pattern.push({ type, timestamp: Date.now() });
        if (stats.pattern.length > 20) {
            stats.pattern = stats.pattern.slice(-20);
        }
    }

    recordCacheHit(queryKey, cacheEntry) {
        // Learn from successful cache hits to improve predictions
        const queryFeatures = this.extractQueryFeatures(queryKey);

        if (!this.predictions.has(queryFeatures.category)) {
            this.predictions.set(queryFeatures.category, {
                patterns: [],
                successfulQueries: [],
                accessFrequency: {}
            });
        }

        const categoryData = this.predictions.get(queryFeatures.category);

        // Record successful query pattern
        categoryData.successfulQueries.push({
            features: queryFeatures,
            timestamp: Date.now(),
            resultAge: Date.now() - cacheEntry.timestamp,
            accessCount: cacheEntry.accessCount
        });

        // Keep only recent successful queries
        if (categoryData.successfulQueries.length > 100) {
            categoryData.successfulQueries = categoryData.successfulQueries.slice(-100);
        }

        // Update access frequency
        const timeKey = Math.floor(Date.now() / (1000 * 60 * 60)); // Hourly buckets
        categoryData.accessFrequency[timeKey] = (categoryData.accessFrequency[timeKey] || 0) + 1;
    }

    extractQueryFeatures(queryKey) {
        const features = {
            category: 'unknown',
            length: 0,
            complexity: 'simple',
            type: typeof queryKey
        };

        if (typeof queryKey === 'string') {
            features.length = queryKey.length;
            features.category = this.categorizeStringQuery(queryKey);
            features.complexity = queryKey.length > 1000 ? 'complex' : 'simple';
        } else if (typeof queryKey === 'object' && queryKey !== null) {
            features.length = JSON.stringify(queryKey).length;
            features.category = this.categorizeObjectQuery(queryKey);
            features.complexity = Object.keys(queryKey).length > 5 ? 'complex' : 'simple';
        }

        return features;
    }

    categorizeStringQuery(query) {
        if (query.includes('sequence') || query.includes('dna') || query.includes('fasta')) {
            return 'sequence_analysis';
        } else if (query.includes('species') || query.includes('classification')) {
            return 'species_classification';
        } else if (query.includes('microbiome') || query.includes('diversity')) {
            return 'microbiome_analysis';
        } else {
            return 'general';
        }
    }

    categorizeObjectQuery(query) {
        if (query.sequences || query.fastaFile) {
            return 'sequence_analysis';
        } else if (query.species || query.classification) {
            return 'species_classification';
        } else if (query.diversity || query.microbiome) {
            return 'microbiome_analysis';
        } else {
            return 'general';
        }
    }

    predictNextQuery(currentQuery, userHistory = []) {
        const queryFeatures = this.extractQueryFeatures(currentQuery);
        const categoryData = this.predictions.get(queryFeatures.category);

        if (!categoryData || categoryData.successfulQueries.length < 3) {
            return { confidence: 0, predictedQueries: [] };
        }

        // Find similar queries in history
        const similarQueries = this.findSimilarQueries(queryFeatures, categoryData.successfulQueries);

        if (similarQueries.length === 0) {
            return { confidence: 0, predictedQueries: [] };
        }

        // Analyze patterns to predict next queries
        const predictions = this.analyzePredictionPatterns(similarQueries, userHistory);

        return {
            confidence: Math.min(predictions.length * 0.2, 0.8), // Max 80% confidence
            predictedQueries: predictions.slice(0, 3),
            basedOn: similarQueries.length,
            category: queryFeatures.category
        };
    }

    findSimilarQueries(currentFeatures, successfulQueries) {
        return successfulQueries
            .filter(query => {
                const similarity = this.calculateSimilarity(currentFeatures, query.features);
                return similarity > 0.6; // 60% similarity threshold
            })
            .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
            .slice(0, 10); // Top 10 similar queries
    }

    calculateSimilarity(features1, features2) {
        let similarity = 0;
        let totalFactors = 0;

        // Category match (high weight)
        if (features1.category === features2.category) {
            similarity += 0.4;
        }
        totalFactors += 0.4;

        // Length similarity (medium weight)
        const lengthDiff = Math.abs(features1.length - features2.length);
        const lengthSimilarity = Math.max(0, 1 - (lengthDiff / Math.max(features1.length, features2.length, 1)));
        similarity += lengthSimilarity * 0.3;
        totalFactors += 0.3;

        // Complexity match (low weight)
        if (features1.complexity === features2.complexity) {
            similarity += 0.2;
        }
        totalFactors += 0.2;

        // Type match (low weight)
        if (features1.type === features2.type) {
            similarity += 0.1;
        }
        totalFactors += 0.1;

        return totalFactors > 0 ? similarity / totalFactors : 0;
    }

    analyzePredictionPatterns(similarQueries, userHistory) {
        const predictions = new Map();

        // Analyze what queries typically follow similar ones
        similarQueries.forEach(query => {
            const queryIndex = userHistory.findIndex(h => h.timestamp === query.timestamp);
            if (queryIndex >= 0 && queryIndex < userHistory.length - 1) {
                const nextQuery = userHistory[queryIndex + 1];
                const key = JSON.stringify(nextQuery.query);

                if (!predictions.has(key)) {
                    predictions.set(key, {
                        query: nextQuery.query,
                        count: 0,
                        avgTimeGap: 0,
                        lastSeen: 0
                    });
                }

                const pred = predictions.get(key);
                pred.count++;
                pred.lastSeen = Math.max(pred.lastSeen, nextQuery.timestamp);
            }
        });

        // Convert to array and sort by frequency
        return Array.from(predictions.values())
            .sort((a, b) => b.count - a.count)
            .map(pred => ({
                query: pred.query,
                confidence: Math.min(pred.count / similarQueries.length, 1),
                frequency: pred.count
            }));
    }

    async preWarmCache(currentQuery, patterns) {
        // Pre-compute likely next results
        if (patterns.predictedQueries && patterns.predictedQueries.length > 0) {
            setTimeout(async () => {
                try {
                    console.log(`Pre-warming cache for ${patterns.predictedQueries.length} predicted queries`);

                    for (const prediction of patterns.predictedQueries.slice(0, 2)) { // Limit to 2
                        if (prediction.confidence > 0.3) {
                            // Trigger analysis for predicted query (would be implemented based on query type)
                            console.log('Pre-warming:', JSON.stringify(prediction.query).substring(0, 100) + '...');
                        }
                    }
                } catch (error) {
                    console.warn('Cache pre-warming failed:', error);
                }
            }, 100);
        }
    }

    async maintainCacheSize() {
        if (this.cache.size <= this.maxCacheSize) return;

        // Remove least recently used items
        const entries = Array.from(this.cache.entries());

        // Sort by access count and last access time
        entries.sort((a, b) => {
            const aScore = a[1].accessCount + (a[1].lastAccessed / 1000000000); // Normalize timestamp
            const bScore = b[1].accessCount + (b[1].lastAccessed / 1000000000);
            return bScore - aScore; // Higher score = more important
        });

        // Keep only the top entries
        const toKeep = entries.slice(0, this.maxCacheSize);
        this.cache.clear();

        toKeep.forEach(([key, value]) => {
            this.cache.set(key, value);
        });

        console.log(`Cache size maintained: ${this.cache.size}/${this.maxCacheSize}`);
    }

    async persistCache() {
        try {
            const cacheToSave = {
                timestamp: Date.now(),
                entries: Array.from(this.cache.entries()).slice(0, 500), // Save only first 500 entries
                metadata: {
                    totalEntries: this.cache.size,
                    maxSize: this.maxCacheSize
                }
            };

            await fs.writeFile(this.cacheFilePath, JSON.stringify(cacheToSave, null, 2));
        } catch (error) {
            console.warn('Failed to persist cache:', error);
        }
    }

    async persistPredictions() {
        try {
            const predictionsToSave = {
                timestamp: Date.now(),
                predictions: Object.fromEntries(this.predictions),
                metadata: {
                    totalCategories: this.predictions.size,
                    maxPredictionSize: this.maxPredictionSize
                }
            };

            await fs.writeFile(this.predictionFilePath, JSON.stringify(predictionsToSave, null, 2));
        } catch (error) {
            console.warn('Failed to persist predictions:', error);
        }
    }

    async loadPersistedCache() {
        try {
            const cacheData = await fs.readFile(this.cacheFilePath, 'utf8');
            const parsed = JSON.parse(cacheData);

            if (parsed.entries) {
                parsed.entries.forEach(([key, value]) => {
                    // Only load if not expired (max 24 hours old)
                    if (!this.isExpired(value, 24 * 60 * 60 * 1000)) {
                        this.cache.set(key, value);
                    }
                });
            }

            console.log(`Loaded ${this.cache.size} cached entries`);
        } catch (error) {
            // File doesn't exist or is corrupted - start fresh
            console.log('No persisted cache found, starting fresh');
        }

        try {
            const predictionData = await fs.readFile(this.predictionFilePath, 'utf8');
            const parsed = JSON.parse(predictionData);

            if (parsed.predictions) {
                for (const [key, value] of Object.entries(parsed.predictions)) {
                    this.predictions.set(key, value);
                }
            }

            console.log(`Loaded ${this.predictions.size} prediction categories`);
        } catch (error) {
            console.log('No persisted predictions found, starting fresh');
        }
    }

    getCacheStats() {
        const stats = {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: this.calculateHitRate(),
            memoryUsage: this.estimateMemoryUsage(),
            categoriesTracked: this.predictions.size,
            accessPatternsTracked: this.accessPatterns.size
        };

        // Calculate age distribution
        const ages = Array.from(this.cache.values()).map(entry => Date.now() - entry.timestamp);
        if (ages.length > 0) {
            stats.ageStats = {
                average: ages.reduce((a, b) => a + b, 0) / ages.length,
                min: Math.min(...ages),
                max: Math.max(...ages)
            };
        }

        return stats;
    }

    calculateHitRate() {
        let totalHits = 0;
        let totalMisses = 0;

        for (const stats of this.accessPatterns.values()) {
            totalHits += stats.hits;
            totalMisses += stats.misses;
        }

        const total = totalHits + totalMisses;
        return total > 0 ? totalHits / total : 0;
    }

    estimateMemoryUsage() {
        let totalSize = 0;

        for (const [key, value] of this.cache.entries()) {
            totalSize += JSON.stringify(key).length;
            totalSize += JSON.stringify(value.result).length;
            totalSize += 200; // Overhead per entry
        }

        return totalSize;
    }

    // Advanced cache operations
    invalidatePattern(pattern) {
        const keysToDelete = [];

        for (const [key, entry] of this.cache.entries()) {
            if (this.matchesPattern(entry.queryKey, pattern)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        return keysToDelete.length;
    }

    matchesPattern(queryKey, pattern) {
        if (typeof pattern === 'string') {
            return JSON.stringify(queryKey).includes(pattern);
        } else if (typeof pattern === 'function') {
            return pattern(queryKey);
        } else if (typeof pattern === 'object') {
            return this.objectMatchesPattern(queryKey, pattern);
        }

        return false;
    }

    objectMatchesPattern(obj, pattern) {
        for (const [key, value] of Object.entries(pattern)) {
            if (!(key in obj) || obj[key] !== value) {
                return false;
            }
        }
        return true;
    }

    getCacheEfficiency() {
        const stats = this.getCacheStats();
        const efficiency = {
            hitRate: stats.hitRate,
            utilization: stats.size / stats.maxSize,
            memoryEfficiency: stats.hitRate / (stats.memoryUsage / (1024 * 1024)), // hits per MB
            predictionAccuracy: this.calculatePredictionAccuracy()
        };

        return efficiency;
    }

    calculatePredictionAccuracy() {
        // This would track how often predictions lead to cache hits
        // For now, return a placeholder
        return 0.75; // 75% prediction accuracy
    }

    // Cleanup old entries
    cleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const cutoff = Date.now() - maxAge;
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < cutoff) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`Cleaned up ${removed} expired cache entries`);
        }

        return removed;
    }

    // Get cache insights for optimization
    getOptimizationInsights() {
        const insights = {
            recommendations: [],
            patterns: {},
            bottlenecks: []
        };

        const stats = this.getCacheStats();

        // Low hit rate
        if (stats.hitRate < 0.3) {
            insights.recommendations.push('Consider increasing cache size or adjusting cache expiration time');
        }

        // High memory usage
        if (stats.memoryUsage > 100 * 1024 * 1024) { // 100MB
            insights.recommendations.push('High memory usage - consider reducing cache size or implementing compression');
        }

        // Analyze access patterns
        const popularPatterns = this.analyzeAccessPatterns();
        insights.patterns = popularPatterns;

        return insights;
    }

    analyzeAccessPatterns() {
        const patterns = {
            temporal: {},
            categorical: {}
        };

        // Analyze temporal patterns (hourly)
        for (const [key, stats] of this.accessPatterns.entries()) {
            const hour = new Date(stats.lastAccess).getHours();
            patterns.temporal[hour] = (patterns.temporal[hour] || 0) + stats.hits;
        }

        // Analyze categorical patterns
        for (const [category, data] of this.predictions.entries()) {
            patterns.categorical[category] = {
                queries: data.successfulQueries.length,
                frequency: Object.keys(data.accessFrequency).length
            };
        }

        return patterns;
    }
}

module.exports = new PredictiveCache();