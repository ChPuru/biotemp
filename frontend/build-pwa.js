// frontend/build-pwa.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}Starting BioMapper PWA build process...${colors.reset}`);

// Check if all required dependencies are installed
console.log(`${colors.yellow}Checking dependencies...${colors.reset}`);

try {
  // Read package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if workbox dependencies are installed
  const dependencies = { ...packageJson.dependencies };
  const requiredDeps = [
    'workbox-core',
    'workbox-expiration',
    'workbox-precaching',
    'workbox-routing',
    'workbox-strategies',
    'workbox-background-sync',
    'idb',
    'sass',
    'socket.io-client',
    'molstar',
    'three'
  ];
  
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`${colors.yellow}Installing missing dependencies: ${missingDeps.join(', ')}${colors.reset}`);
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  } else {
    console.log(`${colors.green}All required dependencies are installed.${colors.reset}`);
  }
  
  // Build the application
  console.log(`${colors.blue}Building the PWA application...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log(`${colors.green}PWA build completed successfully!${colors.reset}`);
  console.log(`${colors.blue}You can now deploy the contents of the 'build' directory to your web server.${colors.reset}`);
  
} catch (error) {
  console.error(`${colors.red}Error during build process:${colors.reset}`, error);
  process.exit(1);
}