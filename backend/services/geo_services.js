// In backend/services/geo_services.js

const axios = require('axios');

const getAddressFromCoordinates = async (lat, lon) => {
    // Validate coordinates
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        return "Invalid coordinates provided.";
    }
    
    // --- We are now using OpenStreetMap as our primary, reliable source ---
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    try {
        const osmResponse = await axios.get(osmUrl, {
            headers: { 'User-Agent': 'SIH2025-BioMapper/1.0' },
            timeout: 5000 // 5 second timeout
        });
        if (osmResponse.data && osmResponse.data.display_name) {
            console.log("✅ Successfully fetched location context from OpenStreetMap.");
            return osmResponse.data.display_name;
        }
        return "Address not found.";
    } catch (error) {
        console.error("OpenStreetMap API Error:", error.message);
        
        // Fallback to a basic location description
        try {
            // Simple coordinate-based location description
            const latDir = lat >= 0 ? 'N' : 'S';
            const lonDir = lon >= 0 ? 'E' : 'W';
            const fallbackLocation = `Location: ${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
            
            // Add basic region info for India
            if (lat >= 6 && lat <= 37 && lon >= 68 && lon <= 97) {
                return `${fallbackLocation} (India Region)`;
            }
            
            return fallbackLocation;
        } catch (fallbackError) {
            return "Location coordinates available but address lookup failed.";
        }
    }
};

module.exports = { getAddressFromCoordinates };