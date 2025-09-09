const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
// const { verifyToken } = require('../middleware/auth'); // Disabled for demo

// Enhanced Blockchain Service with Persistence & Merkle Proofs
class EnhancedBlockchainService {
    constructor() {
        this.chain = [];
        this.ledgerPath = path.join(__dirname, '../reports/ledger.jsonl');
        this.memoryIndex = new Map();
        this.initializeLedger();
    }

    async initializeLedger() {
        try {
            await fs.mkdir(path.dirname(this.ledgerPath), { recursive: true });
            const exists = await fs.access(this.ledgerPath).then(() => true).catch(() => false);
            if (exists) {
                await this.loadFromLedger();
            } else {
                await this.createGenesisBlock();
            }
        } catch (error) {
            console.error('Blockchain initialization error:', error);
            await this.createGenesisBlock();
        }
    }

    async loadFromLedger() {
        try {
            const data = await fs.readFile(this.ledgerPath, 'utf8');
            const lines = data.trim().split('\n').filter(line => line);
            
            for (const line of lines) {
                const block = JSON.parse(line);
                this.chain.push(block);
                this.memoryIndex.set(block.hash, this.chain.length - 1);
            }
            
            console.log(`Loaded ${this.chain.length} blocks from ledger`);
        } catch (error) {
            console.error('Error loading ledger:', error);
            await this.createGenesisBlock();
        }
    }

    async createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: Date.now(),
            data: {
                type: 'genesis',
                message: 'BioMapper Genesis Block',
                version: '2.0.0'
            },
            previousHash: '0',
            hash: '',
            nonce: 0,
            signature: '',
            merkleRoot: ''
        };

        genesisBlock.hash = this.calculateHash(genesisBlock);
        genesisBlock.signature = this.signBlock(genesisBlock);
        genesisBlock.merkleRoot = this.calculateMerkleRoot([genesisBlock.hash]);

        this.chain = [genesisBlock];
        this.memoryIndex.set(genesisBlock.hash, 0);
        await this.persistBlock(genesisBlock);
    }

    calculateHash(block) {
        const blockString = JSON.stringify({
            index: block.index,
            timestamp: block.timestamp,
            data: block.data,
            previousHash: block.previousHash,
            nonce: block.nonce
        });
        return crypto.createHash('sha256').update(blockString).digest('hex');
    }

    signBlock(block) {
        // Ed25519 signature simulation (in production, use actual Ed25519)
        const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || 'default_dev_key';
        return crypto.createHmac('sha256', privateKey).update(block.hash).digest('hex');
    }

    calculateMerkleRoot(hashes) {
        if (hashes.length === 0) return '';
        if (hashes.length === 1) return hashes[0];

        const newLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || hashes[i];
            const combined = crypto.createHash('sha256').update(left + right).digest('hex');
            newLevel.push(combined);
        }

        return this.calculateMerkleRoot(newLevel);
    }

    async addBlock(data) {
        const previousBlock = this.chain[this.chain.length - 1];
        const newBlock = {
            index: this.chain.length,
            timestamp: Date.now(),
            data: {
                ...data,
                chainOfCustody: {
                    uploader: data.uploader || 'system',
                    ip: data.ip || 'localhost',
                    toolchainVersion: '2.0.0',
                    evidenceHash: data.evidenceHash || this.calculateHash({ data })
                }
            },
            previousHash: previousBlock.hash,
            hash: '',
            nonce: 0,
            signature: '',
            merkleRoot: ''
        };

        newBlock.hash = this.calculateHash(newBlock);
        newBlock.signature = this.signBlock(newBlock);
        
        // Calculate Merkle root for current session blocks
        const sessionHashes = this.chain.slice(-10).map(b => b.hash).concat([newBlock.hash]);
        newBlock.merkleRoot = this.calculateMerkleRoot(sessionHashes);

        this.chain.push(newBlock);
        this.memoryIndex.set(newBlock.hash, this.chain.length - 1);
        await this.persistBlock(newBlock);

        return newBlock;
    }

    async persistBlock(block) {
        try {
            const blockLine = JSON.stringify(block) + '\n';
            await fs.appendFile(this.ledgerPath, blockLine);
        } catch (error) {
            console.error('Error persisting block:', error);
        }
    }

    getChainHealth() {
        return {
            totalBlocks: this.chain.length,
            memoryUsage: process.memoryUsage(),
            ledgerSize: this.getLedgerSize(),
            lastBlockTime: this.chain.length > 0 ? this.chain[this.chain.length - 1].timestamp : null,
            isValid: this.validateChain()
        };
    }

    async getLedgerSize() {
        try {
            const stats = await fs.stat(this.ledgerPath);
            return stats.size;
        } catch {
            return 0;
        }
    }

    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== this.calculateHash(currentBlock)) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    getAuditTrail(sessionId) {
        const sessionBlocks = this.chain.filter(block => 
            block.data.sessionId === sessionId || 
            block.data.analysisId === sessionId
        );

        return {
            sessionId,
            blocks: sessionBlocks,
            merkleProof: this.generateMerkleProof(sessionBlocks.map(b => b.hash)),
            chainOfCustody: sessionBlocks.map(block => block.data.chainOfCustody),
            verified: this.verifyMerkleProof(sessionBlocks.map(b => b.hash))
        };
    }

    generateMerkleProof(targetHashes) {
        // Simplified Merkle proof generation
        const allHashes = this.chain.map(b => b.hash);
        const proof = [];
        
        for (const targetHash of targetHashes) {
            const index = allHashes.indexOf(targetHash);
            if (index !== -1) {
                proof.push({
                    hash: targetHash,
                    index,
                    siblings: this.getMerkleSiblings(allHashes, index)
                });
            }
        }
        
        return proof;
    }

    getMerkleSiblings(hashes, index) {
        const siblings = [];
        let currentIndex = index;
        let currentLevel = [...hashes];

        while (currentLevel.length > 1) {
            const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
            if (siblingIndex < currentLevel.length) {
                siblings.push({
                    hash: currentLevel[siblingIndex],
                    position: siblingIndex > currentIndex ? 'right' : 'left'
                });
            }

            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] || currentLevel[i];
                nextLevel.push(crypto.createHash('sha256').update(left + right).digest('hex'));
            }

            currentIndex = Math.floor(currentIndex / 2);
            currentLevel = nextLevel;
        }

        return siblings;
    }

    verifyMerkleProof(hashes) {
        // Simplified verification
        return hashes.every(hash => this.memoryIndex.has(hash));
    }
}

