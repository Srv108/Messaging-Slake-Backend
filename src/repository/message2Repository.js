import Message2 from "../schema/message2.js";
import crudRepository from "./crudRepository.js";

const message2Repository = {
    ...crudRepository(Message2),
    getAllMessageByRoomId: async function(roomId){
        const messages = await Message2.find(roomId)
            .sort({createdAt: -1})
            .populate('senderId', 'email username _id avatar');
        return messages;
    },
    getPaginatedMessage: async function(messageParams,page,limit){
        const messages = await Message2.find(messageParams)
            .sort({createdAt: 1})
            .skip((page-1)*limit)
            .limit(limit)
            .populate('senderId', 'username email avatar _id');

        return messages;
    },
    getMessageDetails: async function(id){
        const message = await Message2.findById(id)
            .populate('senderId', 'username email avatar _id');
        return message;
    },
    getLastMessageDetails: async function(roomId) {
        const message = await Message2.findOne({roomId: roomId})
            .sort({ createdAt: -1})
            .populate('senderId', 'email username _id avatar');
        
        return message;
    }
}

export default message2Repository;