# Protein Viewer Setup Guide

## Current Issues

The application is currently experiencing compilation errors related to the MolStar protein visualization library. The main issues are:

1. Missing dependencies:
   - `sass` package is required for processing SCSS files
   - Incorrect import paths for MolStar components

2. ESLint warnings in the codebase:
   - Unused variables in `ProteinViewer.tsx`
   - Anonymous default export in `offlineStorage.ts`

## Applied Fixes

1. **Installed missing dependencies:**
   ```
   npm install sass --save-dev
   ```

2. **Simplified ProteinViewer component:**
   - Created a placeholder component that displays protein information without 3D visualization
   - Removed problematic imports that were causing compilation errors

3. **Fixed ESLint warnings in offlineStorage.ts:**
   - Added type definitions for better type safety
   - Fixed the anonymous default export issue

## Complete MolStar Integration

To fully integrate the 3D protein viewer with MolStar, follow these steps:

1. **Install required dependencies:**
   ```
   npm install --save molstar@latest three@latest
   ```

2. **Update the ProteinViewer component:**
   - Follow the official MolStar documentation for proper import paths
   - Use the correct API methods for creating and configuring the viewer

3. **Example implementation:**
   ```typescript
   import React, { useEffect, useRef } from 'react';
   import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
   import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
   import { PluginContext } from 'molstar/lib/mol-plugin/context';
   import 'molstar/lib/mol-plugin-ui/skin/light.scss';

   // Initialize the viewer
   const plugin = await createPluginUI(viewerRef.current, {
     ...DefaultPluginUISpec(),
     layout: {
       initial: {
         isExpanded: false,
         showControls: false,
         controlsDisplay: 'reactive'
       }
     }
   });

   // Load a PDB structure
   const data = await plugin.builders.data.download({ 
     url: `https://files.rcsb.org/download/${pdbId}.pdb`, 
     isBinary: false 
   });
   const trajectory = await plugin.builders.structure.parseTrajectory(data, 'pdb');
   const model = await plugin.builders.structure.createModel(trajectory);
   const structure = await plugin.builders.structure.createStructure(model);
   await plugin.builders.structure.representation.applyPreset(structure, 'cartoon');
   ```

## Troubleshooting

If you encounter further issues:

1. **Version conflicts:**
   - Try using `npm install --legacy-peer-deps` to resolve dependency conflicts
   - Check compatibility between React, Three.js, and MolStar versions

2. **Import errors:**
   - Verify import paths against the installed version of MolStar
   - Check the MolStar documentation for any API changes

3. **Rendering issues:**
   - Ensure the container element has proper dimensions
   - Check browser console for WebGL-related errors