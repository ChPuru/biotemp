# BioMapper Collaborative Features

## Overview

This document provides an overview of the collaborative features and Progressive Web App (PWA) capabilities added to the BioMapper application.

## Collaborative Workspace

The collaborative workspace enables scientists to work together in real-time on genomic analysis and species identification. Key features include:

### Real-time Collaboration

- **Live Sessions**: Create or join collaborative sessions with other scientists
- **Real-time Annotations**: Add annotations to sequences that are instantly visible to all session participants
- **Voting System**: Vote on annotations to reach consensus on species identification
- **Shared Analysis**: View and discuss analysis results together

### 3D Protein Structure Visualization

- Integrated MolStar viewer for 3D protein structure visualization (implementation in progress)
- Load structures from PDB IDs or URLs
- Apply different representations (cartoon, ball-and-stick, etc.)
- Focus camera on specific residues or regions
- See PROTEIN_VIEWER_SETUP.md for implementation details and current status

### Blockchain Audit Trail

- All collaborative actions are recorded on the blockchain
- Immutable record of who made which annotations and when
- Track the history of collaborative sessions
- Verify the provenance of scientific findings

## Progressive Web App (PWA) Features

BioMapper now functions as a Progressive Web App, providing the following benefits:

### Offline Capabilities

- **Offline Data Access**: Access previously loaded sequences and annotations even without an internet connection
- **Background Sync**: Changes made offline are automatically synchronized when connectivity is restored
- **IndexedDB Storage**: Local database for storing sequences, annotations, and session data

### Installation & Performance

- **Installable**: Add BioMapper to your home screen on mobile devices or desktop
- **Fast Loading**: Cached resources for improved performance
- **Responsive Design**: Works on all device sizes

## Getting Started

### Accessing the Collaborative Workspace

1. Navigate to the "Collaborative Workspace" tab in the sidebar
2. Create a new session or join an existing one
3. Start collaborating with other scientists in real-time

### Using the 3D Protein Viewer

1. Within a collaborative session, click on a protein ID or use the "View Protein Structure" button
2. The 3D viewer will load the protein structure
3. Use mouse controls to rotate, zoom, and explore the structure

### Working Offline

1. Install the app by clicking the installation prompt in your browser
2. The app will continue to function even when offline
3. Any changes made offline will sync when you reconnect

## Technical Implementation

### Backend

- Socket.IO for real-time communication
- MongoDB for storing collaborative sessions and annotations
- Blockchain service for audit trail

### Frontend

- React components for collaborative workspace UI
- MolStar for 3D protein visualization
- Service workers for offline capabilities
- IndexedDB for local data storage

## Building the PWA

To build the Progressive Web App version of BioMapper:

```bash
cd frontend
node build-pwa.js
```

This will install all necessary dependencies and create an optimized production build with PWA features enabled.