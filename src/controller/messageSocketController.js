import { createMessage } from "../service/messageService.js";
import { NEW_MESSAGE_EVENT, NEW_MESSAGE_RECEIVED_EVENT } from "../utils/common/eventConstants.js";
import socketManager from "../utils/socketManager.js";

export default function messageHandler(io, socket) {
    socket.on(NEW_MESSAGE_EVENT, async function createMessageHandler(data, callback) {
        const startTime = Date.now();
        const channelId = data.channelId.toString();
        const senderId = data.senderId.toString();

        // Create optimistic message object for instant delivery
        const optimisticMessage = {
            _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            body: data.body,
            image: data.image || null,
            status: 'unread',
            channelId: channelId,
            workspaceId: data.workspaceId,
            senderId: {
                _id: senderId,
                ...socket.user
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOptimistic: true
        };

        // STEP 1: Emit to all connected users in the channel IMMEDIATELY
        const usersInChannel = socketManager.getUsersInRoom(channelId);
        console.log(`[ChannelMessage] Emitting to ${usersInChannel.length} users in channel ${channelId}`);

        // Emit to all users except sender
        usersInChannel.forEach(({ socketId, userId }) => {
            if (userId !== senderId) {
                io.to(socketId).emit(NEW_MESSAGE_RECEIVED_EVENT, optimisticMessage);
            }
        });

        // Also emit to sender for confirmation
        socket.emit('channelMessageSent', optimisticMessage);

        const emitTime = Date.now() - startTime;
        console.log(`[ChannelMessage] Message emitted in ${emitTime}ms`);

        // STEP 2: Save to database asynchronously
        createMessage(data)
            .then(messageResponse => {
                const dbTime = Date.now() - startTime;
                console.log(`[ChannelMessage] Message saved to DB in ${dbTime}ms`);

                // Emit DB confirmation with real ID to all users
                const confirmationMessage = {
                    ...messageResponse,
                    tempId: optimisticMessage._id,
                    isConfirmed: true
                };

                usersInChannel.forEach(({ socketId }) => {
                    io.to(socketId).emit('channelMessageConfirmed', confirmationMessage);
                });

                // Update callback with real data
                if (callback) {
                    callback({
                        success: true,
                        message: 'Successfully created message',
                        data: messageResponse,
                        timing: {
                            emitTime,
                            dbTime
                        }
                    });
                }
            })
            .catch(error => {
                console.error('[ChannelMessage] Error saving to DB:', error);

                // Notify users about failure
                usersInChannel.forEach(({ socketId }) => {
                    io.to(socketId).emit('channelMessageFailed', {
                        tempId: optimisticMessage._id,
                        error: 'Failed to save message'
                    });
                });

                if (callback) {
                    callback({
                        success: false,
                        message: 'Failed to save message',
                        error: error.message
                    });
                }
            });

        // Return immediately with optimistic response
        if (!callback) {
            return;
        }
    });
}

