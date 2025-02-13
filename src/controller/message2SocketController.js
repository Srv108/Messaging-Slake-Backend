import { IMAGE_KEY } from "../config/serverConfig.js";
import { createMessageService } from "../service/message2Service.js";

export default function messageHandler(io,socket){
    socket.on('roomMessage',async function createMessageHandler(data,callback){
        const { filename, timeStamp, ...messageData } = data;

        if(filename.trim() && timeStamp) {
            const safeFileName = filename.replace(/\s+/g, "_"); 
            messageData.imageKey = `${safeFileName}-${timeStamp}-${IMAGE_KEY}`;
        }

        const messageResponse = await createMessageService(messageData);
        console.log('message in the room is ',messageResponse);

        const roomId = data.roomId;
        socket.to(roomId).emit('roomMessageRecieved',messageResponse);

        callback({
            success: true,
            message: 'Successfully created message in the room',
            data: messageResponse
        });
    })
}