import React, { useState, useEffect, useCallback } from 'react';
import './BlockchainExplorer.css';

interface BlockchainTransaction {
  id: string;
  hash: string;
  timestamp: string;
  type: 'finding' | 'analysis' | 'model_update' | 'audit';
  data: any;
  previousHash?: string;
  nonce: number;
  difficulty: number;
  merkleRoot: string;
  blockHeight: number;
  validator: string;
  signature: string;
}

interface SmartContract {
  address: string;
  name: string;
  version: string;
  functions: {
    name: string;
    inputs: any[];
    outputs: any[];
    stateMutability: string;
  }[];
  events: {
    name: string;
    inputs: any[];
  }[];
  abi: any[];
}

interface BlockchainExplorerProps {
  onTransactionClick?: (transaction: BlockchainTransaction) => void;
  onContractClick?: (contract: SmartContract) => void;
  className?: string;
}

const BlockchainExplorer: React.FC<BlockchainExplorerProps> = ({
  onTransactionClick,
  onContractClick,
  className = ''
}) => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [selectedTab, setSelectedTab] = useState<'transactions' | 'contracts' | 'blocks'>('transactions');
  const [selectedTransaction, setSelectedTransaction] = useState<BlockchainTransaction | null>(null);
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockTransactions: BlockchainTransaction[] = [
      {
        id: '1',
        hash: '0x1234567890abcdef1234567890abcdef12345678',
        timestamp: new Date().toISOString(),
        type: 'finding',
        data: {
          species: 'Panthera tigris',
          confidence: 0.95,
          location: { lat: 19.0760, lng: 72.8777 },
          metadata: { camera_trap: 'CT001', temperature: 28.5 }
        },
        previousHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        nonce: 12345,
        difficulty: 4,
        merkleRoot: '0xmerkle1234567890abcdef1234567890abcdef12',
        blockHeight: 1001,
        validator: 'validator-001',
        signature: '0xsig1234567890abcdef1234567890abcdef12345678'
      },
      {
        id: '2',
        hash: '0x2345678901bcdef1234567890abcdef1234567890',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'analysis',
        data: {
          analysis_type: 'biodiversity_assessment',
          results: { species_count: 15, diversity_index: 0.87 },
          parameters: { sample_size: 1000, method: 'metabarcoding' }
        },
        previousHash: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 12346,
        difficulty: 4,
        merkleRoot: '0xmerkle2345678901bcdef1234567890abcdef12',
        blockHeight: 1002,
        validator: 'validator-002',
        signature: '0xsig2345678901bcdef1234567890abcdef12345678'
      }
    ];

    const mockContracts: SmartContract[] = [
      {
        address: '0xcontract1234567890abcdef1234567890abcdef12',
        name: 'BioMapperCore',
        version: '1.0.0',
        functions: [
          {
            name: 'recordFinding',
            inputs: [
              { name: 'species', type: 'string' },
              { name: 'confidence', type: 'uint256' },
              { name: 'location', type: 'tuple' }
            ],
            outputs: [{ name: 'success', type: 'bool' }],
            stateMutability: 'nonpayable'
          },
          {
            name: 'getFindings',
            inputs: [{ name: 'location', type: 'tuple' }],
            outputs: [{ name: 'findings', type: 'tuple[]' }],
            stateMutability: 'view'
          }
        ],
        events: [
          {
            name: 'FindingRecorded',
            inputs: [
              { name: 'species', type: 'string', indexed: true },
              { name: 'confidence', type: 'uint256', indexed: false }
            ]
          }
        ],
        abi: []
      }
    ];

    setTransactions(mockTransactions);
    setContracts(mockContracts);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleTransactionClick = useCallback((transaction: BlockchainTransaction) => {
    setSelectedTransaction(transaction);
    onTransactionClick?.(transaction);
  }, [onTransactionClick]);

  const handleContractClick = useCallback((contract: SmartContract) => {
    setSelectedContract(contract);
    onContractClick?.(contract);
  }, [onContractClick]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateHash = (hash: string, length: number = 10) => {
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'finding': return '🔍';
      case 'analysis': return '📊';
      case 'model_update': return '🤖';
      case 'audit': return '🔒';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'finding': return 'var(--accent-success)';
      case 'analysis': return 'var(--accent-primary)';
      case 'model_update': return 'var(--accent-warning)';
      case 'audit': return 'var(--accent-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const renderTransactionList = () => (
    <div className="transaction-list">
      {filteredTransactions.map(transaction => (
        <div
          key={transaction.id}
          className="transaction-item"
          onClick={() => handleTransactionClick(transaction)}
        >
          <div className="transaction-header">
            <div className="transaction-type">
              <span className="type-icon">{getTypeIcon(transaction.type)}</span>
              <span className="type-label">{transaction.type}</span>
            </div>
            <div className="transaction-hash">
              {truncateHash(transaction.hash)}
            </div>
            <div className="transaction-timestamp">
              {formatTimestamp(transaction.timestamp)}
            </div>
          </div>
          <div className="transaction-details">
            <div className="detail-item">
              <span className="detail-label">Block:</span>
              <span className="detail-value">{transaction.blockHeight}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Validator:</span>
              <span className="detail-value">{transaction.validator}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Nonce:</span>
              <span className="detail-value">{transaction.nonce}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContractList = () => (
    <div className="contract-list">
      {contracts.map(contract => (
        <div
          key={contract.address}
          className="contract-item"
          onClick={() => handleContractClick(contract)}
        >
          <div className="contract-header">
            <div className="contract-name">
              <span className="contract-icon">📄</span>
              <span className="name">{contract.name}</span>
              <span className="version">v{contract.version}</span>
            </div>
            <div className="contract-address">
              {truncateHash(contract.address)}
            </div>
          </div>
          <div className="contract-functions">
            <div className="functions-header">Functions:</div>
            <div className="functions-list">
              {contract.functions.map((func, index) => (
                <div key={index} className="function-item">
                  <span className="function-name">{func.name}</span>
                  <span className="function-type">{func.stateMutability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTransactionDetail = () => {
    if (!selectedTransaction) return null;

    return (
      <div className="transaction-detail">
        <div className="detail-header">
          <h3>Transaction Details</h3>
          <button
            className="close-button"
            onClick={() => setSelectedTransaction(null)}
          >
            ×
          </button>
        </div>
        <div className="detail-content">
          <div className="detail-section">
            <h4>Basic Information</h4>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Hash:</span>
                <span className="detail-value">{selectedTransaction.hash}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedTransaction.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Timestamp:</span>
                <span className="detail-value">{formatTimestamp(selectedTransaction.timestamp)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Block Height:</span>
                <span className="detail-value">{selectedTransaction.blockHeight}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Blockchain Data</h4>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="detail-label">Previous Hash:</span>
                <span className="detail-value">{selectedTransaction.previousHash}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Merkle Root:</span>
                <span className="detail-value">{selectedTransaction.merkleRoot}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Nonce:</span>
                <span className="detail-value">{selectedTransaction.nonce}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Difficulty:</span>
                <span className="detail-value">{selectedTransaction.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Transaction Data</h4>
            <pre className="data-json">
              {JSON.stringify(selectedTransaction.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`blockchain-explorer ${className}`}>
      <div className="explorer-header">
        <h2>Blockchain Explorer</h2>
        <div className="explorer-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="finding">Findings</option>
              <option value="analysis">Analysis</option>
              <option value="model_update">Model Updates</option>
              <option value="audit">Audits</option>
            </select>
          </div>
        </div>
      </div>

      <div className="explorer-tabs">
        <button
          className={`tab-button ${selectedTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setSelectedTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`tab-button ${selectedTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setSelectedTab('contracts')}
        >
          Smart Contracts
        </button>
        <button
          className={`tab-button ${selectedTab === 'blocks' ? 'active' : ''}`}
          onClick={() => setSelectedTab('blocks')}
        >
          Blocks
        </button>
      </div>

      <div className="explorer-content">
        {selectedTab === 'transactions' && renderTransactionList()}
        {selectedTab === 'contracts' && renderContractList()}
        {selectedTab === 'blocks' && (
          <div className="blocks-placeholder">
            <p>Block explorer coming soon...</p>
          </div>
        )}
      </div>

      {selectedTransaction && renderTransactionDetail()}
    </div>
  );
};

export default BlockchainExplorer;
