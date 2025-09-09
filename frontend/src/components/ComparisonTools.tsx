import React, { useState, useCallback } from 'react';
import './ComparisonTools.css';

interface ComparisonItem {
  id: string;
  name: string;
  data: any;
  metadata?: {
    timestamp?: string;
    version?: string;
    source?: string;
    [key: string]: any;
  };
}

interface ComparisonToolsProps {
  items: ComparisonItem[];
  onItemSelect?: (item: ComparisonItem) => void;
  onItemRemove?: (itemId: string) => void;
  onCompare?: (items: ComparisonItem[]) => void;
  maxItems?: number;
  className?: string;
}

const ComparisonTools: React.FC<ComparisonToolsProps> = ({
  items,
  onItemSelect,
  onItemRemove,
  onCompare,
  maxItems = 3,
  className = ''
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay' | 'table'>('side-by-side');

  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else if (prev.length < maxItems) {
        return [...prev, itemId];
      }
      return prev;
    });
    onItemSelect?.(items.find(item => item.id === itemId)!);
  }, [items, maxItems, onItemSelect]);

  const handleItemRemove = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(id => id !== itemId));
    onItemRemove?.(itemId);
  }, [onItemRemove]);

  const handleCompare = useCallback(() => {
    const selectedComparisonItems = items.filter(item => selectedItems.includes(item.id));
    onCompare?.(selectedComparisonItems);
  }, [items, selectedItems, onCompare]);

  const handleClearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const getSelectedItems = () => {
    return items.filter(item => selectedItems.includes(item.id));
  };

  const renderItemCard = (item: ComparisonItem) => {
    const isSelected = selectedItems.includes(item.id);
    const canSelect = !isSelected && selectedItems.length < maxItems;

    return (
      <div
        key={item.id}
        className={`comparison-item ${isSelected ? 'selected' : ''} ${canSelect ? 'selectable' : 'disabled'}`}
        onClick={() => canSelect && handleItemSelect(item.id)}
      >
        <div className="item-header">
          <div className="item-checkbox">
            {isSelected && <span className="checkbox-icon">✓</span>}
          </div>
          <h4 className="item-name">{item.name}</h4>
          <button
            className="item-remove"
            onClick={(e) => {
              e.stopPropagation();
              handleItemRemove(item.id);
            }}
          >
            ×
          </button>
        </div>
        
        {item.metadata && (
          <div className="item-metadata">
            {item.metadata.timestamp && (
              <span className="metadata-item">
                <span className="metadata-label">Time:</span>
                <span className="metadata-value">{new Date(item.metadata.timestamp).toLocaleString()}</span>
              </span>
            )}
            {item.metadata.version && (
              <span className="metadata-item">
                <span className="metadata-label">Version:</span>
                <span className="metadata-value">{item.metadata.version}</span>
              </span>
            )}
            {item.metadata.source && (
              <span className="metadata-item">
                <span className="metadata-label">Source:</span>
                <span className="metadata-value">{item.metadata.source}</span>
              </span>
            )}
          </div>
        )}

        <div className="item-preview">
          <div className="preview-content">
            {typeof item.data === 'object' ? (
              <pre className="preview-json">
                {JSON.stringify(item.data, null, 2).substring(0, 200)}
                {JSON.stringify(item.data, null, 2).length > 200 && '...'}
              </pre>
            ) : (
              <span className="preview-text">{String(item.data).substring(0, 100)}</span>
            )}
          </div>
        </div>

        {isSelected && (
          <div className="item-actions">
            <button
              className="action-button primary"
              onClick={(e) => {
                e.stopPropagation();
                handleItemSelect(item.id);
              }}
            >
              Deselect
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderComparisonView = () => {
    const selectedItems = getSelectedItems();
    
    if (selectedItems.length === 0) {
      return (
        <div className="comparison-empty">
          <p>Select items to compare</p>
        </div>
      );
    }

    switch (comparisonMode) {
      case 'side-by-side':
        return (
          <div className="side-by-side-comparison">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="comparison-panel">
                <div className="panel-header">
                  <h4>{item.name}</h4>
                  <span className="panel-index">#{index + 1}</span>
                </div>
                <div className="panel-content">
                  <pre className="comparison-data">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        );

      case 'overlay':
        return (
          <div className="overlay-comparison">
            <div className="overlay-container">
              {selectedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="overlay-item"
                  style={{ zIndex: selectedItems.length - index }}
                >
                  <div className="overlay-header">
                    <h4>{item.name}</h4>
                    <span className="overlay-index">#{index + 1}</span>
                  </div>
                  <div className="overlay-content">
                    <pre className="comparison-data">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="table-comparison">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Property</th>
                  {selectedItems.map(item => (
                    <th key={item.id}>{item.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getComparisonRows(selectedItems).map((row, index) => (
                  <tr key={index}>
                    <td className="property-name">{row.property}</td>
                    {row.values.map((value, valueIndex) => (
                      <td key={valueIndex} className="property-value">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  const getComparisonRows = (items: ComparisonItem[]) => {
    if (items.length === 0) return [];

    const allKeys = new Set<string>();
    items.forEach(item => {
      if (typeof item.data === 'object' && item.data !== null) {
        Object.keys(item.data).forEach(key => allKeys.add(key));
      }
    });

    return Array.from(allKeys).map(key => ({
      property: key,
      values: items.map(item => {
        if (typeof item.data === 'object' && item.data !== null) {
          return item.data[key] ?? 'N/A';
        }
        return 'N/A';
      })
    }));
  };

  return (
    <div className={`comparison-tools ${className}`}>
      <div className="comparison-header">
        <h3>Comparison Tools</h3>
        <div className="comparison-controls">
          <div className="mode-selector">
            <label>View Mode:</label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as any)}
            >
              <option value="side-by-side">Side by Side</option>
              <option value="overlay">Overlay</option>
              <option value="table">Table</option>
            </select>
          </div>
          
          <div className="selection-controls">
            <span className="selection-count">
              {selectedItems.length}/{maxItems} selected
            </span>
            <button
              className="control-button"
              onClick={handleClearSelection}
              disabled={selectedItems.length === 0}
            >
              Clear
            </button>
            <button
              className="control-button primary"
              onClick={handleCompare}
              disabled={selectedItems.length < 2}
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      <div className="comparison-content">
        <div className="items-list">
          {items.map(renderItemCard)}
        </div>

        <div className="comparison-view">
          {renderComparisonView()}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTools;
