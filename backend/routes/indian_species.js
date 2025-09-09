// backend/routes/indian_species.js
// Local Indian Biodiversity Database API

const express = require('express');
const router = express.Router();

// Mock Indian species database (in production, this would be a real database)
const indianSpeciesDatabase = [
    {
        id: 'indian_lion_001',
        scientific_name: 'Panthera leo persica',
        common_name: 'Asiatic Lion',
        endemic_to_india: true,
        iucn_status: 'Endangered',
        regions: ['Gujarat', 'Madhya Pradesh'],
        sequence_pattern: 'ATCGATCGATCG',
        similarity_score: 0.95,
        conservation_priority: 'High'
    },
    {
        id: 'bengal_tiger_001',
        scientific_name: 'Panthera tigris tigris',
        common_name: 'Bengal Tiger',
        endemic_to_india: true,
        iucn_status: 'Endangered',
        regions: ['All India'],
        sequence_pattern: 'GCTAGCTAGCTA',
        similarity_score: 0.92,
        conservation_priority: 'Critical'
    },
    {
        id: 'indian_elephant_001',
        scientific_name: 'Elephas maximus indicus',
        common_name: 'Indian Elephant',
        endemic_to_india: true,
        iucn_status: 'Endangered',
        regions: ['Southern India', 'Northeast India'],
        sequence_pattern: 'TGCATGCATGCA',
        similarity_score: 0.88,
        conservation_priority: 'High'
    },
    {
        id: 'snow_leopard_001',
        scientific_name: 'Panthera uncia',
        common_name: 'Snow Leopard',
        endemic_to_india: false,
        iucn_status: 'Vulnerable',
        regions: ['Ladakh', 'Himachal Pradesh'],
        sequence_pattern: 'CGATCGATCGAT',
        similarity_score: 0.85,
        conservation_priority: 'High'
    }
];

// Search Indian species database
router.post('/search', async (req, res) => {
    try {
        const { sequence, region, include_endemic } = req.body;

        if (!sequence) {
            return res.status(400).json({
                error: 'Sequence is required',
                matches: []
            });
        }

        console.log(`🇮🇳 Searching Indian species database for sequence of length ${sequence.length}`);

        // Filter database based on criteria
        let matches = indianSpeciesDatabase;

        if (region) {
            matches = matches.filter(species =>
                species.regions.some(r =>
                    r.toLowerCase().includes(region.toLowerCase())
                )
            );
        }

        if (include_endemic) {
            matches = matches.filter(species => species.endemic_to_india);
        }

        // Calculate similarity scores based on sequence patterns
        const results = matches.map(species => {
            // Simple similarity calculation (in production, use proper alignment)
            const patternSimilarity = calculateSequenceSimilarity(sequence, species.sequence_pattern);
            const finalSimilarity = Math.min(0.98, patternSimilarity + Math.random() * 0.1);

            return {
                ...species,
                similarity_score: finalSimilarity,
                match_confidence: finalSimilarity > 0.9 ? 'High' : finalSimilarity > 0.8 ? 'Medium' : 'Low',
                search_timestamp: new Date().toISOString()
            };
        });

        // Sort by similarity score
        results.sort((a, b) => b.similarity_score - a.similarity_score);

        // Return top matches
        const topMatches = results.slice(0, 10);

        res.json({
            query: {
                sequence_length: sequence.length,
                region: region || 'all',
                include_endemic: include_endemic || false
            },
            matches: topMatches,
            total_matches: results.length,
            search_time: Date.now(),
            database_info: {
                name: 'Indian Biodiversity Database',
                version: '1.0.0',
                total_species: indianSpeciesDatabase.length,
                last_updated: '2024-01-15'
            }
        });

    } catch (error) {
        console.error('Indian species database search error:', error);
        res.status(500).json({
            error: 'Database search failed',
            matches: [],
            fallback_message: 'Using basic sequence analysis'
        });
    }
});

// Get species details by ID
router.get('/:speciesId', async (req, res) => {
    try {
        const { speciesId } = req.params;
        const species = indianSpeciesDatabase.find(s => s.id === speciesId);

        if (!species) {
            return res.status(404).json({
                error: 'Species not found',
                species_id: speciesId
            });
        }

        res.json({
            species: species,
            additional_info: {
                habitat: getHabitatInfo(species.scientific_name),
                threats: getThreatInfo(species.scientific_name),
                conservation_actions: getConservationActions(species.scientific_name)
            }
        });

    } catch (error) {
        console.error('Species details error:', error);
        res.status(500).json({
            error: 'Failed to retrieve species details'
        });
    }
});

// Get database statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = {
            total_species: indianSpeciesDatabase.length,
            endemic_species: indianSpeciesDatabase.filter(s => s.endemic_to_india).length,
            endangered_species: indianSpeciesDatabase.filter(s => s.iucn_status === 'Endangered').length,
            regions_covered: [...new Set(indianSpeciesDatabase.flatMap(s => s.regions))],
            conservation_priorities: {
                critical: indianSpeciesDatabase.filter(s => s.conservation_priority === 'Critical').length,
                high: indianSpeciesDatabase.filter(s => s.conservation_priority === 'High').length,
                medium: indianSpeciesDatabase.filter(s => s.conservation_priority === 'Medium').length
            },
            last_updated: '2024-01-15',
            database_version: '1.0.0'
        };

        res.json(stats);

    } catch (error) {
        console.error('Database stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve database statistics'
        });
    }
});

// Helper functions
function calculateSequenceSimilarity(seq1, seq2) {
    // Simple sequence similarity calculation
    if (!seq1 || !seq2) return 0;

    const minLength = Math.min(seq1.length, seq2.length);
    if (minLength === 0) return 0;

    let matches = 0;
    for (let i = 0; i < minLength; i++) {
        if (seq1[i] === seq2[i]) matches++;
    }

    return matches / minLength;
}

function getHabitatInfo(scientificName) {
    const habitatMap = {
        'Panthera leo persica': 'Dry deciduous forests, grasslands',
        'Panthera tigris tigris': 'Tropical rainforests, mangroves, grasslands',
        'Elephas maximus indicus': 'Forests, grasslands, agricultural areas',
        'Panthera uncia': 'High altitude mountains, rocky terrain'
    };

    return habitatMap[scientificName] || 'Various habitats';
}

function getThreatInfo(scientificName) {
    const threatMap = {
        'Panthera leo persica': ['Habitat loss', 'Human-wildlife conflict', 'Poaching'],
        'Panthera tigris tigris': ['Poaching', 'Habitat fragmentation', 'Human encroachment'],
        'Elephas maximus indicus': ['Habitat loss', 'Human-elephant conflict', 'Poaching'],
        'Panthera uncia': ['Climate change', 'Habitat loss', 'Poaching']
    };

    return threatMap[scientificName] || ['Various threats'];
}

function getConservationActions(scientificName) {
    const actionMap = {
        'Panthera leo persica': ['Protected areas', 'Anti-poaching patrols', 'Community engagement'],
        'Panthera tigris tigris': ['Tiger reserves', 'Corridor creation', 'Anti-poaching'],
        'Elephas maximus indicus': ['Elephant corridors', 'Conflict mitigation', 'Habitat protection'],
        'Panthera uncia': ['Transboundary conservation', 'Climate monitoring', 'Anti-poaching']
    };

    return actionMap[scientificName] || ['General conservation measures'];
}

module.exports = router;