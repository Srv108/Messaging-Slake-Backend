import { IMAGE_KEY } from "../config/serverConfig.js";
import roomRepository from "../repository/roomRepository.js";
import { createMessageService } from "../service/message2Service.js";
import { sendOfflineNotification, shouldNotifyUser } from "../service/notificationService.js";
import socketManager from "../utils/socketManager.js";

export default function messageHandler(io, socket) {
    socket.on('roomMessage', async function createMessageHandler(data, callback) {
        const startTime = Date.now();
        
        console.log('\n========== NEW ROOM MESSAGE ==========');
        console.log('[RoomMessage] Received from socket:', socket.id);
        console.log('[RoomMessage] Sender:', socket.user?.email, '(', socket.user?.username, ')');
        console.log('[RoomMessage] Raw data:', JSON.stringify(data, null, 2));
        
        const { filename, timeStamp, ...messageData } = data;

        if (filename && filename.trim() && timeStamp) {
            const safeFileName = filename.replace(/\s+/g, "_");
            messageData.imageKey = `${safeFileName}-${timeStamp}-${IMAGE_KEY}`;
            console.log('[RoomMessage] Image key generated:', messageData.imageKey);
        }

        const roomId = data.roomId.toString();
        const senderId = data.senderId.toString();
        
        console.log('[RoomMessage] Room ID:', roomId);
        console.log('[RoomMessage] Sender ID:', senderId);

        // STEP 1: Get room details to identify all participants
        console.log('[RoomMessage] Fetching room details...');
        let roomDetails;
        try {
            roomDetails = await roomRepository.getRoomDetails(roomId);
            if (!roomDetails) {
                console.error('[RoomMessage] ❌ Room not found:', roomId);
                if (callback) {
                    callback({
                        success: false,
                        message: 'Room not found'
                    });
                }
                return;
            }
            console.log('[RoomMessage] ✅ Room details fetched');
            console.log('[RoomMessage] Participants:', {
                sender: roomDetails.senderId.email,
                receiver: roomDetails.recieverId.email
            });
        } catch (error) {
            console.error('[RoomMessage] ❌ Error fetching room details:', error);
            if (callback) {
                callback({
                    success: false,
                    message: 'Error fetching room details'
                });
            }
            return;
        }

        // Identify all room participants (sender and receiver)
        const participants = [
            {
                _id: roomDetails.senderId._id.toString(),
                username: roomDetails.senderId.username,
                email: roomDetails.senderId.email
            },
            {
                _id: roomDetails.recieverId._id.toString(),
                username: roomDetails.recieverId.username,
                email: roomDetails.recieverId.email
            }
        ];

        // Create optimistic message object for instant delivery
        const senderInfo = {
            _id: senderId,
            username: socket.user.username || socket.user._doc?.username,
            email: socket.user.email || socket.user._doc?.email,
            avatar: socket.user.avatar || socket.user._doc?.avatar
        };
        
        const optimisticMessage = {
            _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            body: messageData.body,
            image: messageData.image || null,
            imageKey: messageData.imageKey || null,
            status: 'unread',
            roomId: roomId,
            senderId: senderInfo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOptimistic: true
        };
        
        console.log('[RoomMessage] 📨 Optimistic message created:');
        console.log('[RoomMessage] Message ID (temp):', optimisticMessage._id);
        console.log('[RoomMessage] Message body:', optimisticMessage.body);
        console.log('[RoomMessage] Has image:', !!optimisticMessage.image);
        console.log('[RoomMessage] Sender:', senderInfo.username, '(', senderInfo.email, ')');
        console.log('[RoomMessage] Full message object:', JSON.stringify(optimisticMessage, null, 2));

        // STEP 2: Send to ALL participants regardless of room join status
        console.log('[RoomMessage] Checking participant connection status...');
        const onlineUsers = [];
        const offlineUsers = [];

        participants.forEach(participant => {
            const participantId = participant._id.toString();
            
            console.log(`[RoomMessage] 🔍 Processing participant:`, participant.email);
            console.log(`[RoomMessage] Participant ID:`, participantId);
            console.log(`[RoomMessage] Sender ID:`, senderId);
            
            // Skip sender
            if (participantId === senderId) {
                console.log(`[RoomMessage] ⏭️  Skipping sender: ${participant.email}`);
                return;
            }

            // Check if user is connected to socket (not just in room)
            console.log(`[RoomMessage] 🔍 Checking if user is connected in SocketManager...`);
            const isConnected = socketManager.isUserConnected(participantId);
            console.log(`[RoomMessage] Checking ${participant.email}: ${isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
            console.log(`[RoomMessage] SocketManager has user ${participantId}?`, isConnected);
            
            if (isConnected) {
                // User is online - get their socket ID
                const socketId = socketManager.getSocketId(participantId);
                console.log(`[RoomMessage] Socket ID for ${participant.email}:`, socketId);
                
                if (socketId) {
                    // Send message directly to their socket
                    console.log(`[RoomMessage] 📤 Emitting to socket ${socketId}...`);
                    console.log(`[RoomMessage] Event: 'roomMessageRecieved'`);
                    console.log(`[RoomMessage] Message being sent:`, JSON.stringify({
                        _id: optimisticMessage._id,
                        body: optimisticMessage.body,
                        sender: optimisticMessage.senderId.username,
                        roomId: optimisticMessage.roomId
                    }, null, 2));
                    
                    io.to(socketId).emit('roomMessageRecieved', optimisticMessage);
                    onlineUsers.push(participant);
                    console.log(`[RoomMessage] ✅ Sent to online user: ${participant.email}`);
                } else {
                    console.log(`[RoomMessage] ⚠️  No socket ID found for ${participant.email}`);
                }
            } else {
                // User is offline - queue for notification
                offlineUsers.push(participant);
                console.log(`[RoomMessage] 📧 User offline, will notify: ${participant.email}`);
            }
        });

        // Also emit to sender for confirmation
        console.log(`[RoomMessage] 📤 Sending confirmation to sender (${socket.id})...`);
        console.log(`[RoomMessage] Event: 'roomMessageSent'`);
        console.log(`[RoomMessage] Confirmation message:`, JSON.stringify({
            _id: optimisticMessage._id,
            body: optimisticMessage.body,
            isOptimistic: optimisticMessage.isOptimistic
        }, null, 2));
        
        socket.emit('roomMessageSent', optimisticMessage);
        console.log(`[RoomMessage] ✅ Sender confirmation sent`);

        const emitTime = Date.now() - startTime;
        console.log(`[RoomMessage] ⚡ Message emitted in ${emitTime}ms`);
        console.log(`[RoomMessage] 📊 Delivery summary: ${onlineUsers.length} online, ${offlineUsers.length} offline`);

        // STEP 3: Save to database asynchronously
        console.log('[RoomMessage] 💾 Saving to database...');
        createMessageService(messageData)
            .then(async messageResponse => {
                const dbTime = Date.now() - startTime;
                console.log(`[RoomMessage] ✅ Message saved to DB in ${dbTime}ms`);
                console.log(`[RoomMessage] DB Message ID:`, messageResponse._id);
                console.log(`[RoomMessage] DB Message details:`, JSON.stringify({
                    _id: messageResponse._id,
                    body: messageResponse.body,
                    senderId: messageResponse.senderId?._id || messageResponse.senderId,
                    roomId: messageResponse.roomId?._id || messageResponse.roomId,
                    createdAt: messageResponse.createdAt
                }, null, 2));

                // Emit DB confirmation with real ID to online users
                const confirmationMessage = {
                    ...messageResponse,
                    tempId: optimisticMessage._id,
                    isConfirmed: true
                };
                
                console.log(`[RoomMessage] 📨 Confirmation message prepared:`);
                console.log(`[RoomMessage] Real ID:`, confirmationMessage._id);
                console.log(`[RoomMessage] Temp ID:`, confirmationMessage.tempId);
                console.log(`[RoomMessage] Body:`, confirmationMessage.body);

                console.log(`[RoomMessage] 📤 Sending confirmations to ${onlineUsers.length} online users...`);
                onlineUsers.forEach(user => {
                    const socketId = socketManager.getSocketId(user._id);
                    if (socketId) {
                        console.log(`[RoomMessage] 📤 Confirming to ${user.email} (${socketId})`);
                        console.log(`[RoomMessage] Event: 'roomMessageConfirmed'`);
                        io.to(socketId).emit('roomMessageConfirmed', confirmationMessage);
                        console.log(`[RoomMessage] ✅ Confirmation sent to ${user.email}`);
                    }
                });

                // Also confirm to sender
                console.log(`[RoomMessage] 📤 Confirming to sender (${socket.id})`);
                console.log(`[RoomMessage] Event: 'roomMessageConfirmed'`);
                socket.emit('roomMessageConfirmed', confirmationMessage);
                console.log(`[RoomMessage] ✅ Sender confirmation sent`);

                // STEP 4: Send notifications to offline users
                if (offlineUsers.length > 0) {
                    console.log(`[RoomMessage] 📧 Sending notifications to ${offlineUsers.length} offline users`);
                    
                    const sender = {
                        _id: senderId,
                        username: socket.user.username || socket.user._doc?.username,
                        email: socket.user.email || socket.user._doc?.email
                    };

                    // Send notifications asynchronously (don't wait)
                    offlineUsers.forEach(async offlineUser => {
                        console.log(`[RoomMessage] Checking notification for ${offlineUser.email}...`);
                        if (shouldNotifyUser(offlineUser._id, senderId)) {
                            try {
                                console.log(`[RoomMessage] 📨 Sending notification to ${offlineUser.email}...`);
                                await sendOfflineNotification(
                                    offlineUser,
                                    sender,
                                    {
                                        body: messageData.body,
                                        image: messageData.image,
                                        createdAt: messageResponse.createdAt
                                    },
                                    'room'
                                );
                                console.log(`[RoomMessage] ✅ Notification sent to ${offlineUser.email}`);
                            } catch (notifError) {
                                console.error(`[RoomMessage] ❌ Notification failed for ${offlineUser.email}:`, notifError);
                            }
                        } else {
                            console.log(`[RoomMessage] ⏭️  Skipping notification for ${offlineUser.email} (user preference)`);
                        }
                    });
                } else {
                    console.log(`[RoomMessage] ℹ️  No offline users to notify`);
                }

                // Update callback with real data
                console.log('[RoomMessage] 📞 Sending callback response...');
                if (callback) {
                    const response = {
                        success: true,
                        message: 'Successfully created message in the room',
                        data: messageResponse,
                        timing: {
                            emitTime,
                            dbTime
                        },
                        delivery: {
                            onlineUsers: onlineUsers.length,
                            offlineUsers: offlineUsers.length,
                            notificationsSent: offlineUsers.length
                        }
                    };
                    callback(response);
                    console.log('[RoomMessage] ✅ Callback sent:', JSON.stringify(response, null, 2));
                }
                console.log('========== MESSAGE COMPLETE ==========\n');
            })
            .catch(error => {
                console.error('[RoomMessage] ❌ Error saving to DB:', error);
                console.error('[RoomMessage] Error stack:', error.stack);

                // Notify online users about failure
                onlineUsers.forEach(user => {
                    const socketId = socketManager.getSocketId(user._id);
                    if (socketId) {
                        io.to(socketId).emit('roomMessageFailed', {
                            tempId: optimisticMessage._id,
                            error: 'Failed to save message'
                        });
                    }
                });

                // Notify sender
                socket.emit('roomMessageFailed', {
                    tempId: optimisticMessage._id,
                    error: 'Failed to save message'
                });

                if (callback) {
                    const errorResponse = {
                        success: false,
                        message: 'Failed to save message',
                        error: error.message
                    };
                    callback(errorResponse);
                    console.log('[RoomMessage] ❌ Error callback sent:', JSON.stringify(errorResponse, null, 2));
                }
                console.log('========== MESSAGE FAILED ==========\n');
            });

        // Return immediately with optimistic response
        if (!callback) {
            console.log('[RoomMessage] ⚠️  No callback provided');
            return;
        }
    });
}