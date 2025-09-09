import React, { useState, useRef, useEffect } from 'react';
import './InteractiveChart.css';

interface ChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
  children?: ChartData[];
  metadata?: any;
}

interface InteractiveChartProps {
  data: ChartData[];
  type: 'bar' | 'pie' | 'line' | 'scatter' | 'tree';
  title?: string;
  onDataClick?: (data: ChartData) => void;
  onDataHover?: (data: ChartData | null) => void;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  drillDownEnabled?: boolean;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  type,
  title,
  onDataClick,
  onDataHover,
  className = '',
  height = 400,
  showLegend = true,
  showTooltip = true,
  drillDownEnabled = true
}) => {
  const [hoveredData, setHoveredData] = useState<ChartData | null>(null);
  const [selectedData, setSelectedData] = useState<ChartData | null>(null);
  const [drillDownPath, setDrillDownPath] = useState<ChartData[]>([]);
  const [currentData, setCurrentData] = useState<ChartData[]>(data);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setCurrentData(data);
    setDrillDownPath([]);
    setSelectedData(null);
  }, [data]);

  const handleDataClick = (clickedData: ChartData) => {
    setSelectedData(clickedData);
    onDataClick?.(clickedData);

    if (drillDownEnabled && clickedData.children && clickedData.children.length > 0) {
      setDrillDownPath(prev => [...prev, clickedData]);
      setCurrentData(clickedData.children);
    }
  };

  const handleDataHover = (hovered: ChartData | null) => {
    setHoveredData(hovered);
    onDataHover?.(hovered);
  };

  const handleBackClick = () => {
    if (drillDownPath.length > 0) {
      const newPath = drillDownPath.slice(0, -1);
      setDrillDownPath(newPath);
      setCurrentData(newPath.length > 0 ? newPath[newPath.length - 1].children || data : data);
    }
  };

  const renderChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (type) {
      case 'bar':
        renderBarChart(ctx, currentData, canvas.width, canvas.height);
        break;
      case 'pie':
        renderPieChart(ctx, currentData, canvas.width, canvas.height);
        break;
      case 'line':
        renderLineChart(ctx, currentData, canvas.width, canvas.height);
        break;
      case 'scatter':
        renderScatterChart(ctx, currentData, canvas.width, canvas.height);
        break;
      case 'tree':
        renderTreeChart(ctx, currentData, canvas.width, canvas.height);
        break;
    }
  };

  const renderBarChart = (ctx: CanvasRenderingContext2D, data: ChartData[], width: number, height: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = width / data.length * 0.8;
    const barSpacing = width / data.length * 0.2;
    const chartHeight = height - 60;

    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const y = height - 40 - barHeight;

      // Bar
      ctx.fillStyle = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = 'var(--text-body)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - 20);

      // Value
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
    });
  };

  const renderPieChart = (ctx: CanvasRenderingContext2D, data: ChartData[], width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    let currentAngle = 0;

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.fill();

      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = 'var(--text-body)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, labelX, labelY);

      currentAngle += sliceAngle;
    });
  };

  const renderLineChart = (ctx: CanvasRenderingContext2D, data: ChartData[], width: number, height: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const chartHeight = height - 60;
    const chartWidth = width - 80;

    ctx.beginPath();
    ctx.strokeStyle = 'var(--accent-primary)';
    ctx.lineWidth = 2;

    data.forEach((item, index) => {
      const x = 40 + (index / (data.length - 1)) * chartWidth;
      const y = 30 + ((maxValue - item.value) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Data points
    data.forEach((item, index) => {
      const x = 40 + (index / (data.length - 1)) * chartWidth;
      const y = 30 + ((maxValue - item.value) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'var(--accent-primary)';
      ctx.fill();

      // Label
      ctx.fillStyle = 'var(--text-body)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x, height - 20);
    });
  };

  const renderScatterChart = (ctx: CanvasRenderingContext2D, data: ChartData[], width: number, height: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = height - 60;
    const chartWidth = width - 80;

    data.forEach((item, index) => {
      const x = 40 + (index / (data.length - 1)) * chartWidth;
      const y = 30 + ((maxValue - item.value) / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
      ctx.fill();

      // Label
      ctx.fillStyle = 'var(--text-body)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x, height - 20);
    });
  };

  const renderTreeChart = (ctx: CanvasRenderingContext2D, data: ChartData[], width: number, height: number) => {
    // Simple tree layout
    const nodeHeight = 40;
    const nodeWidth = 120;
    const levelHeight = 80;

    data.forEach((item, index) => {
      const x = (index + 1) * (width / (data.length + 1));
      const y = height / 2;

      // Node
      ctx.fillStyle = item.color || 'var(--accent-primary)';
      ctx.fillRect(x - nodeWidth / 2, y - nodeHeight / 2, nodeWidth, nodeHeight);

      // Label
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x, y + 4);

      // Value
      ctx.fillText(item.value.toString(), x, y + 20);
    });
  };

  useEffect(() => {
    renderChart();
  }, [currentData, type, height]);

  const getTooltipContent = () => {
    if (!hoveredData || !showTooltip) return null;

    return (
      <div className="chart-tooltip">
        <div className="tooltip-title">{hoveredData.label}</div>
        <div className="tooltip-value">Value: {hoveredData.value}</div>
        {hoveredData.metadata && (
          <div className="tooltip-metadata">
            {Object.entries(hoveredData.metadata).map(([key, value]) => (
              <div key={key} className="tooltip-item">
                <span className="tooltip-key">{key}:</span>
                <span className="tooltip-value">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`interactive-chart ${className}`}>
      {title && <h3 className="chart-title">{title}</h3>}
      
      {drillDownPath.length > 0 && (
        <div className="chart-navigation">
          <button onClick={handleBackClick} className="back-button">
            ← Back
          </button>
          <div className="breadcrumb">
            {drillDownPath.map((item, index) => (
              <span key={index} className="breadcrumb-item">
                {item.label}
                {index < drillDownPath.length - 1 && ' > '}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="chart-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="chart-canvas"
          onMouseMove={(e) => {
            // Simple hover detection - in production, use more sophisticated hit testing
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Find closest data point
            const closestData = currentData.find((item, index) => {
              // This is simplified - in production, implement proper hit testing
              return Math.abs(x - (index * 100 + 50)) < 50;
            });
            
            handleDataHover(closestData || null);
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const clickedData = currentData.find((item, index) => {
              return Math.abs(x - (index * 100 + 50)) < 50;
            });
            
            if (clickedData) {
              handleDataClick(clickedData);
            }
          }}
        />
        
        {getTooltipContent()}
      </div>

      {showLegend && (
        <div className="chart-legend">
          {currentData.map((item, index) => (
            <div key={item.id} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
              />
              <span className="legend-label">{item.label}</span>
              <span className="legend-value">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;
