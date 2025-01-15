import { createMessageService } from "../service/message2Service.js";

export default function messageHandler(io,socket){
    socket.on('roomMessage',async function createMessageHandler(data,callback){
        const messageResponse = await createMessageService(data);
        console.log('message is ',messageResponse);

        const roomId = data.roomId;
        socket.to(roomId).emit('roomMessageRecieved',messageResponse);

        callback({
            success: true,
            message: 'Successfully created message',
            data: messageResponse
        });
    })
}