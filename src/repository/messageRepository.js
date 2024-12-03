import Message from '../schema/message.js';
import crudRepository from './crudRepository.js';

const MessageRepository = {
    ...crudRepository(Message),
    getPaginatedMessage: async function (messageParams, page, limit) {
        const messages = Message.find(messageParams)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('senderId', 'username email ');

        return messages;
    }
};

export default MessageRepository;
