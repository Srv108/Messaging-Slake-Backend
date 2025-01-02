import Message from '../schema/message.js';
import crudRepository from './crudRepository.js';

const MessageRepository = {
    ...crudRepository(Message),
    getPaginatedMessage: async function (messageParams, page, limit) {
        const messages = await Message.find(messageParams)
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('senderId', 'username email avatar');

        return messages;
    },
    getMessage: async function (messageParams) {
        const messages = await Message.find(messageParams)
            .sort({ createdAt: -1 })
            .populate('senderId', 'username email avatar');

        return messages;
    },
    getMessageDetails: async function (id) {
        const message = await Message.findById(id).populate(
            'senderId', 
            'username email avatar'
        );

        return message;
    }
};

export default MessageRepository;
