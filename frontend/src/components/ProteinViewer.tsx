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
        <div style="padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🧬</div>
          <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">${t('Protein Structure Analysis')}</h3>
          ${pdbId ? `<p style="margin: 8px 0; font-size: 16px;"><strong>${t('PDB ID')}:</strong> ${pdbId}</p>` : ''}
          ${pdbUrl ? `<p style="margin: 8px 0; font-size: 16px;"><strong>${t('Source')}:</strong> ${pdbUrl}</p>` : ''}
          <div style="margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.1); border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">${t('3D visualization is being configured')}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${t('Structure data is available for analysis')}</p>
          </div>
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
        <div className="protein-viewer-placeholder" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#666',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧬</div>
          <p style={{ margin: '0', fontWeight: '500' }}>{t('No protein structure available')}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: '0.7' }}>{t('Upload a sequence to analyze protein structures')}</p>
        </div>
      )}
    </div>
  );
};

export default ProteinViewer;