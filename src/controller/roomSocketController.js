import socketManager from "../utils/socketManager.js";

export default function roomSocketHandler(io, socket) {
    socket.on('joinRoom', async function joinRoom(data, callback) {
        console.log('\n========== JOIN ROOM REQUEST ==========');
        console.log('[JoinRoom] Socket ID:', socket.id);
        console.log('[JoinRoom] User:', socket.user?.email);
        console.log('[JoinRoom] Request data:', JSON.stringify(data, null, 2));
        console.log('[JoinRoom] Data type:', typeof data);
        
        // Validate data
        if (!data || typeof data !== 'object') {
            console.error('[JoinRoom] ❌ Invalid data format. Expected object, got:', typeof data);
            const errorResponse = {
                success: false,
                message: 'Invalid data format. Expected JSON object with roomId'
            };
            callback?.(errorResponse);
            console.log('[JoinRoom] ❌ Error response sent:', JSON.stringify(errorResponse, null, 2));
            return;
        }
        
        if (!data.roomId) {
            console.error('[JoinRoom] ❌ Missing roomId in request');
            const errorResponse = {
                success: false,
                message: 'roomId is required'
            };
            callback?.(errorResponse);
            console.log('[JoinRoom] ❌ Error response sent:', JSON.stringify(errorResponse, null, 2));
            return;
        }
        
        const roomId = data.roomId.toString();
        const userId = socket.user.id.toString();
        
        console.log('[JoinRoom] Room ID:', roomId);
        console.log('[JoinRoom] User ID:', userId);

        // Check if user is already in this room
        const isAlreadyInRoom = socketManager.isUserInRoom(userId, roomId);
        console.log('[JoinRoom] Already in room?', isAlreadyInRoom);
        
        if (isAlreadyInRoom) {
            console.log(`[JoinRoom] ⏭️  User ${socket.user.email} already in room ${roomId}, skipping join`);
            
            const usersInRoom = socketManager.getUsersInRoom(roomId);
            callback?.({
                success: true,
                message: 'Already in the room',
                data: {
                    roomId,
                    connectedUsers: usersInRoom.length,
                    alreadyJoined: true
                }
            });
            return;
        }

        // Join socket.io room
        console.log('[JoinRoom] Joining Socket.IO room...');
        if (!socket.rooms.has(roomId)) {
            socket.join(roomId);
            console.log('[JoinRoom] ✅ Joined Socket.IO room');
        } else {
            console.log('[JoinRoom] ℹ️  Already in Socket.IO room');
        }

        // Register in SocketManager for stateful tracking
        console.log('[JoinRoom] Registering in SocketManager...');
        socketManager.joinRoom(userId, roomId);
        console.log('[JoinRoom] ✅ Registered in SocketManager');

        console.log(`[JoinRoom] ✅ User ${socket.user.email} (${userId}) joined room ${roomId}`);
        
        // Log current room state
        const usersInRoom = socketManager.getUsersInRoom(roomId);
        console.log(`[JoinRoom] 📊 Room ${roomId} now has ${usersInRoom.length} connected users`);
        console.log('[JoinRoom] Users in room:', usersInRoom.map(u => u.user.email));

        const response = {
            success: true,
            message: 'Successfully joined the room',
            data: {
                roomId,
                connectedUsers: usersInRoom.length,
                alreadyJoined: false
            }
        };
        
        callback?.(response);
        console.log('[JoinRoom] ✅ Response sent:', JSON.stringify(response, null, 2));
        console.log('========== JOIN ROOM COMPLETE ==========\n');
    });

    socket.on('leaveRoom', async function leaveRoom(data, callback) {
        console.log('\n========== LEAVE ROOM REQUEST ==========');
        console.log('[LeaveRoom] Socket ID:', socket.id);
        console.log('[LeaveRoom] User:', socket.user?.email);
        console.log('[LeaveRoom] Request data:', JSON.stringify(data, null, 2));
        
        const roomId = data.roomId.toString();
        const userId = socket.user.id.toString();

        // Leave socket.io room
        socket.leave(roomId);
        console.log('[LeaveRoom] ✅ Left Socket.IO room');

        // Remove from SocketManager
        socketManager.leaveRoom(userId, roomId);
        console.log('[LeaveRoom] ✅ Removed from SocketManager');

        console.log(`[LeaveRoom] ✅ User ${socket.user.email} (${userId}) left room ${roomId}`);

        const response = {
            success: true,
            message: 'Successfully left the room',
            data: { roomId }
        };
        
        callback?.(response);
        console.log('[LeaveRoom] ✅ Response sent:', JSON.stringify(response, null, 2));
        console.log('========== LEAVE ROOM COMPLETE ==========\n');
    });
}