import React, { useState } from 'react';
import './ExportOptions.css';

interface ExportOptionsProps {
  data: any;
  filename?: string;
  onExport?: (format: string, data: any) => void;
  className?: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  data,
  filename = 'biomapper-export',
  onExport,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    try {
      if (onExport) {
        await onExport(format, data);
      } else {
        await exportData(format, data, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const exportData = async (format: string, data: any, filename: string) => {
    switch (format) {
      case 'csv':
        await exportToCSV(data, filename);
        break;
      case 'json':
        await exportToJSON(data, filename);
        break;
      case 'pdf':
        await exportToPDF(data, filename);
        break;
      case 'excel':
        await exportToExcel(data, filename);
        break;
      case 'image':
        await exportToImage(data, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  };

  const exportToCSV = async (data: any, filename: string) => {
    const csv = convertToCSV(data);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
  };

  const exportToJSON = async (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  };

  const exportToPDF = async (data: any, filename: string) => {
    // This would typically use a PDF library like jsPDF
    const pdfContent = generatePDFContent(data);
    downloadFile(pdfContent, `${filename}.pdf`, 'application/pdf');
  };

  const exportToExcel = async (data: any, filename: string) => {
    // This would typically use a library like xlsx
    const excelContent = convertToExcel(data);
    downloadFile(excelContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const exportToImage = async (data: any, filename: string) => {
    // This would capture the current view as an image
    const canvas = await captureElementAsImage();
    const imageData = canvas.toDataURL('image/png');
    downloadFile(imageData, `${filename}.png`, 'image/png');
  };

  const convertToCSV = (data: any): string => {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(data);
  };

  const convertToExcel = (data: any): string => {
    // Simplified Excel export - in production, use xlsx library
    return convertToCSV(data);
  };

  const generatePDFContent = (data: any): string => {
    // Simplified PDF generation - in production, use jsPDF
    return `PDF Export for ${filename}\n\n${JSON.stringify(data, null, 2)}`;
  };

  const captureElementAsImage = async (): Promise<HTMLCanvasElement> => {
    // This would capture the current element as an image
    // For now, return a placeholder canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.fillText('Image Export', 50, 50);
    }
    return canvas;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportOptions = [
    {
      format: 'csv',
      label: 'CSV',
      icon: '📊',
      description: 'Comma-separated values'
    },
    {
      format: 'json',
      label: 'JSON',
      icon: '📄',
      description: 'JavaScript Object Notation'
    },
    {
      format: 'pdf',
      label: 'PDF',
      icon: '📋',
      description: 'Portable Document Format'
    },
    {
      format: 'excel',
      label: 'Excel',
      icon: '📈',
      description: 'Microsoft Excel format'
    },
    {
      format: 'image',
      label: 'Image',
      icon: '🖼️',
      description: 'PNG image capture'
    }
  ];

  return (
    <div className={`export-options ${className}`}>
      <button
        className="export-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        <span className="export-icon">📤</span>
        <span className="export-label">
          {isExporting ? 'Exporting...' : 'Export'}
        </span>
        <span className={`export-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="export-dropdown">
          <div className="export-header">
            <h4>Export Options</h4>
            <button
              className="export-close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="export-list">
            {exportOptions.map((option) => (
              <button
                key={option.format}
                className="export-option"
                onClick={() => handleExport(option.format)}
                disabled={isExporting}
              >
                <span className="export-option-icon">{option.icon}</span>
                <div className="export-option-content">
                  <span className="export-option-label">{option.label}</span>
                  <span className="export-option-description">{option.description}</span>
                </div>
                <span className="export-option-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
