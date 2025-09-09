import React, { useState, useEffect } from 'react';
import './BlockchainLedger.css';

interface BlockchainEntry {
  id: string;
  timestamp: string;
  type: 'sample' | 'verification' | 'training' | 'validation';
  description: string;
  hash: string;
  previousHash: string;
  status: 'verified' | 'pending' | 'failed';
  data: any;
}

interface BlockchainLedgerProps {
  entries?: BlockchainEntry[];
  onEntryClick?: (entry: BlockchainEntry) => void;
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({ 
  entries = [], 
  onEntryClick 
}) => {
  const [selectedEntry, setSelectedEntry] = useState<BlockchainEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'sample' | 'verification' | 'training' | 'validation'>('all');

  // Generate mock data if none provided
  const mockEntries: BlockchainEntry[] = [
    {
      id: 'bc_001',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      type: 'sample',
      description: 'eDNA sample analysis completed',
      hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      previousHash: '0x0000000000000000000000000000000000000000',
      status: 'verified',
      data: { species: 'Homo sapiens', confidence: 0.95 }
    },
    {
      id: 'bc_002',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      type: 'verification',
      description: 'Blockchain integrity verification',
      hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234',
      previousHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      status: 'verified',
      data: { verified: true, checksum: 'valid' }
    },
    {
      id: 'bc_003',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'training',
      description: 'Model training data added',
      hash: '0x3c4d5e6f7890abcdef1234567890abcdef123456',
      previousHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234',
      status: 'verified',
      data: { samples: 150, accuracy: 0.92 }
    },
    {
      id: 'bc_004',
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      type: 'validation',
      description: 'Scientific validation completed',
      hash: '0x4d5e6f7890abcdef1234567890abcdef12345678',
      previousHash: '0x3c4d5e6f7890abcdef1234567890abcdef123456',
      status: 'verified',
      data: { validator: 'Dr. Smith', institution: 'CMLRE' }
    },
    {
      id: 'bc_005',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      type: 'sample',
      description: 'Novel species discovery',
      hash: '0x5e6f7890abcdef1234567890abcdef1234567890',
      previousHash: '0x4d5e6f7890abcdef1234567890abcdef12345678',
      status: 'pending',
      data: { species: 'Unknown sp. nov.', confidence: 0.87 }
    }
  ];

  const displayEntries = entries.length > 0 ? entries : mockEntries;
  const filteredEntries = filter === 'all' 
    ? displayEntries 
    : displayEntries.filter(entry => entry.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sample': return '🧬';
      case 'verification': return '🔍';
      case 'training': return '📚';
      case 'validation': return '✅';
      default: return '🔗';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sample': return 'var(--accent-primary)';
      case 'verification': return 'var(--accent-teal)';
      case 'training': return 'var(--accent-secondary)';
      case 'validation': return '#4caf50';
      default: return 'var(--text-body)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      default: return 'var(--text-body)';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const handleEntryClick = (entry: BlockchainEntry) => {
    setSelectedEntry(entry);
    onEntryClick?.(entry);
  };

  return (
    <div className="blockchain-ledger">
      <div className="ledger-header">
        <h3>🔗 Blockchain Audit Trail</h3>
        <div className="ledger-filters">
          {(['all', 'sample', 'verification', 'training', 'validation'] as const).map(filterType => (
            <button
              key={filterType}
              className={`filter-btn ${filter === filterType ? 'active' : ''}`}
              onClick={() => setFilter(filterType)}
            >
              {getTypeIcon(filterType)} {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="ledger-timeline">
        {filteredEntries.map((entry, index) => (
          <div
            key={entry.id}
            className={`ledger-entry ${selectedEntry?.id === entry.id ? 'selected' : ''}`}
            onClick={() => handleEntryClick(entry)}
          >
            <div className="entry-connector">
              <div className="entry-dot" style={{ backgroundColor: getTypeColor(entry.type) }}>
                {getTypeIcon(entry.type)}
              </div>
              {index < filteredEntries.length - 1 && (
                <div className="entry-line" style={{ borderColor: getTypeColor(entry.type) }} />
              )}
            </div>

            <div className="entry-content">
              <div className="entry-header">
                <div className="entry-type" style={{ color: getTypeColor(entry.type) }}>
                  {getTypeIcon(entry.type)} {entry.type.toUpperCase()}
                </div>
                <div className="entry-status" style={{ color: getStatusColor(entry.status) }}>
                  {entry.status.toUpperCase()}
                </div>
              </div>

              <div className="entry-description">
                {entry.description}
              </div>

              <div className="entry-meta">
                <div className="entry-timestamp">
                  🕒 {formatTimestamp(entry.timestamp)}
                </div>
                <div className="entry-hash">
                  🔗 {truncateHash(entry.hash)}
                </div>
              </div>

              {entry.data && (
                <div className="entry-data">
                  <div className="data-preview">
                    {Object.entries(entry.data).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="data-item">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedEntry && (
        <div className="entry-details">
          <h4>Entry Details</h4>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedEntry.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedEntry.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{selectedEntry.status}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hash:</span>
              <span className="detail-value mono">{selectedEntry.hash}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Previous Hash:</span>
              <span className="detail-value mono">{selectedEntry.previousHash}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Timestamp:</span>
              <span className="detail-value">{formatTimestamp(selectedEntry.timestamp)}</span>
            </div>
          </div>
          {selectedEntry.data && (
            <div className="data-details">
              <h5>Data:</h5>
              <pre className="data-json">
                {JSON.stringify(selectedEntry.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockchainLedger;
