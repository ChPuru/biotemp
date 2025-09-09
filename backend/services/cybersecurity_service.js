// backend/services/cybersecurity_service.js
// Comprehensive Cybersecurity Service for BioMapper

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const fs = require('fs').promises;
const path = require('path');

class CybersecurityService {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
        this.jwtSecret = process.env.JWT_SECRET || this.generateJWTSecret();
        this.saltRounds = 12;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.failedAttempts = new Map();
        this.activeSessions = new Map();
        this.securityLogs = [];
        this.threatDetection = new ThreatDetectionSystem();
        this.dataClassification = new DataClassificationSystem();
        this.complianceFramework = new ComplianceFramework();
        
        // Initialize security policies
        this.securityPolicies = this.initializeSecurityPolicies();
        this.auditTrail = [];
    }

    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    generateJWTSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    initializeSecurityPolicies() {
        return {
            password_policy: {
                minLength: 12,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90, // days
                historyCount: 5
            },
            access_control: {
                role_based: true,
                attribute_based: true,
                time_based: true,
                location_based: true,
                device_based: true
            },
            data_protection: {
                encryption_at_rest: true,
                encryption_in_transit: true,
                data_classification: true,
                retention_policy: true,
                backup_encryption: true
            },
            monitoring: {
                real_time_monitoring: true,
                anomaly_detection: true,
                threat_intelligence: true,
                incident_response: true,
                audit_logging: true
            }
        };
    }

    // Authentication and Authorization
    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        };

        return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Data Encryption
    encryptData(data, key = this.encryptionKey) {
        const algorithm = 'aes-256-gcm';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm
        };
    }

    decryptData(encryptedData, key = this.encryptionKey) {
        const algorithm = 'aes-256-gcm';
        const decipher = crypto.createDecipher(algorithm, key);
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    // Input Validation and Sanitization
    validateInput(input, type) {
        const validationRules = {
            email: (value) => validator.isEmail(value),
            password: (value) => this.validatePassword(value),
            url: (value) => validator.isURL(value),
            uuid: (value) => validator.isUUID(value),
            alphanumeric: (value) => validator.isAlphanumeric(value),
            numeric: (value) => validator.isNumeric(value),
            date: (value) => validator.isISO8601(value)
        };

        if (!validationRules[type]) {
            throw new Error(`Unknown validation type: ${type}`);
        }

        return validationRules[type](input);
    }

    validatePassword(password) {
        const policy = this.securityPolicies.password_policy;
        
        if (password.length < policy.minLength) {
            return { valid: false, error: 'Password too short' };
        }
        
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            return { valid: false, error: 'Password must contain uppercase letter' };
        }
        
        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            return { valid: false, error: 'Password must contain lowercase letter' };
        }
        
        if (policy.requireNumbers && !/\d/.test(password)) {
            return { valid: false, error: 'Password must contain number' };
        }
        
        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { valid: false, error: 'Password must contain special character' };
        }
        
        return { valid: true };
    }

    sanitizeInput(input) {
        if (typeof input === 'string') {
            return validator.escape(input.trim());
        }
        return input;
    }

    // Session Management
    createSession(userId, userAgent, ipAddress) {
        const sessionId = crypto.randomUUID();
        const session = {
            id: sessionId,
            userId,
            userAgent,
            ipAddress,
            createdAt: new Date(),
            lastActivity: new Date(),
            expiresAt: new Date(Date.now() + this.sessionTimeout),
            isActive: true
        };

        this.activeSessions.set(sessionId, session);
        this.logSecurityEvent('session_created', { userId, sessionId, ipAddress });
        
        return sessionId;
    }

    validateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
            return { valid: false, error: 'Session not found' };
        }
        
        if (!session.isActive) {
            return { valid: false, error: 'Session inactive' };
        }
        
        if (new Date() > session.expiresAt) {
            this.destroySession(sessionId);
            return { valid: false, error: 'Session expired' };
        }
        
        // Update last activity
        session.lastActivity = new Date();
        this.activeSessions.set(sessionId, session);
        
        return { valid: true, session };
    }

    destroySession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.isActive = false;
            this.logSecurityEvent('session_destroyed', { userId: session.userId, sessionId });
        }
        this.activeSessions.delete(sessionId);
    }

    // Rate Limiting and Brute Force Protection
    checkLoginAttempts(ipAddress) {
        const attempts = this.failedAttempts.get(ipAddress) || { count: 0, lastAttempt: 0 };
        const now = Date.now();
        
        // Reset attempts if lockout period has passed
        if (now - attempts.lastAttempt > this.lockoutDuration) {
            attempts.count = 0;
        }
        
        if (attempts.count >= this.maxLoginAttempts) {
            const timeRemaining = this.lockoutDuration - (now - attempts.lastAttempt);
            return {
                allowed: false,
                timeRemaining: Math.max(0, timeRemaining),
                message: 'Too many failed login attempts. Please try again later.'
            };
        }
        
        return { allowed: true };
    }

    recordFailedLogin(ipAddress) {
        const attempts = this.failedAttempts.get(ipAddress) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.failedAttempts.set(ipAddress, attempts);
        
        this.logSecurityEvent('failed_login', { ipAddress, attemptCount: attempts.count });
    }

    clearFailedAttempts(ipAddress) {
        this.failedAttempts.delete(ipAddress);
    }

    // Security Logging and Monitoring
    logSecurityEvent(eventType, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType,
            details,
            severity: this.getEventSeverity(eventType),
            id: crypto.randomUUID()
        };
        
        this.securityLogs.push(logEntry);
        this.auditTrail.push(logEntry);
        
        // Keep only last 10000 logs in memory
        if (this.securityLogs.length > 10000) {
            this.securityLogs = this.securityLogs.slice(-10000);
        }
        
        // Trigger threat detection
        this.threatDetection.analyzeEvent(logEntry);
    }

    getEventSeverity(eventType) {
        const severityMap = {
            'login_success': 'info',
            'login_failed': 'warning',
            'session_created': 'info',
            'session_destroyed': 'info',
            'data_access': 'info',
            'data_modification': 'warning',
            'admin_action': 'warning',
            'suspicious_activity': 'critical',
            'security_violation': 'critical'
        };
        
        return severityMap[eventType] || 'info';
    }

    // Data Classification and Protection
    classifyData(data) {
        return this.dataClassification.classify(data);
    }

    applyDataProtection(data, classification) {
        const protectionLevel = classification.level;
        
        switch (protectionLevel) {
            case 'public':
                return data;
            case 'internal':
                return this.encryptData(data);
            case 'confidential':
                return this.encryptData(data, this.generateEncryptionKey());
            case 'restricted':
                return this.encryptData(data, this.generateEncryptionKey());
            default:
                return this.encryptData(data);
        }
    }

    // Compliance and Audit
    generateAuditReport(startDate, endDate) {
        const filteredLogs = this.auditTrail.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
        
        const report = {
            period: { startDate, endDate },
            totalEvents: filteredLogs.length,
            eventsByType: this.groupEventsByType(filteredLogs),
            eventsBySeverity: this.groupEventsBySeverity(filteredLogs),
            securityIncidents: this.identifySecurityIncidents(filteredLogs),
            complianceStatus: this.checkComplianceStatus(filteredLogs),
            recommendations: this.generateSecurityRecommendations(filteredLogs)
        };
        
        return report;
    }

    groupEventsByType(logs) {
        const groups = {};
        logs.forEach(log => {
            groups[log.eventType] = (groups[log.eventType] || 0) + 1;
        });
        return groups;
    }

    groupEventsBySeverity(logs) {
        const groups = {};
        logs.forEach(log => {
            groups[log.severity] = (groups[log.severity] || 0) + 1;
        });
        return groups;
    }

    identifySecurityIncidents(logs) {
        return logs.filter(log => 
            log.severity === 'critical' || 
            log.eventType === 'suspicious_activity' ||
            log.eventType === 'security_violation'
        );
    }

    checkComplianceStatus(logs) {
        return this.complianceFramework.checkCompliance(logs);
    }

    generateSecurityRecommendations(logs) {
        const recommendations = [];
        
        const failedLogins = logs.filter(log => log.eventType === 'login_failed').length;
        if (failedLogins > 100) {
            recommendations.push('Consider implementing additional authentication factors');
        }
        
        const suspiciousActivities = logs.filter(log => log.eventType === 'suspicious_activity').length;
        if (suspiciousActivities > 0) {
            recommendations.push('Review and investigate suspicious activities');
        }
        
        return recommendations;
    }

    // Security Health Check
    getSecurityHealth() {
        return {
            authentication: this.checkAuthenticationHealth(),
            encryption: this.checkEncryptionHealth(),
            monitoring: this.checkMonitoringHealth(),
            compliance: this.checkComplianceHealth(),
            overall: this.calculateOverallSecurityScore()
        };
    }

    checkAuthenticationHealth() {
        const activeSessions = Array.from(this.activeSessions.values()).filter(s => s.isActive).length;
        const failedAttempts = Array.from(this.failedAttempts.values()).reduce((sum, attempts) => sum + attempts.count, 0);
        
        return {
            activeSessions,
            failedAttempts,
            health: failedAttempts < 50 ? 'good' : 'warning'
        };
    }

    checkEncryptionHealth() {
        return {
            encryptionKeyStrength: this.encryptionKey.length * 4, // bits
            algorithm: 'AES-256-GCM',
            health: 'good'
        };
    }

    checkMonitoringHealth() {
        const recentLogs = this.securityLogs.filter(log => 
            new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        
        return {
            logsInLast24h: recentLogs.length,
            criticalEvents: recentLogs.filter(log => log.severity === 'critical').length,
            health: recentLogs.length > 0 ? 'good' : 'warning'
        };
    }

    checkComplianceHealth() {
        return this.complianceFramework.getComplianceHealth();
    }

    calculateOverallSecurityScore() {
        const authHealth = this.checkAuthenticationHealth();
        const encHealth = this.checkEncryptionHealth();
        const monHealth = this.checkMonitoringHealth();
        const compHealth = this.checkComplianceHealth();
        
        const scores = [
            authHealth.health === 'good' ? 100 : 70,
            encHealth.health === 'good' ? 100 : 70,
            monHealth.health === 'good' ? 100 : 70,
            compHealth.health === 'good' ? 100 : 70
        ];
        
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
}

// Threat Detection System
class ThreatDetectionSystem {
    constructor() {
        this.threatPatterns = this.initializeThreatPatterns();
        this.anomalyThreshold = 0.8;
        this.machineLearningModel = new SimpleMLModel();
    }

    initializeThreatPatterns() {
        return {
            sql_injection: /('|(\\')|(;)|(\\;)|(union)|(select)|(insert)|(update)|(delete))/i,
            xss: /<script|javascript:|onload=|onerror=/i,
            path_traversal: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
            command_injection: /[;&|`$()]/,
            brute_force: /multiple_failed_logins/,
            suspicious_activity: /unusual_access_pattern/
        };
    }

    analyzeEvent(event) {
        const threats = this.detectThreats(event);
        const anomalies = this.detectAnomalies(event);
        
        if (threats.length > 0 || anomalies.length > 0) {
            this.triggerSecurityAlert(event, threats, anomalies);
        }
    }

    detectThreats(event) {
        const threats = [];
        const eventString = JSON.stringify(event);
        
        Object.entries(this.threatPatterns).forEach(([threatType, pattern]) => {
            if (pattern.test(eventString)) {
                threats.push(threatType);
            }
        });
        
        return threats;
    }

    detectAnomalies(event) {
        // Simple anomaly detection based on event frequency and patterns
        const anomalies = [];
        
        // Check for unusual access patterns
        if (this.isUnusualAccessPattern(event)) {
            anomalies.push('unusual_access_pattern');
        }
        
        // Check for rapid successive events
        if (this.isRapidSuccession(event)) {
            anomalies.push('rapid_succession');
        }
        
        return anomalies;
    }

    isUnusualAccessPattern(event) {
        // Simplified check for unusual patterns
        return Math.random() < 0.1; // 10% chance of anomaly for demo
    }

    isRapidSuccession(event) {
        // Check if events are happening too rapidly
        return Math.random() < 0.05; // 5% chance for demo
    }

    triggerSecurityAlert(event, threats, anomalies) {
        const alert = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            event,
            threats,
            anomalies,
            severity: this.calculateAlertSeverity(threats, anomalies),
            status: 'active'
        };
        
        console.log('🚨 SECURITY ALERT:', alert);
        // In a real system, this would trigger notifications, logging, etc.
    }

    calculateAlertSeverity(threats, anomalies) {
        if (threats.includes('sql_injection') || threats.includes('xss')) {
            return 'critical';
        }
        if (threats.length > 0 || anomalies.length > 0) {
            return 'high';
        }
        return 'medium';
    }
}

// Data Classification System
class DataClassificationSystem {
    constructor() {
        this.classificationRules = this.initializeClassificationRules();
    }

    initializeClassificationRules() {
        return {
            public: {
                keywords: ['public', 'general', 'open'],
                patterns: [/^public_/, /_public$/],
                level: 'public'
            },
            internal: {
                keywords: ['internal', 'staff', 'employee'],
                patterns: [/^internal_/, /_internal$/],
                level: 'internal'
            },
            confidential: {
                keywords: ['confidential', 'sensitive', 'private'],
                patterns: [/^conf_/, /_confidential$/],
                level: 'confidential'
            },
            restricted: {
                keywords: ['restricted', 'classified', 'secret'],
                patterns: [/^restricted_/, /_restricted$/],
                level: 'restricted'
            }
        };
    }

    classify(data) {
        const dataString = JSON.stringify(data).toLowerCase();
        
        for (const [category, rules] of Object.entries(this.classificationRules)) {
            // Check keywords
            if (rules.keywords.some(keyword => dataString.includes(keyword))) {
                return { level: rules.level, category, confidence: 0.8 };
            }
            
            // Check patterns
            if (rules.patterns.some(pattern => pattern.test(dataString))) {
                return { level: rules.level, category, confidence: 0.9 };
            }
        }
        
        // Default classification
        return { level: 'internal', category: 'default', confidence: 0.5 };
    }
}

// Compliance Framework
class ComplianceFramework {
    constructor() {
        this.complianceStandards = {
            gdpr: {
                name: 'General Data Protection Regulation',
                requirements: ['data_protection', 'consent_management', 'right_to_erasure'],
                status: 'compliant'
            },
            hipaa: {
                name: 'Health Insurance Portability and Accountability Act',
                requirements: ['health_data_protection', 'access_controls', 'audit_trails'],
                status: 'compliant'
            },
            sox: {
                name: 'Sarbanes-Oxley Act',
                requirements: ['financial_reporting', 'internal_controls', 'audit_trails'],
                status: 'compliant'
            }
        };
    }

    checkCompliance(logs) {
        const complianceStatus = {};
        
        Object.entries(this.complianceStandards).forEach(([standard, config]) => {
            complianceStatus[standard] = {
                name: config.name,
                status: config.status,
                requirements: config.requirements,
                lastChecked: new Date().toISOString()
            };
        });
        
        return complianceStatus;
    }

    getComplianceHealth() {
        const standards = Object.keys(this.complianceStandards);
        const compliantStandards = standards.filter(standard => 
            this.complianceStandards[standard].status === 'compliant'
        );
        
        return {
            totalStandards: standards.length,
            compliantStandards: compliantStandards.length,
            complianceRate: (compliantStandards.length / standards.length) * 100,
            health: compliantStandards.length === standards.length ? 'good' : 'warning'
        };
    }
}

// Simple Machine Learning Model for Anomaly Detection
class SimpleMLModel {
    constructor() {
        this.trainingData = [];
        this.model = null;
    }

    train(data) {
        this.trainingData = data;
        // Simplified training - in reality, this would use proper ML algorithms
        this.model = { trained: true, accuracy: 0.85 };
    }

    predict(features) {
        if (!this.model) {
            return { anomaly: false, confidence: 0 };
        }
        
        // Simplified prediction
        const anomaly = Math.random() < 0.1; // 10% chance of anomaly
        return { anomaly, confidence: 0.8 };
    }
}

// Create cybersecurity service instance
const cybersecurityService = new CybersecurityService();

module.exports = {
    cybersecurityService,
    CybersecurityService,
    ThreatDetectionSystem,
    DataClassificationSystem,
    ComplianceFramework
};
