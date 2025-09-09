// Real-Time Biodiversity Map with eDNA Results and Blockchain Audit Trail

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import axios from 'axios';
import './MapComponent.css';

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
    const statusClass = iucnStatus.toLowerCase().replace(/\s/g, '-');
    
    return new DivIcon({
        html: `<div class="custom-marker ${statusClass}"></div>`,
        className: 'custom-marker-wrapper',
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
        <div className="map-container">
            <MapContainer 
                center={position} 
                zoom={7} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Dark Map">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer name="Dark Satellite">
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
                                                className="verify-blockchain-btn"
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
            <div className="map-stats-overlay">
                <h4>🌍 Live Biodiversity Monitor</h4>
                <p>Total Samples: <span className="stat-highlight">{eDNASamples.length}</span></p>
                <p>Endangered Species: <span className="stat-highlight">{eDNASamples.filter(s => 
                    s.iucnStatus === 'Critically Endangered' || s.iucnStatus === 'Endangered'
                ).length}</span></p>
                <p>Avg Biodiversity: <span className="stat-highlight">{eDNASamples.length > 0 ? 
                    (eDNASamples.reduce((acc, s) => acc + s.biodiversityIndex, 0) / eDNASamples.length).toFixed(2) : '0'
                }</span></p>
            </div>
        </div>
    );
};

export default MapComponent;