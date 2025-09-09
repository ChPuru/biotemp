// Test script to verify route imports and basic functionality
const path = require('path');

console.log('Testing route imports...\n');

const routes = [
    'analysis',
    'collaboration', 
    'auth',
    'training',
    'satellite',
    'quantum',
    'federated_learning',
    'enhanced_federated_learning',
    'blockchain',
    'security',
    'qiime2',
    'bionemo',
    'case_studies',
    'cost_analysis',
    'benchmarking',
    'parabricks',
    'mamba_dna',
    'policy_simulation',
    'meta_analysis',
    'climate_integration',
    'economic_modeling',
    'global_monitoring'
];

let successCount = 0;
let errorCount = 0;

routes.forEach(routeName => {
    try {
        const routePath = `./routes/${routeName}`;
        const route = require(routePath);
        console.log(`✅ ${routeName}: OK`);
        successCount++;
    } catch (error) {
        console.log(`❌ ${routeName}: ERROR - ${error.message}`);
        errorCount++;
    }
});

console.log(`\nSummary:`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);

if (errorCount === 0) {
    console.log('\n🎉 All routes imported successfully!');
} else {
    console.log('\n⚠️  Some routes have issues that need to be fixed.');
}
