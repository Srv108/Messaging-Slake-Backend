export default function messageHandler(io,socket){
    socket.on('joinRoom',async function joinRoom(data,callback){
        const roomId = data.roomId;
        socket.join(roomId);
        console.log(`user ${socket.id} joined the room ${roomId}`);
        callback?.({
            success: true,
            message: 'Successfully joined the room',
            data: roomId
        })
    })
}