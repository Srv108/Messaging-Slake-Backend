export default function messageHandler(io,socket){
    socket.on('joinRoom',async function joinRoom(data,callback){
        const roomId = data.roomId;
        if(!socket.rooms.has(roomId)) socket.join(roomId);
        console.log(`user ${socket.id} joined the room ${roomId} for message `);
        callback?.({
            success: true,
            message: 'Successfully joined the room',
            data: roomId
        })
    })
}