import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ProteinViewerProps {
  pdbId?: string;
  pdbUrl?: string;
  width?: string;
  height?: string;
}

const ProteinViewer: React.FC<ProteinViewerProps> = ({
  pdbId,
  pdbUrl,
  width = '100%',
  height = '400px'
}) => {
  const { t } = useTranslation();
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This is a placeholder for the actual MolStar implementation
    // We'll display a message instead of trying to load the 3D viewer
    // until the dependency issues are resolved
    
    // Store ref value in a variable to avoid the ESLint warning
    const currentViewerRef = viewerRef.current;
    
    const loadProteinData = async () => {
      if (!currentViewerRef) return;
      
      // Display information about the protein
      currentViewerRef.innerHTML = `
        <div style="padding: 20px; background-color: #f5f5f5; border-radius: 4px;">
          <h3>${t('Protein Structure Viewer')}</h3>
          ${pdbId ? `<p>${t('PDB ID')}: ${pdbId}</p>` : ''}
          ${pdbUrl ? `<p>${t('PDB URL')}: ${pdbUrl}</p>` : ''}
          <p>${t('3D visualization temporarily unavailable')}</p>
          <p>${t('The protein structure viewer is being configured.')}</p>
        </div>
      `;
    };

    loadProteinData();
    
    return () => {
      if (currentViewerRef) {
        currentViewerRef.innerHTML = '';
      }
    };
  }, [pdbId, pdbUrl, t]);

  return (
    <div className="protein-viewer-container">
      <div 
        ref={viewerRef} 
        style={{ width, height, position: 'relative', border: '1px solid #ddd' }}
        className="protein-viewer"
      />
      {(!pdbId && !pdbUrl) && (
        <div className="protein-viewer-placeholder">
          <p>{t('No protein structure available')}</p>
        </div>
      )}
    </div>
  );
};

export default ProteinViewer;