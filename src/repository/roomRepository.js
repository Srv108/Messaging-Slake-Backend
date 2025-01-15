import Room from "../schema/room.js";
import crudRepository from "./crudRepository.js";

const roomRepository = {
    ...crudRepository(Room),
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
        }).populate('senderId','username email avatar _id')
        .populate('recieverId','username email avatar _id');

        return room;
    },
    getRoomDetails: async function(roomId){
        const room = await Room.findById(roomId)
            .populate('senderId','username email avatar _id')
            .populate('recieverId','username email avatar _id');

        return room;
    }
}

export default roomRepository;