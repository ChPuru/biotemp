// frontend/src/components/ARViewer.tsx
import React, { useRef, useEffect, useState } from 'react';

interface ARViewerProps {
  speciesData?: any;
  phylogeneticData?: any;
  onClose: () => void;
}

const ARViewer: React.FC<ARViewerProps> = ({ speciesData, phylogeneticData, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedMarkers, setDetectedMarkers] = useState<any[]>([]);

  useEffect(() => {
    checkARSupport();
  }, []);

  const checkARSupport = async () => {
    try {
      // Check for WebXR support
      if ('xr' in navigator) {
        const xr = (navigator as any).xr;
        const isSupported = await xr.isSessionSupported('immersive-ar');
        setIsARSupported(isSupported);
      } else {
        // Fallback to camera-based AR
        const hasCamera = await navigator.mediaDevices.getUserMedia({ video: true });
        if (hasCamera) {
          setIsARSupported(true);
        }
      }
    } catch (err) {
      console.error('AR support check failed:', err);
      setError('AR not supported on this device');
    }
  };

  const startAR = async () => {
    try {
      if ('xr' in navigator) {
        await startWebXRAR();
      } else {
        await startCameraAR();
      }
    } catch (err) {
      console.error('Failed to start AR:', err);
      setError('Failed to start AR session');
    }
  };

  const startWebXRAR = async () => {
    const xr = (navigator as any).xr;
    const session = await xr.requestSession('immersive-ar', {
      requiredFeatures: ['local', 'hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });

    // WebXR AR session setup
    setIsARActive(true);
    
    // Render 3D biodiversity models in AR space
    renderBiodiversityModels(session);
  };

  const startCameraAR = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setIsARActive(true);
      
      // Start marker detection and overlay rendering
      startMarkerDetection();
    }
  };

  const startMarkerDetection = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const detectMarkers = () => {
      if (!isARActive) return;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Simulate marker detection (in real implementation, use AR.js or similar)
      const mockMarkers = [
        {
          id: 'species_marker_1',
          position: { x: 200, y: 150 },
          confidence: 0.85,
          species: speciesData?.classification_results?.[0]?.Predicted_Species || 'Unknown Species'
        }
      ];
      
      setDetectedMarkers(mockMarkers);
      
      // Render AR overlays
      renderAROverlays(ctx, mockMarkers);
      
      requestAnimationFrame(detectMarkers);
    };
    
    detectMarkers();
  };

  const renderAROverlays = (ctx: CanvasRenderingContext2D, markers: any[]) => {
    markers.forEach(marker => {
      // Draw species information overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(marker.position.x - 100, marker.position.y - 60, 200, 120);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(marker.species, marker.position.x - 90, marker.position.y - 30);
      ctx.fillText(`Confidence: ${(marker.confidence * 100).toFixed(1)}%`, marker.position.x - 90, marker.position.y - 10);
      
      // Draw 3D-like species model placeholder
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(marker.position.x - 50, marker.position.y + 10, 100, 80);
      
      // Add phylogenetic tree visualization
      if (phylogeneticData) {
        drawPhylogeneticOverlay(ctx, marker.position.x, marker.position.y + 100);
      }
    });
  };

  const drawPhylogeneticOverlay = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1;
    
    // Simple tree structure
    const treeNodes = [
      { x: x, y: y, label: 'Root' },
      { x: x - 30, y: y + 30, label: 'Branch A' },
      { x: x + 30, y: y + 30, label: 'Branch B' },
      { x: x - 45, y: y + 60, label: 'Species 1' },
      { x: x - 15, y: y + 60, label: 'Species 2' }
    ];
    
    // Draw connections
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 30, y + 30);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30, y + 30);
    ctx.moveTo(x - 30, y + 30);
    ctx.lineTo(x - 45, y + 60);
    ctx.moveTo(x - 30, y + 30);
    ctx.lineTo(x - 15, y + 60);
    ctx.stroke();
    
    // Draw nodes
    treeNodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff6b6b';
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText(node.label, node.x + 5, node.y + 3);
    });
  };

  const renderBiodiversityModels = (session: any) => {
    // WebXR 3D model rendering would go here
    // This would integrate with Three.js or similar for 3D biodiversity visualization
    console.log('Rendering 3D biodiversity models in AR space');
  };

  const stopAR = () => {
    setIsARActive(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="ar-viewer-overlay">
      <div className="ar-viewer-container">
        <div className="ar-header">
          <h2>🔬 BioMapper AR Visualization</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="ar-error">
            <p>❌ {error}</p>
            <p>Try using a device with camera access or AR support</p>
          </div>
        )}

        {!isARSupported && !error && (
          <div className="ar-not-supported">
            <p>📱 AR not supported on this device</p>
            <p>For best experience, use a mobile device with camera access</p>
          </div>
        )}

        {isARSupported && !isARActive && (
          <div className="ar-start-screen">
            <div className="ar-features">
              <h3>AR Features:</h3>
              <ul>
                <li>🧬 3D Species Visualization</li>
                <li>🌳 Interactive Phylogenetic Trees</li>
                <li>📊 Real-time Biodiversity Data</li>
                <li>🎯 Marker-based Recognition</li>
              </ul>
            </div>
            <button className="start-ar-btn" onClick={startAR}>
              🚀 Start AR Experience
            </button>
          </div>
        )}

        {isARActive && (
          <div className="ar-active-view">
            <video
              ref={videoRef}
              className="ar-video"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="ar-canvas"
              width={640}
              height={480}
            />
            
            <div className="ar-controls">
              <button className="ar-control-btn" onClick={stopAR}>
                ⏹️ Stop AR
              </button>
              <div className="ar-info">
                <p>Detected: {detectedMarkers.length} markers</p>
                {speciesData && (
                  <p>Species: {speciesData.classification_results?.length || 0} identified</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ar-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }

        .ar-viewer-container {
          background: #1a1a1a;
          border-radius: 12px;
          padding: 20px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          color: white;
        }

        .ar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #333;
          padding-bottom: 15px;
        }

        .ar-header h2 {
          margin: 0;
          color: #00ff88;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
        }

        .ar-error, .ar-not-supported {
          text-align: center;
          padding: 40px;
          background: #2a1a1a;
          border-radius: 8px;
          border: 1px solid #ff4444;
        }

        .ar-start-screen {
          text-align: center;
          padding: 40px;
        }

        .ar-features {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .ar-features ul {
          list-style: none;
          padding: 0;
        }

        .ar-features li {
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }

        .start-ar-btn {
          background: linear-gradient(135deg, #00ff88, #00cc66);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .start-ar-btn:hover {
          transform: scale(1.05);
        }

        .ar-active-view {
          position: relative;
        }

        .ar-video, .ar-canvas {
          width: 100%;
          max-width: 640px;
          height: auto;
          border-radius: 8px;
        }

        .ar-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .ar-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 8px;
        }

        .ar-control-btn {
          background: #ff4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
        }

        .ar-info {
          color: #00ff88;
          font-size: 14px;
        }

        .ar-info p {
          margin: 2px 0;
        }
      `}</style>
    </div>
  );
};

export default ARViewer;
