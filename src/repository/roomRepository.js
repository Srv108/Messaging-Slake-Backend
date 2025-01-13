import Room from "../schema/room.js";
import crudRepository from "./crudRepositor.js";

const roomRepository = {
    ...crudRepository,
    getAllRoomsByUserId: async function(userId){
        const rooms = await Room.find({$or: [
            {senderId: userId},
            {recieverId: userId},
        ]});
        return rooms;
    },
    getRoomBySenderAndReciverId: async function(senderId,recieverId) {
        const room = await Room.findOne({
            $and: [
                {senderId: senderId},
                {recieverId: recieverId}
            ]
        });

        return room;
    },


}

export default roomRepository;