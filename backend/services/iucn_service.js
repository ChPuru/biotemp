const axios = require('axios');

// IUCN Red List API Configuration
const IUCN_API_BASE = 'https://apiv3.iucnredlist.org/api/v3';
const IUCN_API_TOKEN = process.env.IUCN_API_TOKEN || 'demo-token'; // Get from https://apiv3.iucnredlist.org/api/v3/token

// Fallback IUCN Red List species database for offline/demo mode
const IUCN_DATABASE = {
  // Marine species
  'rhincodon typus': 'Endangered',
  'whale shark': 'Endangered',
  'carcharodon carcharias': 'Vulnerable',
  'great white shark': 'Vulnerable',
  'thunnus thynnus': 'Endangered',
  'bluefin tuna': 'Endangered',
  'chelonia mydas': 'Endangered',
  'green sea turtle': 'Endangered',
  'eretmochelys imbricata': 'Critically Endangered',
  'hawksbill turtle': 'Critically Endangered',
  
  // Terrestrial species
  'panthera tigris': 'Endangered',
  'tiger': 'Endangered',
  'panthera leo': 'Vulnerable',
  'lion': 'Vulnerable',
  'elephas maximus': 'Endangered',
  'asian elephant': 'Endangered',
  'loxodonta africana': 'Endangered',
  'african elephant': 'Endangered',
  'pongo abelii': 'Critically Endangered',
  'sumatran orangutan': 'Critically Endangered',
  'gorilla beringei': 'Critically Endangered',
  'mountain gorilla': 'Critically Endangered',
  
  // Birds
  'aquila chrysaetos': 'Least Concern',
  'golden eagle': 'Least Concern',
  'falco peregrinus': 'Least Concern',
  'peregrine falcon': 'Least Concern',
  'spheniscus humboldti': 'Vulnerable',
  'humboldt penguin': 'Vulnerable',
  
  // Fish and marine life
  'gadus morhua': 'Vulnerable',
  'atlantic cod': 'Vulnerable',
  'salmo salar': 'Least Concern',
  'atlantic salmon': 'Least Concern',
  'hippocampus': 'Vulnerable',
  'seahorse': 'Vulnerable',
  
  // Miscellaneous species
  'homo sapiens': 'Least Concern',
  'human': 'Least Concern',
  'escherichia coli': 'Not Evaluated',
  'e. coli': 'Not Evaluated',
  'saccharomyces cerevisiae': 'Not Evaluated',
  'yeast': 'Not Evaluated',
  
  // Common AI predictions - add more realistic mappings
  'unknown species': 'Data Deficient',
  'unidentified': 'Data Deficient',
  'marine organism': 'Data Deficient',
  'fish species': 'Least Concern',
  'bacterial species': 'Not Evaluated',
  'algae': 'Least Concern',
  'plankton': 'Least Concern',
  'coral': 'Vulnerable',
  'sponge': 'Least Concern',
  'penaeus': 'Least Concern',
  'prawn': 'Least Concern',
  'shrimp': 'Least Concern',
  
  // Deep sea species
  'melanocetus johnsonii': 'Data Deficient',
  'anglerfish': 'Data Deficient',
  'chauliodus sloani': 'Least Concern',
  'viperfish': 'Least Concern',
  
  // Coral species
  'acropora': 'Critically Endangered',
  'acropora cervicornis': 'Critically Endangered',
  'staghorn coral': 'Critically Endangered',
  'elkhorn coral': 'Critically Endangered',
  
  // Common marine biodiversity
  'mytilus': 'Least Concern',
  'mussel': 'Least Concern',
  'ostrea': 'Least Concern',
  'oyster': 'Least Concern',
  'crassostrea': 'Least Concern',
  'pecten': 'Least Concern',
  'scallop': 'Least Concern',
  'haliotis': 'Vulnerable',
  'abalone': 'Vulnerable',
  
  // Seaweed and algae
  'laminaria': 'Least Concern',
  'kelp': 'Least Concern',
  'fucus': 'Least Concern',
  'rockweed': 'Least Concern',
  'ulva': 'Least Concern',
  'sea lettuce': 'Least Concern',
  'porphyra': 'Least Concern',
  'nori': 'Least Concern',
  
  // Microorganisms and bacteria
  'bacillus': 'Not Evaluated',
  'streptococcus': 'Not Evaluated',
  'staphylococcus': 'Not Evaluated',
  'pseudomonas': 'Not Evaluated',
  'lactobacillus': 'Not Evaluated',
  'vibrio': 'Not Evaluated',
  'clostridium': 'Not Evaluated',
  
  // Plankton and microscopic life
  'diatom': 'Least Concern',
  'dinoflagellate': 'Least Concern',
  'copepod': 'Least Concern',
  'krill': 'Least Concern',
  'euphausiacea': 'Least Concern',
  'calanus': 'Least Concern',
  
  // Common fish families
  'cyprinidae': 'Least Concern',
  'carp family': 'Least Concern',
  'salmonidae': 'Near Threatened',
  'salmon family': 'Near Threatened',
  'scombridae': 'Vulnerable',
  'tuna family': 'Vulnerable',
  'percidae': 'Least Concern',
  'perch family': 'Least Concern',
  
  // Invertebrates
  'cnidaria': 'Vulnerable',
  'jellyfish': 'Least Concern',
  'echinodermata': 'Least Concern',
  'starfish': 'Least Concern',
  'sea urchin': 'Least Concern',
  'holothuroidea': 'Least Concern',
  'sea cucumber': 'Least Concern',
  
  // Default fallbacks for common AI predictions
  'marine species': 'Least Concern',
  'aquatic organism': 'Least Concern',
  'coastal species': 'Near Threatened',
  'deep sea species': 'Data Deficient',
  'endemic species': 'Vulnerable',
  'tropical species': 'Near Threatened',
  'temperate species': 'Least Concern',
  'staghorn coral': 'Critically Endangered',
  'montastraea': 'Endangered',
  'star coral': 'Endangered'
};

