#!/usr/bin/env node
/**
 * Cloudflare Tunnel Setup Script
 * Automates the setup and management of Cloudflare tunnels for BioMapper
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

class CloudflareTunnelManager {
    constructor() {
        this.configPath = path.join(__dirname, '../config/cloudflare-tunnel.json');
        this.tunnelName = process.env.CLOUDFLARE_TUNNEL_NAME || 'biomapper-tunnel';
        this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.localPort = process.env.PORT || 5001;
    }

    async setupTunnel() {
        try {
            console.log('🚀 Setting up Cloudflare Tunnel for BioMapper...');

            // Check if cloudflared is installed
            await this.checkCloudflaredInstallation();

            // Authenticate with Cloudflare
            await this.authenticate();

            // Create tunnel
            const tunnelId = await this.createTunnel();

            // Configure tunnel
            await this.configureTunnel(tunnelId);

            // Start tunnel
            await this.startTunnel(tunnelId);

            console.log('✅ Cloudflare Tunnel setup completed successfully!');
            return tunnelId;

        } catch (error) {
            console.error('❌ Cloudflare Tunnel setup failed:', error.message);
            throw error;
        }
    }

    async checkCloudflaredInstallation() {
        try {
            execSync('cloudflared version', { stdio: 'pipe' });
            console.log('✅ cloudflared is installed');
        } catch (error) {
            console.log('📦 Installing cloudflared...');
            await this.installCloudflared();
        }
    }

    async installCloudflared() {
        const platform = process.platform;
        const arch = process.arch;

        let downloadUrl = '';

        if (platform === 'win32') {
            downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-${arch === 'x64' ? 'amd64' : '386'}.exe`;
        } else if (platform === 'darwin') {
            downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-${arch === 'arm64' ? 'arm64' : 'amd64'}.tgz`;
        } else if (platform === 'linux') {
            downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${arch === 'x64' ? 'amd64' : 'arm64'}.deb`;
        } else {
            throw new Error(`Unsupported platform: ${platform}-${arch}`);
        }

        console.log(`Downloading cloudflared from: ${downloadUrl}`);

        // Download and install cloudflared
        const installPath = path.join(__dirname, '../bin/cloudflared');
        await fs.mkdir(path.dirname(installPath), { recursive: true });

        await this.downloadFile(downloadUrl, installPath);

        if (platform !== 'win32') {
            execSync(`chmod +x ${installPath}`);
        }

        // Add to PATH or use full path
        console.log('✅ cloudflared installed successfully');
    }

    async authenticate() {
        if (!this.apiToken) {
            throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
        }

        console.log('🔐 Authenticating with Cloudflare...');

        try {
            execSync(`cloudflared auth login --api-token ${this.apiToken}`, {
                stdio: 'inherit',
                timeout: 30000
            });
            console.log('✅ Authentication successful');
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    async createTunnel() {
        console.log(`🛠️ Creating tunnel: ${this.tunnelName}`);

        try {
            const result = execSync(`cloudflared tunnel create ${this.tunnelName}`, {
                encoding: 'utf8',
                timeout: 30000
            });

            // Extract tunnel ID from output
            const tunnelIdMatch = result.match(/tunnel\s+([a-f0-9-]+)/i);
            if (!tunnelIdMatch) {
                throw new Error('Could not extract tunnel ID from output');
            }

            const tunnelId = tunnelIdMatch[1];
            console.log(`✅ Tunnel created with ID: ${tunnelId}`);

            // Save tunnel configuration
            await this.saveTunnelConfig(tunnelId);

            return tunnelId;

        } catch (error) {
            // Check if tunnel already exists
            if (error.message.includes('already exists')) {
                console.log('ℹ️ Tunnel already exists, retrieving existing tunnel...');
                return await this.getExistingTunnel();
            }
            throw error;
        }
    }

    async getExistingTunnel() {
        try {
            const result = execSync(`cloudflared tunnel list`, {
                encoding: 'utf8'
            });

            const lines = result.split('\n');
            for (const line of lines) {
                if (line.includes(this.tunnelName)) {
                    const parts = line.trim().split(/\s+/);
                    return parts[0]; // First column is tunnel ID
                }
            }

            throw new Error(`Tunnel ${this.tunnelName} not found`);
        } catch (error) {
            throw new Error(`Could not retrieve existing tunnel: ${error.message}`);
        }
    }

    async configureTunnel(tunnelId) {
        console.log('⚙️ Configuring tunnel...');

        const config = {
            tunnel: this.tunnelName,
            credentials_file: path.join(__dirname, '../config/cloudflare-tunnel.json'),
            ingress: [
                {
                    hostname: `${this.tunnelName}.yourdomain.com`, // Replace with your domain
                    service: `http://localhost:${this.localPort}`
                },
                {
                    service: 'http_status:404'
                }
            ]
        };

        const configPath = path.join(__dirname, '../config/cloudflare-tunnel.yml');
        await fs.mkdir(path.dirname(configPath), { recursive: true });

        const yamlContent = `
tunnel: ${this.tunnelName}
credentials-file: ${config.credentials_file}

ingress:
  - hostname: ${this.tunnelName}.yourdomain.com
    service: http://localhost:${this.localPort}
  - service: http_status:404
`;

        await fs.writeFile(configPath, yamlContent);
        console.log(`✅ Tunnel configuration saved to: ${configPath}`);
    }

    async startTunnel(tunnelId) {
        console.log('🚀 Starting tunnel...');

        const configPath = path.join(__dirname, '../config/cloudflare-tunnel.yml');

        // Start tunnel in background
        const tunnelProcess = spawn('cloudflared', ['tunnel', 'run', '--config', configPath, this.tunnelName], {
            detached: true,
            stdio: 'ignore'
        });

        tunnelProcess.unref();

        // Wait a moment for tunnel to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`✅ Tunnel started successfully!`);
        console.log(`🌐 Your BioMapper instance is now accessible at: https://${this.tunnelName}.yourdomain.com`);

        return tunnelProcess;
    }

    async saveTunnelConfig(tunnelId) {
        const config = {
            tunnel_id: tunnelId,
            tunnel_name: this.tunnelName,
            created_at: new Date().toISOString(),
            local_port: this.localPort,
            status: 'active'
        };

        await fs.mkdir(path.dirname(this.configPath), { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }

    async stopTunnel() {
        try {
            console.log('🛑 Stopping tunnel...');
            execSync(`cloudflared tunnel cleanup ${this.tunnelName}`, { stdio: 'inherit' });
            console.log('✅ Tunnel stopped successfully');
        } catch (error) {
            console.error('❌ Failed to stop tunnel:', error.message);
        }
    }

    async getTunnelStatus() {
        try {
            const result = execSync('cloudflared tunnel list', {
                encoding: 'utf8'
            });

            const lines = result.split('\n');
            for (const line of lines) {
                if (line.includes(this.tunnelName)) {
                    return {
                        status: 'active',
                        details: line.trim()
                    };
                }
            }

            return { status: 'inactive' };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    async downloadFile(url, destPath) {
        return new Promise((resolve, reject) => {
            const file = require('fs').createWriteStream(destPath);

            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (error) => {
                fs.unlink(destPath, () => {}); // Delete partial file
                reject(error);
            });
        });
    }

    // Utility methods
    async cleanup() {
        try {
            await this.stopTunnel();
            await fs.unlink(this.configPath).catch(() => {});
            console.log('🧹 Cleanup completed');
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }

    getTunnelInfo() {
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            return config;
        } catch (error) {
            return null;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'setup';

    const manager = new CloudflareTunnelManager();

    try {
        switch (command) {
            case 'setup':
                await manager.setupTunnel();
                break;

            case 'start':
                const tunnelId = await manager.getExistingTunnel();
                await manager.startTunnel(tunnelId);
                break;

            case 'stop':
                await manager.stopTunnel();
                break;

            case 'status':
                const status = await manager.getTunnelStatus();
                console.log('Tunnel Status:', status);
                break;

            case 'cleanup':
                await manager.cleanup();
                break;

            case 'info':
                const info = manager.getTunnelInfo();
                console.log('Tunnel Info:', info);
                break;

            default:
                console.log('Usage: node setup_cloudflare_tunnel.js [setup|start|stop|status|cleanup|info]');
                process.exit(1);
        }
    } catch (error) {
        console.error('Command failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = CloudflareTunnelManager;