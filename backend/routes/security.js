const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');

// Enhanced Cybersecurity Service
class CybersecurityService {
    constructor() {
        this.securityEventsPath = path.join(__dirname, '../reports/security_events.jsonl');
        this.anomalyScores = new Map();
        this.threatPatterns = new Map();
        this.initializeSecurityLogging();
        this.setupThreatDetection();
    }

    async initializeSecurityLogging() {
        try {
            await fs.mkdir(path.dirname(this.securityEventsPath), { recursive: true });
        } catch (error) {
            console.error('Security logging initialization error:', error);
        }
    }

    setupThreatDetection() {
        // Common attack patterns
        this.threatPatterns.set('sql_injection', /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/i);
        this.threatPatterns.set('xss', /<script|javascript:|on\w+\s*=/i);
        this.threatPatterns.set('path_traversal', /\.\.[\/\\]/);
        this.threatPatterns.set('command_injection', /[;&|`$()]/);
        this.threatPatterns.set('ldap_injection', /[()=*!&|]/);
    }

    async logSecurityEvent(event) {
        try {
            const securityEvent = {
                timestamp: new Date().toISOString(),
                eventId: crypto.randomUUID(),
                ...event,
                severity: this.calculateSeverity(event),
                riskScore: this.calculateRiskScore(event)
            };

            const eventLine = JSON.stringify(securityEvent) + '\n';
            await fs.appendFile(this.securityEventsPath, eventLine);

            // Update anomaly scores
            this.updateAnomalyScores(securityEvent);

            return securityEvent;
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    }

    calculateSeverity(event) {
        const severityMap = {
            'authentication_failure': 'medium',
            'rate_limit_exceeded': 'medium',
            'suspicious_file_upload': 'high',
            'malware_detected': 'critical',
            'unauthorized_access': 'high',
            'data_breach_attempt': 'critical',
            'privilege_escalation': 'critical',
            'brute_force_attack': 'high'
        };
        return severityMap[event.type] || 'low';
    }

    calculateRiskScore(event) {
        let score = 0;
        
        // Base score by event type
        const typeScores = {
            'authentication_failure': 3,
            'rate_limit_exceeded': 2,
            'suspicious_file_upload': 7,
            'malware_detected': 10,
            'unauthorized_access': 8,
            'data_breach_attempt': 10,
            'privilege_escalation': 9,
            'brute_force_attack': 6
        };
        
        score += typeScores[event.type] || 1;
        
        // Frequency multiplier
        const recentEvents = this.getRecentEventsByIP(event.ip);
        if (recentEvents > 5) score *= 1.5;
        if (recentEvents > 10) score *= 2;
        
        // Geographic risk (simplified)
        if (event.country && ['CN', 'RU', 'KP'].includes(event.country)) {
            score *= 1.3;
        }
        
        return Math.min(score, 10);
    }

    updateAnomalyScores(event) {
        const key = event.ip || event.userId || 'unknown';
        const current = this.anomalyScores.get(key) || { score: 0, events: 0, lastUpdate: Date.now() };
        
        current.score += event.riskScore;
        current.events += 1;
        current.lastUpdate = Date.now();
        
        // Decay score over time (24 hours)
        const hoursSinceUpdate = (Date.now() - current.lastUpdate) / (1000 * 60 * 60);
        if (hoursSinceUpdate > 24) {
            current.score *= 0.5;
        }
        
        this.anomalyScores.set(key, current);
    }

    getRecentEventsByIP(ip) {
        // Simplified - in production, query actual events
        const key = ip;
        const anomaly = this.anomalyScores.get(key);
        return anomaly ? anomaly.events : 0;
    }

    async getSecurityHealth() {
        try {
            const events = await this.getRecentSecurityEvents(24); // Last 24 hours
            const criticalEvents = events.filter(e => e.severity === 'critical');
            const highRiskIPs = Array.from(this.anomalyScores.entries())
                .filter(([_, data]) => data.score > 7)
                .map(([ip, data]) => ({ ip, score: data.score, events: data.events }));

            return {
                status: criticalEvents.length === 0 ? 'healthy' : 'alert',
                totalEvents: events.length,
                criticalEvents: criticalEvents.length,
                highRiskIPs: highRiskIPs.length,
                topThreats: this.getTopThreats(events),
                anomalyScores: Object.fromEntries(
                    Array.from(this.anomalyScores.entries()).slice(0, 10)
                ),
                recommendations: this.generateRecommendations(events, highRiskIPs)
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async getRecentSecurityEvents(hours = 24) {
        try {
            const data = await fs.readFile(this.securityEventsPath, 'utf8');
            const lines = data.trim().split('\n').filter(line => line);
            const cutoff = Date.now() - (hours * 60 * 60 * 1000);
            
            return lines
                .map(line => JSON.parse(line))
                .filter(event => new Date(event.timestamp).getTime() > cutoff);
        } catch (error) {
            return [];
        }
    }

    getTopThreats(events) {
        const threatCounts = {};
        events.forEach(event => {
            threatCounts[event.type] = (threatCounts[event.type] || 0) + 1;
        });
        
        return Object.entries(threatCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    generateRecommendations(events, highRiskIPs) {
        const recommendations = [];
        
        if (events.filter(e => e.type === 'brute_force_attack').length > 5) {
            recommendations.push('Consider implementing CAPTCHA for login attempts');
        }
        
        if (highRiskIPs.length > 0) {
            recommendations.push(`Block ${highRiskIPs.length} high-risk IP addresses`);
        }
        
        if (events.filter(e => e.type === 'malware_detected').length > 0) {
            recommendations.push('Update antivirus definitions and scan all uploads');
        }
        
        if (events.filter(e => e.severity === 'critical').length > 3) {
            recommendations.push('Enable enhanced monitoring and alerting');
        }
        
        return recommendations;
    }

    scanForThreats(input, context = {}) {
        const threats = [];
        
        for (const [threatType, pattern] of this.threatPatterns) {
            if (pattern.test(input)) {
                threats.push({
                    type: threatType,
                    pattern: pattern.source,
                    context,
                    confidence: 0.8
                });
            }
        }
        
        return threats;
    }

    async scanFile(filePath, originalName) {
        try {
            // File size check
            const stats = await fs.stat(filePath);
            if (stats.size > 100 * 1024 * 1024) { // 100MB limit
                return {
                    safe: false,
                    reason: 'File too large',
                    threats: ['oversized_file']
                };
            }

            // MIME type validation
            const buffer = await fs.readFile(filePath, { encoding: null });
            const mimeType = this.detectMimeType(buffer);
            const allowedTypes = [
                'text/plain', 'application/json', 'text/csv',
                'application/pdf', 'image/jpeg', 'image/png',
                'application/zip', 'application/gzip'
            ];

            if (!allowedTypes.includes(mimeType)) {
                return {
                    safe: false,
                    reason: 'Unsupported file type',
                    threats: ['unsupported_mime_type'],
                    detectedType: mimeType
                };
            }

            // Basic malware signatures (simplified)
            const content = buffer.toString('hex');
            const malwareSignatures = [
                '4d5a', // PE executable
                '7f454c46', // ELF executable
                'cafebabe', // Java class file
            ];

            for (const signature of malwareSignatures) {
                if (content.startsWith(signature)) {
                    return {
                        safe: false,
                        reason: 'Executable file detected',
                        threats: ['executable_file']
                    };
                }
            }

            return {
                safe: true,
                mimeType,
                size: stats.size,
                checksum: crypto.createHash('sha256').update(buffer).digest('hex')
            };
        } catch (error) {
            return {
                safe: false,
                reason: 'Scan error',
                error: error.message
            };
        }
    }

    detectMimeType(buffer) {
        // Simplified MIME detection based on file signatures
        const hex = buffer.toString('hex', 0, 8).toUpperCase();
        
        if (hex.startsWith('FFD8FF')) return 'image/jpeg';
        if (hex.startsWith('89504E47')) return 'image/png';
        if (hex.startsWith('25504446')) return 'application/pdf';
        if (hex.startsWith('504B0304')) return 'application/zip';
        if (hex.startsWith('1F8B08')) return 'application/gzip';
        
        // Default to text for readable content
        try {
            buffer.toString('utf8');
            return 'text/plain';
        } catch {
            return 'application/octet-stream';
        }
    }
}

// Initialize security service
const securityService = new CybersecurityService();

// Rate limiting middleware
const securityRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many security requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
router.use(securityRateLimit);

router.get('/health', async (req, res) => {
    try {
        const health = await securityService.getSecurityHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/events', verifyToken, async (req, res) => {
    try {
        const { hours = 24, severity, type } = req.query;
        let events = await securityService.getRecentSecurityEvents(parseInt(hours));
        
        if (severity) {
            events = events.filter(e => e.severity === severity);
        }
        
        if (type) {
            events = events.filter(e => e.type === type);
        }
        
        res.json({
            events: events.slice(0, 100), // Limit to 100 events
            total: events.length,
            filters: { hours, severity, type }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/events', verifyToken, async (req, res) => {
    try {
        const { type, description, ip, userId, metadata } = req.body;
        
        const event = await securityService.logSecurityEvent({
            type,
            description,
            ip: ip || req.ip,
            userId: userId || req.user?.id,
            userAgent: req.get('User-Agent'),
            metadata: metadata || {}
        });
        
        res.json({
            success: true,
            eventId: event.eventId,
            severity: event.severity,
            riskScore: event.riskScore
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/scan/text', verifyToken, async (req, res) => {
    try {
        const { text, context } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const threats = securityService.scanForThreats(text, context);
        
        if (threats.length > 0) {
            await securityService.logSecurityEvent({
                type: 'suspicious_input',
                description: `Threats detected in text input: ${threats.map(t => t.type).join(', ')}`,
                ip: req.ip,
                userId: req.user?.id,
                metadata: { threats, textLength: text.length }
            });
        }
        
        res.json({
            safe: threats.length === 0,
            threats,
            scannedLength: text.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/scan/file', verifyToken, async (req, res) => {
    try {
        const { filePath, originalName } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        const scanResult = await securityService.scanFile(filePath, originalName);
        
        if (!scanResult.safe) {
            await securityService.logSecurityEvent({
                type: 'suspicious_file_upload',
                description: `Unsafe file detected: ${scanResult.reason}`,
                ip: req.ip,
                userId: req.user?.id,
                metadata: { 
                    originalName, 
                    threats: scanResult.threats,
                    detectedType: scanResult.detectedType 
                }
            });
        }
        
        res.json(scanResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/audit', verifyToken, async (req, res) => {
    try {
        const { startDate, endDate, userId, ip } = req.query;
        const events = await securityService.getRecentSecurityEvents(24 * 7); // Last week
        
        let filteredEvents = events;
        
        if (startDate) {
            filteredEvents = filteredEvents.filter(e => 
                new Date(e.timestamp) >= new Date(startDate)
            );
        }
        
        if (endDate) {
            filteredEvents = filteredEvents.filter(e => 
                new Date(e.timestamp) <= new Date(endDate)
            );
        }
        
        if (userId) {
            filteredEvents = filteredEvents.filter(e => e.userId === userId);
        }
        
        if (ip) {
            filteredEvents = filteredEvents.filter(e => e.ip === ip);
        }
        
        const summary = {
            totalEvents: filteredEvents.length,
            severityBreakdown: {},
            typeBreakdown: {},
            topIPs: {},
            timeline: {}
        };
        
        filteredEvents.forEach(event => {
            // Severity breakdown
            summary.severityBreakdown[event.severity] = 
                (summary.severityBreakdown[event.severity] || 0) + 1;
            
            // Type breakdown
            summary.typeBreakdown[event.type] = 
                (summary.typeBreakdown[event.type] || 0) + 1;
            
            // Top IPs
            summary.topIPs[event.ip] = (summary.topIPs[event.ip] || 0) + 1;
            
            // Timeline (by hour)
            const hour = new Date(event.timestamp).toISOString().slice(0, 13);
            summary.timeline[hour] = (summary.timeline[hour] || 0) + 1;
        });
        
        res.json({
            summary,
            events: filteredEvents.slice(0, 1000), // Limit to 1000 events
            filters: { startDate, endDate, userId, ip }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