class IUCNService {
  constructor() {
    this.database = IUCN_DATABASE;
  }

  /**
   * Get IUCN Red List status for a species using real API
   * @param {string} speciesName - Scientific or common name
   * @returns {Promise<string>} IUCN status
   */
  async getIUCNStatus(speciesName) {
    if (!speciesName || typeof speciesName !== 'string') {
      return 'Not Evaluated';
    }

    // Try real IUCN API first
    try {
      const realStatus = await this.fetchFromIUCNAPI(speciesName);
      if (realStatus) {
        return realStatus;
      }
    } catch (error) {
      console.warn('IUCN API unavailable, using fallback database:', error.message);
    }

    // Fallback to local database
    return this.getIUCNStatusFromDatabase(speciesName);
  }

  /**
   * Fetch species status from real IUCN Red List API
   */
  async fetchFromIUCNAPI(speciesName) {
    try {
      const cleanName = speciesName.trim().replace(/\s+/g, ' ');
      
      // Search for species by name
      const searchResponse = await axios.get(
        `${IUCN_API_BASE}/species/${encodeURIComponent(cleanName)}`,
        {
          params: { token: IUCN_API_TOKEN },
          timeout: 10000
        }
      );

      if (searchResponse.data && searchResponse.data.result && searchResponse.data.result.length > 0) {
        const species = searchResponse.data.result[0];
        return species.category || 'Not Evaluated';
      }

      // If exact match fails, try species search endpoint
      const searchByNameResponse = await axios.get(
        `${IUCN_API_BASE}/species/find/${encodeURIComponent(cleanName)}`,
        {
          params: { token: IUCN_API_TOKEN },
          timeout: 10000
        }
      );

      if (searchByNameResponse.data && searchByNameResponse.data.result && searchByNameResponse.data.result.length > 0) {
        const species = searchByNameResponse.data.result[0];
        return species.category || 'Not Evaluated';
      }

      return null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return 'Not Evaluated';
      }
      throw error;
    }
  }

  /**
   * Fallback method using local database
   */
  getIUCNStatusFromDatabase(speciesName) {
    const normalizedName = speciesName.toLowerCase().trim();
    
    // Direct lookup
    if (this.database[normalizedName]) {
      return this.database[normalizedName];
    }

    // Partial matching for genus or common names
    for (const [key, status] of Object.entries(this.database)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return status;
      }
    }

    // Check for genus-level classification
    const genus = normalizedName.split(' ')[0];
    if (genus && this.database[genus]) {
      return this.database[genus];
    }

    // Default classification based on habitat/type
    if (this.isMarineSpecies(normalizedName)) {
      return 'Data Deficient';
    } else if (this.isTerrestrial(normalizedName)) {
      return 'Not Evaluated';
    }

    return 'Not Evaluated';
  }

  /**
   * Determine if species is marine-based
   */
  isMarineSpecies(speciesName) {
    const marineKeywords = [
      'fish', 'shark', 'whale', 'dolphin', 'turtle', 'coral', 'sea', 'marine',
      'ocean', 'reef', 'tuna', 'cod', 'salmon', 'bass', 'ray', 'eel'
    ];
    return marineKeywords.some(keyword => speciesName.includes(keyword));
  }

  /**
   * Determine if species is terrestrial
   */
  isTerrestrial(speciesName) {
    const terrestrialKeywords = [
      'mammal', 'bird', 'reptile', 'amphibian', 'insect', 'plant', 'tree',
      'tiger', 'lion', 'elephant', 'bear', 'wolf', 'eagle', 'hawk'
    ];
    return terrestrialKeywords.some(keyword => speciesName.includes(keyword));
  }

  /**
   * Get detailed IUCN information including threat level
   */
  async getDetailedStatus(speciesName) {
    const status = await this.getIUCNStatus(speciesName);
    
    const statusInfo = {
      status: status,
      threatLevel: this.getThreatLevel(status),
      description: this.getStatusDescription(status),
      actionRequired: this.getActionRequired(status)
    };

    return statusInfo;
  }

  getThreatLevel(status) {
    const levels = {
      'Extinct': 5,
      'Extinct in the Wild': 5,
      'Critically Endangered': 4,
      'Endangered': 3,
      'Vulnerable': 2,
      'Near Threatened': 1,
      'Least Concern': 0,
      'Data Deficient': -1,
      'Not Evaluated': -1
    };
    return levels[status] || -1;
  }

  getStatusDescription(status) {
    const descriptions = {
      'Extinct': 'No known individuals remaining',
      'Extinct in the Wild': 'Only survives in captivity',
      'Critically Endangered': 'Extremely high risk of extinction',
      'Endangered': 'High risk of extinction',
      'Vulnerable': 'High risk of endangerment',
      'Near Threatened': 'Likely to become threatened',
      'Least Concern': 'Lowest risk category',
      'Data Deficient': 'Inadequate information for assessment',
      'Not Evaluated': 'Not yet evaluated against criteria'
    };
    return descriptions[status] || 'Status unknown';
  }

  getActionRequired(status) {
    const actions = {
      'Critically Endangered': 'Immediate conservation action required',
      'Endangered': 'Urgent conservation measures needed',
      'Vulnerable': 'Conservation monitoring recommended',
      'Near Threatened': 'Population monitoring advised',
      'Least Concern': 'No immediate action required',
      'Data Deficient': 'Research and data collection needed',
      'Not Evaluated': 'Assessment required'
    };
    return actions[status] || 'Status assessment needed';
  }

  /**
   * Add new species to local database
   */
  addSpecies(scientificName, commonName, status) {
    if (scientificName) {
      this.database[scientificName.toLowerCase()] = status;
    }
    if (commonName) {
      this.database[commonName.toLowerCase()] = status;
    }
  }

  /**
   * Bulk update species database
   */
  updateDatabase(speciesData) {
    Object.assign(this.database, speciesData);
  }
}

module.exports = new IUCNService();
