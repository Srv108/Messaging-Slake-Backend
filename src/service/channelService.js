import { StatusCodes } from "http-status-codes";

import channelRepository from "../repository/channelRepository.js";
import ClientError from "../utils/Errors/clientError.js";
import { isUserMemberOfWorkspace } from "./workspaceService.js";

export const getChannelByIdService = async (channelId,userId) => {
    try{
        const channel = channelRepository.getChannelWithWorkspace(channelId);

        const isValidUser = isUserMemberOfWorkspace(userId,channel.workspaceId);
        if(!channel){
            throw new ClientError({
                explanation: ['Channel not found to the given channel id'],
                message: 'Channel Not Found',
                statusCodes: StatusCodes.NOT_FOUND
            })
        }
        if(!isValidUser){
            throw new ClientError({
                explanation: ['User not belongs to the given workspace'],
                message: 'User not belongs to the given workspace',
                statusCodes: StatusCodes.UNAUTHORIZED
            })
        }
        return channel;
    }catch(error){
        console.log('Get ChannelById Service error',error);
        throw error;
    }
}