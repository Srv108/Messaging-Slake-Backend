import { JOIN_CHANNEL, LEAVE_CHANNEL } from "../utils/common/eventConstants.js";
import socketManager from "../utils/socketManager.js";

export default function channelSocketHandler(io, socket) {
    socket.on(JOIN_CHANNEL, async function joinChannel(data, cb) {
        console.log('\n========== JOIN CHANNEL REQUEST ==========');
        console.log('[JoinChannel] Socket ID:', socket.id);
        console.log('[JoinChannel] User:', socket.user?.email);
        console.log('[JoinChannel] Request data:', JSON.stringify(data, null, 2));
        
        // Validate data
        if (!data || typeof data !== 'object') {
            console.error('[JoinChannel] ❌ Invalid data format. Expected object, got:', typeof data);
            const errorResponse = {
                success: false,
                message: 'Invalid data format. Expected JSON object with channelId'
            };
            cb?.(errorResponse);
            console.log('[JoinChannel] ❌ Error response sent:', JSON.stringify(errorResponse, null, 2));
            return;
        }
        
        if (!data.channelId) {
            console.error('[JoinChannel] ❌ Missing channelId in request');
            const errorResponse = {
                success: false,
                message: 'channelId is required'
            };
            cb?.(errorResponse);
            console.log('[JoinChannel] ❌ Error response sent:', JSON.stringify(errorResponse, null, 2));
            return;
        }
        
        const channelId = data.channelId.toString();
        const userId = socket.user.id.toString();
        
        console.log('[JoinChannel] Channel ID:', channelId);
        console.log('[JoinChannel] User ID:', userId);

        // Check if user is already in this channel
        const isAlreadyInChannel = socketManager.isUserInRoom(userId, channelId);
        console.log('[JoinChannel] Already in channel?', isAlreadyInChannel);
        
        if (isAlreadyInChannel) {
            console.log(`[JoinChannel] ⏭️  User ${socket.user.email} already in channel ${channelId}, skipping join`);
            
            const usersInChannel = socketManager.getUsersInRoom(channelId);
            cb?.({
                success: true,
                message: 'Already in the channel',
                data: {
                    channelId,
                    connectedUsers: usersInChannel.length,
                    alreadyJoined: true
                }
            });
            return;
        }

        // Join socket.io room
        console.log('[JoinChannel] Joining Socket.IO channel...');
        if (!socket.rooms.has(channelId)) {
            socket.join(channelId);
            console.log('[JoinChannel] ✅ Joined Socket.IO channel');
        } else {
            console.log('[JoinChannel] ℹ️  Already in Socket.IO channel');
        }

        // Register in SocketManager for stateful tracking
        console.log('[JoinChannel] Registering in SocketManager...');
        socketManager.joinRoom(userId, channelId);
        console.log('[JoinChannel] ✅ Registered in SocketManager');

        console.log(`[JoinChannel] ✅ User ${socket.user.email} (${userId}) joined channel ${channelId}`);
        
        // Log current channel state
        const usersInChannel = socketManager.getUsersInRoom(channelId);
        console.log(`[JoinChannel] 📊 Channel ${channelId} now has ${usersInChannel.length} connected users`);
        console.log('[JoinChannel] Users in channel:', usersInChannel.map(u => u.user.email));

        const response = {
            success: true,
            message: 'Successfully joined the channel',
            data: {
                channelId,
                connectedUsers: usersInChannel.length,
                alreadyJoined: false
            }
        };
        
        cb?.(response);
        console.log('[JoinChannel] ✅ Response sent:', JSON.stringify(response, null, 2));
        console.log('========== JOIN CHANNEL COMPLETE ==========\n');
    });

    socket.on(LEAVE_CHANNEL, async function leaveChannel(data, cb) {
        console.log('\n========== LEAVE CHANNEL REQUEST ==========');
        console.log('[LeaveChannel] Socket ID:', socket.id);
        console.log('[LeaveChannel] User:', socket.user?.email);
        console.log('[LeaveChannel] Request data:', JSON.stringify(data, null, 2));
        
        // Validate data
        if (!data || !data.channelId) {
            console.error('[LeaveChannel] ❌ Missing channelId in request');
            const errorResponse = {
                success: false,
                message: 'channelId is required'
            };
            cb?.(errorResponse);
            console.log('[LeaveChannel] ❌ Error response sent:', JSON.stringify(errorResponse, null, 2));
            return;
        }
        
        const channelId = data.channelId.toString();
        const userId = socket.user.id.toString();

        // Leave socket.io room
        socket.leave(channelId);
        console.log('[LeaveChannel] ✅ Left Socket.IO channel');

        // Remove from SocketManager
        socketManager.leaveRoom(userId, channelId);
        console.log('[LeaveChannel] ✅ Removed from SocketManager');

        console.log(`[LeaveChannel] ✅ User ${socket.user.email} (${userId}) left channel ${channelId}`);

        const response = {
            success: true,
            message: 'Successfully left the channel',
            data: { channelId }
        };
        
        cb?.(response);
        console.log('[LeaveChannel] ✅ Response sent:', JSON.stringify(response, null, 2));
        console.log('========== LEAVE CHANNEL COMPLETE ==========\n');
    });
}

