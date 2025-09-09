// backend/services/blockchain_service.js
const crypto = require('crypto');

class Block {
    constructor(timestamp, data, previousHash = '') {
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }
    calculateHash() {
        return crypto.createHash('sha256').update(this.previousHash + this.timestamp + JSON.stringify(this.data)).digest('hex');
    }
}

class Blockchain {
    constructor() {
        // This is a real, in-memory blockchain that exists for the life of the server process.
        this.chain = [this.createGenesisBlock()];
        this.maxChainLength = parseInt(process.env.MAX_BLOCKCHAIN_SIZE) || 10000;
        this.pruneThreshold = Math.floor(this.maxChainLength * 0.8);
    }
    createGenesisBlock() {
        return new Block(new Date().toISOString(), "Genesis Block - BioMapper Scientific Ledger", "0");
    }
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);
        
        // Prune old blocks to prevent memory leaks
        if (this.chain.length > this.maxChainLength) {
            this.pruneOldBlocks();
        }
        
        return newBlock;
    }
    
    pruneOldBlocks() {
        // Keep the genesis block and recent blocks
        const blocksToKeep = this.pruneThreshold;
        const removedCount = this.chain.length - blocksToKeep;
        
        if (removedCount > 1) { // Always keep genesis block
            this.chain = [this.chain[0], ...this.chain.slice(-blocksToKeep + 1)];
            console.log(`🔄 Blockchain pruned: removed ${removedCount} old blocks, keeping ${this.chain.length} blocks`);
        }
    }
    
    getChainStats() {
        return {
            totalBlocks: this.chain.length,
            maxSize: this.maxChainLength,
            memoryUsage: JSON.stringify(this.chain).length,
            oldestBlock: this.chain[1]?.timestamp || 'N/A',
            latestBlock: this.getLatestBlock().timestamp
        };
    }
}

const bioMapperLedger = new Blockchain();

const recordFinding = (data) => {
    const newBlock = bioMapperLedger.addBlock(new Block(new Date().toISOString(), data));
    console.log("\n--- ✅ New Block Added to In-Memory Blockchain ---");
    console.log(JSON.stringify(newBlock, null, 2));
    console.log("--------------------------------------------------\n");
    return newBlock;
};

// Get blockchain audit trail for a specific session
const getSessionAuditTrail = (sessionId) => {
    return bioMapperLedger.chain.filter(block => 
        block.data && 
        block.data.sessionId === sessionId
    );
};

// Get blockchain audit trail for a specific annotation
const getAnnotationAuditTrail = (annotationId) => {
    return bioMapperLedger.chain.filter(block => 
        block.data && 
        block.data.annotationId === annotationId
    );
};

// Get all collaborative actions by a scientist
const getScientistCollaborationHistory = (scientistId) => {
    return bioMapperLedger.chain.filter(block => 
        block.data && 
        block.data.scientistId === scientistId && 
        ['session_created', 'session_joined', 'annotation_created', 'vote_submitted'].includes(block.data.action)
    );
};

// Blockchain health monitoring
const getBlockchainHealth = () => {
    const stats = bioMapperLedger.getChainStats();
    const memoryUsageMB = (stats.memoryUsage / 1024 / 1024).toFixed(2);
    
    return {
        ...stats,
        memoryUsageMB: `${memoryUsageMB} MB`,
        health: stats.totalBlocks < stats.maxSize * 0.9 ? 'healthy' : 'approaching_limit',
        lastPruned: stats.totalBlocks >= stats.maxSize ? 'recently' : 'not_needed'
    };
};

module.exports = { 
    recordFinding, 
    bioMapperLedger,
    getSessionAuditTrail,
    getAnnotationAuditTrail,
    getScientistCollaborationHistory,
    getBlockchainHealth
};