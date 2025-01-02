import { StatusCodes } from 'http-status-codes';

import channelRepository from '../repository/channelRepository.js';
import MessageRepository from '../repository/messageRepository.js';
import ClientError from '../utils/Errors/clientError.js';
import { isUserMemberOfWorkspace } from './workspaceService.js';

export const getMessageService = async (messageParams, userId, page, limit) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const channelId = messageParams.channelId;

        const channelDetails =
            await channelRepository.getChannelWithWorkspace(channelId);
        if (!channelDetails) {
            throw new ClientError({
                explanation: ['Invalid channel id sent by client'],
                message: 'channel not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isMember = await isUserMemberOfWorkspace(
            userId,
            channelDetails.workspaceId
        );
        if (!isMember) {
            throw new ClientError({
                explanation: ['Invalid channel id sent by client'],
                message: 'user not part of workspace',
                statusCodes: StatusCodes.UNAUTHORIZED
            });
        }
        const messages = await MessageRepository.getPaginatedMessage(
            messageParams,
            page,
            limit
        );
        return messages;
    } catch (error) {
        throw error;
    }
};

export const createMessage = async(data) => {
    const newMessage = await MessageRepository.create(data);
    
    const messageDetails = await MessageRepository.getMessageDetails(newMessage._id);

    return messageDetails;
}
