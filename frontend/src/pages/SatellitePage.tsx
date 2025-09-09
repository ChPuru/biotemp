import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './SatellitePage.css';

interface Hotspot {
    id: string;
    latitude: number;
    longitude: number;
    confidence: number;
    predicted_species: string;
    habitat_type: string;
    threat_level: string;
}

interface HabitatAnalysis {
    deforestation_rate: number;
    urbanization_index: number;
    water_body_change: number;
    vegetation_health: number;
    alerts: string[];
}

const SatellitePage: React.FC = () => {
    const { t } = useTranslation();
    const [satelliteImage, setSatelliteImage] = useState<string | null>(null);
    const [beforeImage, setBeforeImage] = useState<string | null>(null);
    const [afterImage, setAfterImage] = useState<string | null>(null);
    const [slider, setSlider] = useState<number>(50);
    const [habitatAnalysis, setHabitatAnalysis] = useState<HabitatAnalysis | null>(null);
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [loading, setLoading] = useState(false);
    const [lat, setLat] = useState('19.0760');
    const [lon, setLon] = useState('72.8777');
    const [startDate, setStartDate] = useState('2023-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const handleGetSatelliteImagery = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5001/api/analysis/satellite-imagery?lat=${lat}&lon=${lon}`);
            if (response.data.status === 'success') {
                setSatelliteImage(response.data.imagery_url);
            }
        } catch (error) {
            console.error('Satellite imagery error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHabitatAnalysis = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5001/api/analysis/habitat-change', {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                startDate,
                endDate
            });
            if (response.data.status === 'success') {
                setHabitatAnalysis(response.data.analysis);
                setBeforeImage(response.data.comparison_images.historical);
                setAfterImage(response.data.comparison_images.current);
            }
        } catch (error) {
            console.error('Habitat analysis error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHotspotPrediction = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5001/api/analysis/biodiversity-hotspots?lat=${lat}&lon=${lon}&radius=10`);
            if (response.data.status === 'success') {
                setHotspots(response.data.hotspots);
            }
        } catch (error) {
            console.error('Hotspot prediction error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="satellite-page">
            <h1>{t('satellite.header')}</h1>
            <p>{t('satellite.subheader')}</p>

            <div className="satellite-controls">
                <div className="input-group">
                    <label htmlFor="latitude-input">{t('satellite.latitude')}</label>
                    <input id="latitude-input" type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 19.0760" />
                </div>
                <div className="input-group">
                    <label htmlFor="longitude-input">{t('satellite.longitude')}</label>
                    <input id="longitude-input" type="text" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="e.g. 72.8777" />
                </div>
                <div className="input-group">
                    <label htmlFor="start-date-input">{t('satellite.start_date')}</label>
                    <input id="start-date-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="input-group">
                    <label htmlFor="end-date-input">{t('satellite.end_date')}</label>
                    <input id="end-date-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            </div>

            <div className="satellite-actions">
                <button onClick={handleGetSatelliteImagery} disabled={loading}>
                    {loading ? t('satellite.loading') : t('satellite.get_imagery')}
                </button>
                <button onClick={handleHabitatAnalysis} disabled={loading}>
                    {loading ? t('satellite.analyzing') : t('satellite.habitat_change')}
                </button>
                <button onClick={handleHotspotPrediction} disabled={loading}>
                    {loading ? t('satellite.predicting') : t('satellite.hotspots')}
                </button>
            </div>

            {satelliteImage && (
                <div className="satellite-results">
                    <h3>{t('satellite.imagery_header')}</h3>
                    <img src={satelliteImage} alt="Satellite imagery" className="satellite-image" />
                </div>
            )}

            {habitatAnalysis && (
                <div className="habitat-results">
                    <h3>{t('satellite.habitat_header')}</h3>
                    {beforeImage && afterImage && (
                        <div className="before-after-container">
                            <div className="before-after-wrapper">
                                <img src={beforeImage} alt="Before" className="before-image" />
                                <div className="after-image" style={{ width: `${slider}%`, backgroundImage: `url(${afterImage})` }} />
                            </div>
                            <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(parseInt(e.target.value))} />
                        </div>
                    )}
                    <div className="habitat-metrics">
                        <div className="metric">
                            <h4>{t('satellite.deforestation')}</h4>
                            <p className={habitatAnalysis.deforestation_rate > 0 ? 'negative' : 'positive'}>
                                {habitatAnalysis.deforestation_rate.toFixed(2)}%
                            </p>
                        </div>
                        <div className="metric">
                            <h4>{t('satellite.urbanization')}</h4>
                            <p>{habitatAnalysis.urbanization_index.toFixed(1)}</p>
                        </div>
                        <div className="metric">
                            <h4>{t('satellite.water_change')}</h4>
                            <p className={habitatAnalysis.water_body_change < 0 ? 'negative' : 'positive'}>
                                {habitatAnalysis.water_body_change.toFixed(2)}%
                            </p>
                        </div>
                        <div className="metric">
                            <h4>{t('satellite.vegetation')}</h4>
                            <p>{habitatAnalysis.vegetation_health.toFixed(1)}%</p>
                        </div>
                    </div>
                    {habitatAnalysis.alerts.length > 0 && (
                        <div className="habitat-alerts">
                            <h4>{t('satellite.alerts')}</h4>
                            <ul>
                                {habitatAnalysis.alerts.map((alert, index) => (
                                    <li key={index}>{alert}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {hotspots.length > 0 && (
                <div className="hotspots-results">
                    <h3>{t('satellite.hotspots_header')}</h3>
                    <div className="hotspots-grid">
                        {hotspots.map((hotspot) => (
                            <div key={hotspot.id} className="hotspot-card">
                                <h4>{hotspot.predicted_species}</h4>
                                <p><strong>Habitat:</strong> {hotspot.habitat_type}</p>
                                <p><strong>Confidence:</strong> {(hotspot.confidence * 100).toFixed(1)}%</p>
                                <p><strong>Threat Level:</strong>
                                    <span className={`threat-${hotspot.threat_level.toLowerCase()}`}>
                                        {hotspot.threat_level}
                                    </span>
                                </p>
                                <p><strong>Location:</strong> {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SatellitePage;