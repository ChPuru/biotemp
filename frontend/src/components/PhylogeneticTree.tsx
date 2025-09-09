// frontend/src/components/PhylogeneticTree.tsx
import React, { useEffect, useRef, useState } from 'react';

interface PhylogeneticTreeProps {
    newickTree: string | null;
}

const PhylogeneticTree: React.FC<PhylogeneticTreeProps> = ({ newickTree }) => {
    const treeRef = useRef<HTMLDivElement>(null);
    const [treeData, setTreeData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Parse Newick format and create a simple tree structure
    const parseNewick = (newick: string) => {
        try {
            // Simple Newick parser for basic visualization
            const cleanNewick = newick.trim().replace(/;$/, '');
            
            // Create a mock tree structure for visualization
            const species = cleanNewick.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
            const uniqueSpecies = Array.from(new Set(species));
            
            return {
                name: 'Root',
                children: uniqueSpecies.map((species, index) => ({
                    name: species,
                    distance: Math.random() * 0.5 + 0.1,
                    id: `node-${index}`
                }))
            };
        } catch (err) {
            console.error('Newick parsing error:', err);
            return null;
        }
    };

    // Simple SVG tree renderer
    const renderTree = (data: any) => {
        if (!data || !treeRef.current) return;

        const width = 600;
        const height = 400;
        const nodeRadius = 4;
        const levelHeight = height / (data.children.length + 1);

        const svg = `
            <svg width="${width}" height="${height}" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px;">
                <defs>
                    <style>
                        .tree-line { stroke: #495057; stroke-width: 2; fill: none; }
                        .tree-node { fill: #007bff; stroke: #fff; stroke-width: 2; }
                        .tree-label { font-family: Arial, sans-serif; font-size: 12px; fill: #212529; }
                        .tree-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #495057; }
                    </style>
                </defs>
                
                <!-- Title -->
                <text x="${width/2}" y="20" text-anchor="middle" class="tree-title">Phylogenetic Tree</text>
                
                <!-- Root node -->
                <circle cx="50" cy="${height/2}" r="${nodeRadius}" class="tree-node"/>
                <text x="60" y="${height/2 + 4}" class="tree-label">${data.name}</text>
                
                <!-- Branches and leaf nodes -->
                ${data.children.map((child: any, index: number) => {
                    const y = 50 + (index * (height - 100) / (data.children.length - 1));
                    const branchLength = 200 + (child.distance * 200);
                    
                    return `
                        <!-- Branch line -->
                        <line x1="50" y1="${height/2}" x2="${branchLength}" y2="${y}" class="tree-line"/>
                        
                        <!-- Leaf node -->
                        <circle cx="${branchLength}" cy="${y}" r="${nodeRadius}" class="tree-node"/>
                        <text x="${branchLength + 10}" y="${y + 4}" class="tree-label">${child.name}</text>
                    `;
                }).join('')}
            </svg>
        `;

        treeRef.current.innerHTML = svg;
    };

    useEffect(() => {
        if (newickTree && treeRef.current) {
            setError(null);
            try {
                const parsed = parseNewick(newickTree);
                if (parsed) {
                    setTreeData(parsed);
                    renderTree(parsed);
                } else {
                    setError('Failed to parse tree data');
                }
            } catch (err) {
                console.error('Tree rendering error:', err);
                setError('Error rendering phylogenetic tree');
            }
        }
    }, [newickTree]);

    if (!newickTree) {
        return (
            <div className="tree-container" style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px' 
            }}>
                <h4 style={{ color: '#6c757d', margin: '0 0 10px 0' }}>Phylogenetic Tree</h4>
                <p style={{ color: '#6c757d', margin: 0 }}>No tree data available</p>
                <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    background: 'linear-gradient(45deg, #f1f3f4 25%, transparent 25%), linear-gradient(-45deg, #f1f3f4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f3f4 75%), linear-gradient(-45deg, transparent 75%, #f1f3f4 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '15px',
                    borderRadius: '4px'
                }}>
                    <span style={{ color: '#adb5bd', fontSize: '48px' }}>🌳</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tree-container" style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '8px' 
            }}>
                <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>⚠️ Tree Rendering Error</h4>
                <p style={{ color: '#856404', margin: 0 }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="tree-container" style={{ padding: '10px' }}>
            <div ref={treeRef} style={{ width: '100%', minHeight: '400px', textAlign: 'center' }}></div>
            {treeData && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    background: '#e9ecef', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    color: '#495057' 
                }}>
                    <strong>Tree Info:</strong> {treeData.children.length} species nodes
                </div>
            )}
        </div>
    );
};

export default PhylogeneticTree;