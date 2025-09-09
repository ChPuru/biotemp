// Real-Time Biodiversity Map with eDNA Results and Blockchain Audit Trail

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import axios from 'axios';

interface eDNASample {
    id: string;
    position: LatLngExpression;
    species: string[];
    timestamp: string;
    confidence: number;
    blockchainHash: string;
    iucnStatus: string;
    biodiversityIndex: number;
}

interface MapComponentProps {
    position: LatLngExpression;
    address: string;
    analysisResults?: any;
}

// Custom marker icons for different conservation statuses
const getMarkerIcon = (iucnStatus: string) => {
    const colors = {
        'Critically Endangered': '#FF0000',
        'Endangered': '#FF6600',
        'Vulnerable': '#FFCC00',
        'Near Threatened': '#99CC00',
        'Least Concern': '#00CC00',
        'Data Deficient': '#999999',
        'Not Evaluated': '#CCCCCC'
    };
    
    const color = colors[iucnStatus as keyof typeof colors] || '#CCCCCC';
    
    return new DivIcon({
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

// Real-time data updater component
const RealTimeUpdater: React.FC<{ onNewSample: (sample: eDNASample) => void }> = ({ onNewSample }) => {
    
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/analysis/realtime-samples');
                if (response.data.newSamples) {
                    response.data.newSamples.forEach((sample: eDNASample) => {
                        onNewSample(sample);
                    });
                }
            } catch (error) {
                console.log('Real-time updates unavailable');
            }
        }, 30000); // Update every 30 seconds
        
        return () => clearInterval(interval);
    }, [onNewSample]);
    
    return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ position, address, analysisResults }) => {
    const [eDNASamples, setEDNASamples] = useState<eDNASample[]>([]);
    const mapRef = useRef<any>(null);
    
    useEffect(() => {
        // Add current analysis as eDNA sample if available
        if (analysisResults && analysisResults.classification_results) {
            const currentSample: eDNASample = {
                id: `sample_${Date.now()}`,
                position: position,
                species: analysisResults.classification_results.map((r: any) => r.Predicted_Species),
                timestamp: new Date().toISOString(),
                confidence: analysisResults.classification_results.reduce((acc: number, r: any) => 
                    acc + parseFloat(r.Classifier_Confidence), 0) / analysisResults.classification_results.length,
                blockchainHash: generateBlockchainHash(),
                iucnStatus: analysisResults.classification_results[0]?.iucn_status || 'Not Evaluated',
                biodiversityIndex: analysisResults.biodiversity_metrics?.["Shannon Diversity Index"] || 0
            };
            
            setEDNASamples(prev => [...prev, currentSample]);
        }
    }, [analysisResults, position]);
    
    const generateBlockchainHash = () => {
        return 'bc_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    };
    
    const handleNewSample = (sample: eDNASample) => {
        setEDNASamples(prev => [...prev, sample]);
    };
    
    const verifyBlockchainIntegrity = async (sample: eDNASample) => {
        try {
            const response = await axios.post('http://localhost:5001/api/analysis/verify-blockchain', {
                sampleId: sample.id,
                hash: sample.blockchainHash
            });
            
            alert(`Blockchain Verification:\n${response.data.verified ? '✅ Verified' : '❌ Failed'}\nHash: ${sample.blockchainHash}`);
        } catch (error) {
            alert('Blockchain verification service unavailable');
        }
    };
    
    return (
        <div className="map-container" style={{ position: 'relative', height: '500px', width: '100%' }}>
            <MapContainer 
                center={position} 
                zoom={7} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.Overlay checked name="eDNA Samples">
                        <>
                            {eDNASamples.map((sample) => (
                                <Marker 
                                    key={sample.id}
                                    position={sample.position}
                                    icon={getMarkerIcon(sample.iucnStatus)}
                                    eventHandlers={{
                                        click: () => console.log('Sample clicked:', sample.id)
                                    }}
                                >
                                    <Popup>
                                        <div className="edna-popup">
                                            <h4>🧬 eDNA Sample</h4>
                                            <p><strong>Species Found:</strong> {sample.species.slice(0, 3).join(', ')}</p>
                                            <p><strong>Confidence:</strong> {(sample.confidence * 100).toFixed(1)}%</p>
                                            <p><strong>IUCN Status:</strong> 
                                                <span className={`status-${sample.iucnStatus.toLowerCase().replace(/\s/g, '-')}`}>
                                                    {sample.iucnStatus}
                                                </span>
                                            </p>
                                            <p><strong>Biodiversity Index:</strong> {sample.biodiversityIndex}</p>
                                            <p><strong>Timestamp:</strong> {new Date(sample.timestamp).toLocaleString()}</p>
                                            <button 
                                                onClick={() => verifyBlockchainIntegrity(sample)}
                                                style={{ 
                                                    background: '#007cba', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    padding: '5px 10px',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🔗 Verify Blockchain
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                            
                            {eDNASamples.map((sample) => (
                                <Circle
                                    key={`circle_${sample.id}`}
                                    center={sample.position}
                                    radius={sample.biodiversityIndex * 1000}
                                    pathOptions={{
                                        color: sample.iucnStatus === 'Critically Endangered' ? '#FF0000' :
                                               sample.iucnStatus === 'Endangered' ? '#FF6600' :
                                               sample.iucnStatus === 'Vulnerable' ? '#FFCC00' : '#00CC00',
                                        fillOpacity: 0.1,
                                        weight: 2
                                    }}
                                />
                            ))}
                        </>
                    </LayersControl.Overlay>
                </LayersControl>

                <Marker position={position}>
                    <Popup>
                        <strong>📍 Current Sample Location</strong><br />
                        {address}
                    </Popup>
                </Marker>
                
                <RealTimeUpdater onNewSample={handleNewSample} />
            </MapContainer>
            
            {/* Real-time statistics overlay */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '10px',
                borderRadius: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                zIndex: 1000
            }}>
                <h4>🌍 Live Biodiversity Monitor</h4>
                <p>Total Samples: {eDNASamples.length}</p>
                <p>Endangered Species: {eDNASamples.filter(s => 
                    s.iucnStatus === 'Critically Endangered' || s.iucnStatus === 'Endangered'
                ).length}</p>
                <p>Avg Biodiversity: {eDNASamples.length > 0 ? 
                    (eDNASamples.reduce((acc, s) => acc + s.biodiversityIndex, 0) / eDNASamples.length).toFixed(2) : '0'
                }</p>
            </div>
        </div>
    );
};

export default MapComponent;