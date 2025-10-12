/**
 * Stateful Socket Manager
 * Maintains real-time state of all connected users, their sockets, and room memberships
 * This enables fast message delivery without DB lookups
 */
class SocketManager {
    constructor() {
        // Map: userId -> { socketId, user, rooms: Set<roomId> }
        this.users = new Map();
        
        // Map: socketId -> userId
        this.socketToUser = new Map();
        
        // Map: roomId -> Set<userId>
        this.rooms = new Map();
    }

    /**
     * Check if user is already connected
     * @param {string} userId - User ID
     * @returns {boolean}
     */
    isUserConnected(userId) {
        userId = userId.toString();
        return this.users.has(userId);
    }

    /**
     * Get existing connection for user
     * @param {string} userId - User ID
     * @returns {object|null} User data or null
     */
    getExistingConnection(userId) {
        userId = userId.toString();
        return this.users.get(userId) || null;
    }

    /**
     * Add a user connection
     * @param {string} socketId - Socket.IO socket ID
     * @param {object} user - User object with id, username, email
     * @param {object} io - Socket.IO server instance for emitting events
     * @returns {object} Connection info { isReconnection, previousSocketId, rooms }
     */
    addUser(socketId, user, io = null) {
        const userId = user.id.toString();
        let isReconnection = false;
        let previousSocketId = null;
        let existingRooms = new Set();
        
        // If user already connected from another device/tab, handle reconnection
        if (this.users.has(userId)) {
            const existingData = this.users.get(userId);
            isReconnection = true;
            previousSocketId = existingData.socketId;
            existingRooms = existingData.rooms;
            
            // Remove old socket mapping
            this.socketToUser.delete(existingData.socketId);
            
            console.log(`[SocketManager] User reconnecting: ${user.email} (${userId})`);
            console.log(`[SocketManager] Old socket: ${previousSocketId}, New socket: ${socketId}`);
            console.log(`[SocketManager] Preserving ${existingRooms.size} room memberships`);
            
            // Update with new socket but keep existing rooms
            this.users.set(userId, {
                socketId,
                user,
                rooms: existingRooms
            });

            // Emit notifications to both sockets about the new login
            if (io) {
                // Notify the previous socket that someone logged in from another device
                io.to(previousSocketId).emit('accountLoggedInElsewhere', {
                    message: 'Someone logged into your account from another device',
                    newSocketId: socketId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                console.log(`[SocketManager] ✉️  Notified previous socket ${previousSocketId} about new login`);
                
                // Notify the current socket that this account is also logged in elsewhere
                io.to(socketId).emit('accountAlreadyLoggedIn', {
                    message: 'This account is already logged in from another device',
                    previousSocketId,
                    userId,
                    timestamp: new Date().toISOString()
                });
                console.log(`[SocketManager] ✉️  Notified current socket ${socketId} about existing login`);
            }
        } else {
            // New connection
            this.users.set(userId, {
                socketId,
                user,
                rooms: new Set()
            });
            
            console.log(`[SocketManager] New user connected: ${user.email} (${userId}) with socket ${socketId}`);
        }
        
        this.socketToUser.set(socketId, userId);
        
        /* you have to return socket id also  */
        return {
            socketId,
            isReconnection,
            previousSocketId,
            rooms: Array.from(existingRooms)
        };
    }

    /**
     * Remove a user connection
     * @param {string} socketId - Socket.IO socket ID
     */
    removeUser(socketId) {
        const userId = this.socketToUser.get(socketId);
        
        if (!userId) {
            console.log(`[SocketManager] Socket ${socketId} not found`);
            return;
        }

        const userData = this.users.get(userId);
        
        if (userData) {
            // Remove user from all rooms
            userData.rooms.forEach(roomId => {
                const roomUsers = this.rooms.get(roomId);
                if (roomUsers) {
                    roomUsers.delete(userId);
                    if (roomUsers.size === 0) {
                        this.rooms.delete(roomId);
                    }
                }
            });
            
            console.log(`[SocketManager] User removed: ${userData.user.email} (${userId})`);
            this.users.delete(userId);
        }
        
        this.socketToUser.delete(socketId);
    }

    /**
     * Add user to a room
     * @param {string} userId - User ID
     * @param {string} roomId - Room/Channel ID
     */
    joinRoom(userId, roomId) {
        userId = userId.toString();
        roomId = roomId.toString();
        
        const userData = this.users.get(userId);
        if (!userData) {
            console.log(`[SocketManager] User ${userId} not found for joining room ${roomId}`);
            return;
        }
        
        /* first check user is already joined the room or not */
        if (userData.rooms.has(roomId)) {
            console.log(`[SocketManager] User ${userData.user.email} already in room ${roomId}, skipping join`);
            return;
        }

        // Add room to user's room set
        userData.rooms.add(roomId);

        // Add user to room's user set
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(userId);

        console.log(`[SocketManager] User ${userData.user.email} joined room ${roomId}`);
    }

    /**
     * Remove user from a room
     * @param {string} userId - User ID
     * @param {string} roomId - Room/Channel ID
     */
    leaveRoom(userId, roomId) {
        userId = userId.toString();
        roomId = roomId.toString();
        
        const userData = this.users.get(userId);
        if (userData) {
            userData.rooms.delete(roomId);
        }

        const roomUsers = this.rooms.get(roomId);
        if (roomUsers) {
            roomUsers.delete(userId);
            if (roomUsers.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        console.log(`[SocketManager] User ${userId} left room ${roomId}`);
    }

    /**
     * Get all users in a room
     * @param {string} roomId - Room/Channel ID
     * @returns {Array} Array of user objects with socketId
     */
    getUsersInRoom(roomId) {
        roomId = roomId.toString();
        const userIds = this.rooms.get(roomId);
        
        if (!userIds || userIds.size === 0) {
            return [];
        }

        const users = [];
        userIds.forEach(userId => {
            const userData = this.users.get(userId);
            if (userData) {
                users.push({
                    userId,
                    socketId: userData.socketId,
                    user: userData.user
                });
            }
        });

        return users;
    }

    /**
     * Get socket ID for a user
     * @param {string} userId - User ID
     * @returns {string|null} Socket ID or null if not connected
     */
    getSocketId(userId) {
        userId = userId.toString();
        const userData = this.users.get(userId);
        return userData ? userData.socketId : null;
    }

    /**
     * Get user data by socket ID
     * @param {string} socketId - Socket ID
     * @returns {object|null} User data or null
     */
    getUserBySocketId(socketId) {
        const userId = this.socketToUser.get(socketId);
        return userId ? this.users.get(userId) : null;
    }

    /**
     * Check if user is in a room
     * @param {string} userId - User ID
     * @param {string} roomId - Room/Channel ID
     * @returns {boolean}
     */
    isUserInRoom(userId, roomId) {
        userId = userId.toString();
        roomId = roomId.toString();
        
        const userData = this.users.get(userId);
        return userData ? userData.rooms.has(roomId) : false;
    }

    /**
     * Get all rooms a user is in
     * @param {string} userId - User ID
     * @returns {Array<string>} Array of room IDs
     */
    getUserRooms(userId) {
        userId = userId.toString();
        const userData = this.users.get(userId);
        return userData ? Array.from(userData.rooms) : [];
    }

    /**
     * Get statistics
     * @returns {object} Stats object
     */
    getStats() {
        return {
            totalUsers: this.users.size,
            totalRooms: this.rooms.size,
            totalSockets: this.socketToUser.size
        };
    }

    /**
     * Debug: Print current state
     */
    printState() {
        console.log('\n=== SocketManager State ===');
        console.log('Users:', this.users.size);
        this.users.forEach((data, userId) => {
            console.log(`  ${userId}: ${data.user.email} [${data.socketId}] - Rooms: ${Array.from(data.rooms).join(', ')}`);
        });
        console.log('Rooms:', this.rooms.size);
        this.rooms.forEach((users, roomId) => {
            console.log(`  ${roomId}: ${users.size} users - ${Array.from(users).join(', ')}`);
        });
        console.log('===========================\n');
    }
}

// Export singleton instance
const socketManager = new SocketManager();
export default socketManager;