// Initialize blockchain service
const blockchainService = new EnhancedBlockchainService();

// Routes
router.get('/status', async (req, res) => {
    try {
        const health = await blockchainService.getChainHealth();
        res.json({
            status: 'healthy',
            blockchain: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/audit/session/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const auditTrail = blockchainService.getAuditTrail(id);
        res.json(auditTrail);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/finding', async (req, res) => {
    try {
        const { caseStudyId, policyImpact, evidenceHash, analysisId } = req.body;
        
        const block = await blockchainService.addBlock({
            type: 'policy_finding',
            caseStudyId,
            policyImpact,
            evidenceHash,
            analysisId,
            sessionId: req.body.sessionId || `session_${Date.now()}`,
            uploader: req.user?.id || 'anonymous',
            ip: req.ip
        });

        res.json({
            success: true,
            blockHash: block.hash,
            blockIndex: block.index,
            timestamp: block.timestamp
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/chain', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const chain = blockchainService.chain.slice(offset, offset + parseInt(limit));
        
        res.json({
            blocks: chain,
            total: blockchainService.chain.length,
            offset: parseInt(offset),
            limit: parseInt(limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/record', async (req, res) => {
    try {
        const { type, data, sessionId } = req.body;
        
        const block = await blockchainService.addBlock({
            type,
            ...data,
            sessionId: sessionId || `session_${Date.now()}`,
            uploader: req.user?.id || 'anonymous',
            ip: req.ip
        });

        res.json({
            success: true,
            blockHash: block.hash,
            blockIndex: block.index
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
