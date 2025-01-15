import { createMessage } from "../service/messageService.js";
import { NEW_MESSAGE_EVENT, NEW_MESSAGE_RECEIVED_EVENT } from "../utils/common/eventConstants.js";

export default function messageHandler(io,socket) {
    socket.on(NEW_MESSAGE_EVENT,async function createMessageHandler(data,callback){
        const messageResponse = await createMessage(data);
        console.log("message is ",messageResponse);
        // socket.broadcast.emit(NEW_MESSAGE_RECEIVED_EVENT,messageResponse);
        const roomId = data.channelId;
        socket.to(roomId).emit(NEW_MESSAGE_RECEIVED_EVENT,messageResponse);
        callback({
            success: true,
            message: 'Successfully created message',
            data: messageResponse
        });
    });
}

