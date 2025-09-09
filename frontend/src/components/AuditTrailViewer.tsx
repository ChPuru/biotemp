import React, { useState, useEffect, useCallback } from 'react';
import ExportOptions from './ExportOptions';
import './AuditTrailViewer.css';

interface AuditEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'system' | 'compliance' | 'security';
  action: string;
  user: {
    id: string;
    name: string;
    role: string;
    ip: string;
    userAgent: string;
  };
  resource: {
    type: string;
    id: string;
    name: string;
  };
  details: {
    description: string;
    metadata: any;
    riskScore: number;
    complianceFlags: string[];
  };
  outcome: 'success' | 'failure' | 'partial';
  sessionId: string;
  requestId: string;
}

interface ComplianceReport {
  id: string;
  name: string;
  standard: 'GDPR' | 'HIPAA' | 'SOX' | 'ISO27001' | 'NIST';
  status: 'compliant' | 'non-compliant' | 'warning' | 'pending';
  score: number;
  lastAudit: string;
  findings: {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    status: 'open' | 'in_progress' | 'resolved';
  }[];
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  dataBreaches: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastIncident: string;
  trends: {
    period: string;
    events: number;
    riskScore: number;
  }[];
}

const AuditTrailViewer: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
    outcome: 'all',
    dateRange: '24h',
    search: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockEvents: AuditEvent[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        category: 'authentication',
        action: 'user_login',
        user: {
          id: 'user-001',
          name: 'Dr. Sarah Johnson',
          role: 'researcher',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        resource: {
          type: 'analysis',
          id: 'analysis-123',
          name: 'Marine Biodiversity Analysis'
        },
        details: {
          description: 'User successfully logged in and accessed analysis module',
          metadata: { loginMethod: 'password', mfaEnabled: true },
          riskScore: 2,
          complianceFlags: ['GDPR', 'HIPAA']
        },
        outcome: 'success',
        sessionId: 'sess-abc123',
        requestId: 'req-xyz789'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        level: 'warning',
        category: 'data_access',
        action: 'data_export',
        user: {
          id: 'user-002',
          name: 'Prof. Michael Chen',
          role: 'admin',
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        resource: {
          type: 'dataset',
          id: 'dataset-456',
          name: 'Sensitive Marine Data'
        },
        details: {
          description: 'Large dataset export initiated - requires approval',
          metadata: { exportSize: '2.5GB', format: 'CSV', destination: 'external' },
          riskScore: 6,
          complianceFlags: ['GDPR', 'SOX']
        },
        outcome: 'partial',
        sessionId: 'sess-def456',
        requestId: 'req-uvw012'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'error',
        category: 'system',
        action: 'system_error',
        user: {
          id: 'system',
          name: 'System',
          role: 'system',
          ip: '127.0.0.1',
          userAgent: 'BioMapper/1.0.0'
        },
        resource: {
          type: 'service',
          id: 'quantum-service',
          name: 'Quantum Processing Service'
        },
        details: {
          description: 'Quantum service failed to process batch job',
          metadata: { errorCode: 'Q001', retryCount: 3, lastSuccess: '2024-01-15T10:30:00Z' },
          riskScore: 8,
          complianceFlags: ['ISO27001']
        },
        outcome: 'failure',
        sessionId: 'sess-ghi789',
        requestId: 'req-rst345'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'critical',
        category: 'security',
        action: 'suspicious_activity',
        user: {
          id: 'user-003',
          name: 'Unknown User',
          role: 'unknown',
          ip: '203.0.113.42',
          userAgent: 'curl/7.68.0'
        },
        resource: {
          type: 'api',
          id: 'api-endpoint',
          name: 'Authentication API'
        },
        details: {
          description: 'Multiple failed login attempts from suspicious IP',
          metadata: { attemptCount: 15, timeWindow: '5m', blocked: true },
          riskScore: 10,
          complianceFlags: ['NIST', 'ISO27001']
        },
        outcome: 'failure',
        sessionId: 'sess-jkl012',
        requestId: 'req-mno678'
      }
    ];

    const mockComplianceReports: ComplianceReport[] = [
      {
        id: '1',
        name: 'GDPR Compliance Report',
        standard: 'GDPR',
        status: 'compliant',
        score: 95,
        lastAudit: new Date().toISOString(),
        findings: [
          {
            id: 'f1',
            severity: 'low',
            description: 'Data retention policy needs minor updates',
            recommendation: 'Update retention policy to align with GDPR Article 5',
            status: 'open'
          }
        ]
      },
      {
        id: '2',
        name: 'HIPAA Security Assessment',
        standard: 'HIPAA',
        status: 'warning',
        score: 78,
        lastAudit: new Date(Date.now() - 86400000).toISOString(),
        findings: [
          {
            id: 'f2',
            severity: 'medium',
            description: 'Encryption key rotation schedule not implemented',
            recommendation: 'Implement automated key rotation every 90 days',
            status: 'in_progress'
          },
          {
            id: 'f3',
            severity: 'high',
            description: 'Access logs not properly monitored',
            recommendation: 'Implement real-time monitoring and alerting',
            status: 'open'
          }
        ]
      }
    ];

    const mockSecurityMetrics: SecurityMetrics = {
      totalEvents: 1247,
      criticalEvents: 3,
      failedLogins: 12,
      dataBreaches: 0,
      complianceScore: 87,
      riskLevel: 'medium',
      lastIncident: new Date(Date.now() - 3600000).toISOString(),
      trends: [
        { period: '2024-01-01', events: 45, riskScore: 3.2 },
        { period: '2024-01-02', events: 52, riskScore: 3.8 },
        { period: '2024-01-03', events: 38, riskScore: 2.9 },
        { period: '2024-01-04', events: 61, riskScore: 4.1 },
        { period: '2024-01-05', events: 47, riskScore: 3.5 }
      ]
    };

    setEvents(mockEvents);
    setComplianceReports(mockComplianceReports);
    setSecurityMetrics(mockSecurityMetrics);
  }, []);

  const filteredEvents = events.filter(event => {
    const levelMatch = filters.level === 'all' || event.level === filters.level;
    const categoryMatch = filters.category === 'all' || event.category === filters.category;
    const outcomeMatch = filters.outcome === 'all' || event.outcome === filters.outcome;
    const searchMatch = filters.search === '' || 
      event.action.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.resource.name.toLowerCase().includes(filters.search.toLowerCase());
    
    return levelMatch && categoryMatch && outcomeMatch && searchMatch;
  });

  const handleEventClick = useCallback((event: AuditEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleExport = useCallback((format: string, data: any) => {
    console.log(`Exporting audit data as ${format}:`, data);
    // Implement actual export logic here
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '📄';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'var(--accent-info)';
      case 'warning': return 'var(--accent-warning)';
      case 'error': return 'var(--accent-danger)';
      case 'critical': return 'var(--accent-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return '🔐';
      case 'authorization': return '👤';
      case 'data_access': return '📊';
      case 'system': return '⚙️';
      case 'compliance': return '📋';
      case 'security': return '🛡️';
      default: return '📄';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'var(--accent-success)';
      case 'failure': return 'var(--accent-danger)';
      case 'partial': return 'var(--accent-warning)';
      default: return 'var(--text-secondary)';
    }
  };

  const getRiskLevelColor = (score: number) => {
    if (score <= 3) return 'var(--accent-success)';
    if (score <= 6) return 'var(--accent-warning)';
    if (score <= 8) return 'var(--accent-danger)';
    return 'var(--accent-danger)';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderEventList = () => (
    <div className="event-list">
      {filteredEvents.map(event => (
        <div
          key={event.id}
          className="event-item"
          onClick={() => handleEventClick(event)}
        >
          <div className="event-header">
            <div className="event-level">
              <span className="level-icon">{getLevelIcon(event.level)}</span>
              <span 
                className="level-badge"
                style={{ color: getLevelColor(event.level) }}
              >
                {event.level.toUpperCase()}
              </span>
            </div>
            <div className="event-category">
              <span className="category-icon">{getCategoryIcon(event.category)}</span>
              <span className="category-label">{event.category}</span>
            </div>
            <div className="event-timestamp">
              {formatTimestamp(event.timestamp)}
            </div>
          </div>
          
          <div className="event-content">
            <div className="event-action">
              <strong>{event.action.replace('_', ' ').toUpperCase()}</strong>
            </div>
            <div className="event-description">
              {event.details.description}
            </div>
          </div>

          <div className="event-details">
            <div className="detail-row">
              <span className="detail-label">User:</span>
              <span className="detail-value">{event.user.name} ({event.user.role})</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Resource:</span>
              <span className="detail-value">{event.resource.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Outcome:</span>
              <span 
                className="detail-value"
                style={{ color: getOutcomeColor(event.outcome) }}
              >
                {event.outcome.toUpperCase()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Risk Score:</span>
              <span 
                className="detail-value"
                style={{ color: getRiskLevelColor(event.details.riskScore) }}
              >
                {event.details.riskScore}/10
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderComplianceReports = () => (
    <div className="compliance-reports">
      {complianceReports.map(report => (
        <div key={report.id} className="compliance-card">
          <div className="report-header">
            <h4>{report.name}</h4>
            <span className={`status-badge ${report.status}`}>
              {report.status.toUpperCase()}
            </span>
          </div>
          <div className="report-metrics">
            <div className="metric">
              <span className="metric-label">Score:</span>
              <span className="metric-value">{report.score}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Last Audit:</span>
              <span className="metric-value">{formatTimestamp(report.lastAudit)}</span>
            </div>
          </div>
          <div className="findings">
            <h5>Findings ({report.findings.length})</h5>
            {report.findings.map(finding => (
              <div key={finding.id} className="finding-item">
                <div className="finding-header">
                  <span className={`severity-badge ${finding.severity}`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className={`status-badge ${finding.status}`}>
                    {finding.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="finding-description">{finding.description}</div>
                <div className="finding-recommendation">
                  <strong>Recommendation:</strong> {finding.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="audit-trail-viewer">
      <div className="viewer-header">
        <h2>Audit Trail & Compliance</h2>
        <div className="viewer-controls">
          <div className="filter-controls">
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="authorization">Authorization</option>
              <option value="data_access">Data Access</option>
              <option value="system">System</option>
              <option value="compliance">Compliance</option>
              <option value="security">Security</option>
            </select>
            <select
              value={filters.outcome}
              onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
              className="filter-select"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="partial">Partial</option>
            </select>
            <input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="search-input"
            />
          </div>
          <ExportOptions
            data={events}
            filename="audit-trail"
            onExport={handleExport}
          />
        </div>
      </div>

      <div className="viewer-content">
        {/* Security Metrics */}
        {securityMetrics && (
          <div className="security-metrics">
            <h3>Security Overview</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <h4>Total Events</h4>
                  <span className="metric-icon">📊</span>
                </div>
                <div className="metric-value">{securityMetrics.totalEvents.toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <h4>Critical Events</h4>
                  <span className="metric-icon">🚨</span>
                </div>
                <div className="metric-value critical">{securityMetrics.criticalEvents}</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <h4>Failed Logins</h4>
                  <span className="metric-icon">🔐</span>
                </div>
                <div className="metric-value warning">{securityMetrics.failedLogins}</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <h4>Data Breaches</h4>
                  <span className="metric-icon">🛡️</span>
                </div>
                <div className="metric-value success">{securityMetrics.dataBreaches}</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <h4>Compliance Score</h4>
                  <span className="metric-icon">📋</span>
                </div>
                <div className="metric-value">{securityMetrics.complianceScore}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">
                  <h4>Risk Level</h4>
                  <span className="metric-icon">⚠️</span>
                </div>
                <div className={`metric-value ${securityMetrics.riskLevel}`}>
                  {securityMetrics.riskLevel.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Events */}
        <div className="audit-events">
          <h3>Audit Events ({filteredEvents.length})</h3>
          {renderEventList()}
        </div>

        {/* Compliance Reports */}
        <div className="compliance-section">
          <h3>Compliance Reports</h3>
          {renderComplianceReports()}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="event-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Event Details</h3>
              <button
                className="close-button"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="event-detail-grid">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span className="detail-label">Event ID:</span>
                      <span className="detail-value">{selectedEvent.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Timestamp:</span>
                      <span className="detail-value">{formatTimestamp(selectedEvent.timestamp)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Level:</span>
                      <span className="detail-value">{selectedEvent.level}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{selectedEvent.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Action:</span>
                      <span className="detail-value">{selectedEvent.action}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>User Information</h4>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span className="detail-label">User ID:</span>
                      <span className="detail-value">{selectedEvent.user.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedEvent.user.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Role:</span>
                      <span className="detail-value">{selectedEvent.user.role}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">IP Address:</span>
                      <span className="detail-value">{selectedEvent.user.ip}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">User Agent:</span>
                      <span className="detail-value">{selectedEvent.user.userAgent}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Resource Information</h4>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{selectedEvent.resource.type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">{selectedEvent.resource.id}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedEvent.resource.name}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Security Details</h4>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span className="detail-label">Risk Score:</span>
                      <span 
                        className="detail-value"
                        style={{ color: getRiskLevelColor(selectedEvent.details.riskScore) }}
                      >
                        {selectedEvent.details.riskScore}/10
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Compliance Flags:</span>
                      <span className="detail-value">
                        {selectedEvent.details.complianceFlags.join(', ')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Session ID:</span>
                      <span className="detail-value">{selectedEvent.sessionId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Request ID:</span>
                      <span className="detail-value">{selectedEvent.requestId}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h4>Description</h4>
                  <p className="event-description">{selectedEvent.details.description}</p>
                </div>

                <div className="detail-section full-width">
                  <h4>Metadata</h4>
                  <pre className="metadata-json">
                    {JSON.stringify(selectedEvent.details.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailViewer;
