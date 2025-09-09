// frontend/src/pages/AnalysisPage.tsx

import React, { useState } from 'react';
import Dashboard from '../components/Dashboard';
import ARViewer from '../components/ARViewer';
import { useTranslation } from 'react-i18next';

const AnalysisPage: React.FC = () => {
    const { t } = useTranslation();
    const [showAR, setShowAR] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<any>(null);

    const handleAnalysisComplete = (results: any) => {
        setAnalysisResults(results);
    };

    const handleARToggle = () => {
        setShowAR(!showAR);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>{t('subtitle')}</h1>
                {analysisResults && (
                    <button 
                        onClick={handleARToggle}
                        style={{
                            background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔬 Launch AR Viewer
                    </button>
                )}
            </div>
            <p>The core analysis pipeline. Upload an eDNA sample and get real-time, multi-expert AI analysis of the biodiversity within.</p>
            <Dashboard onAnalysisComplete={handleAnalysisComplete} />
            
            {showAR && (
                <ARViewer 
                    speciesData={analysisResults}
                    phylogeneticData={analysisResults?.phylogenetic_tree}
                    onClose={() => setShowAR(false)}
                />
            )}
        </div>
    );
};
export default AnalysisPage;