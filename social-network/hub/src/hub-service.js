/**
 * @title Hub Service
 * @notice Core hub service for message relay and validation
 */
export class HubService {
    node;
    db;
    validator;
    syncEngine;
    config;
    messageCache = new Map();
    constructor(node, db, validator, syncEngine, config) {
        this.node = node;
        this.db = db;
        this.validator = validator;
        this.syncEngine = syncEngine;
        this.config = config;
    }
    async start() {
        // Start libp2p node
        await this.node.start();
        // Connect to peer hubs
        await this.connectToPeers();
        // Start sync engine
        await this.syncEngine.start();
        // Setup message handlers
        this.setupMessageHandlers();
        console.log('Hub service started');
    }
    async stop() {
        await this.syncEngine.stop();
        await this.node.stop();
        console.log('Hub service stopped');
    }
    async connectToPeers() {
        for (const peerAddress of this.config.peers) {
            try {
                const multiaddr = peerAddress;
                await this.node.dial(multiaddr);
                console.log(`Connected to peer: ${peerAddress}`);
            }
            catch (error) {
                console.error(`Failed to connect to peer ${peerAddress}:`, error);
            }
        }
    }
    setupMessageHandlers() {
        // Handle incoming messages from peers
        this.node.addEventListener('peer:message', async (event) => {
            const message = event.detail;
            await this.handleIncomingMessage(message);
        });
    }
    async submitMessage(message) {
        // Validate message
        const validation = await this.validator.validate(message);
        if (!validation.valid) {
            throw new Error(`Invalid message: ${validation.error}`);
        }
        // Store message
        await this.db.storeMessage(message);
        // Cache message
        this.messageCache.set(message.hash, message);
        // Propagate to peers
        await this.propagateMessage(message);
        return {
            hash: message.hash,
            status: 'accepted',
            timestamp: Date.now()
        };
    }
    async getMessage(hash) {
        // Check cache first
        if (this.messageCache.has(hash)) {
            return this.messageCache.get(hash);
        }
        // Query database
        const message = await this.db.getMessage(hash);
        if (message) {
            this.messageCache.set(hash, message);
        }
        return message;
    }
    async getMessagesByFid(fid, limit, offset) {
        return await this.db.getMessagesByFid(fid, limit, offset);
    }
    async handleIncomingMessage(message) {
        // Check if we already have this message
        const existing = await this.getMessage(message.hash);
        if (existing) {
            return; // Already have it
        }
        // Validate message
        const validation = await this.validator.validate(message);
        if (!validation.valid) {
            console.warn(`Invalid message received: ${validation.error}`);
            return;
        }
        // Store message
        await this.db.storeMessage(message);
        this.messageCache.set(message.hash, message);
        // Propagate to other peers (gossip)
        await this.propagateMessage(message);
    }
    async propagateMessage(message) {
        // Get connected peers
        const peers = this.node.getPeers();
        // Send message to all peers
        for (const peerId of peers) {
            try {
                const stream = await this.node.dialProtocol(peerId, '/daemon/message/1.0.0');
                // Send message over stream
                // Implementation depends on libp2p stream API
            }
            catch (error) {
                console.error(`Failed to propagate message to peer ${peerId}:`, error);
            }
        }
    }
    async getSyncStatus() {
        const status = await this.syncEngine.getStatus();
        const messageCount = await this.db.getMessageCount();
        return {
            lastSyncTimestamp: status.lastSyncTimestamp,
            peerCount: this.node.getPeers().length,
            messageCount
        };
    }
    getPeers() {
        return this.node.getPeers().map((peerId) => peerId.toString());
    }
    getNodeId() {
        return this.node.peerId.toString();
    }
}
//# sourceMappingURL=hub-service.js.map