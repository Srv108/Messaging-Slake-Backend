import { StatusCodes } from "http-status-codes";

import directMessageRepository from "../repository/directMessageRepository.js";
import userRepository from "../repository/userRepository.js";
import ClientError from "../utils/Errors/clientError.js";
import { addMemberToWorkspaceService, createWorkspaceService } from "./workspaceService.js";

export const createDMsService = async(adminId) => {
    try {
        
        const directMessage = await directMessageRepository.create({adminId: adminId});
        
        return directMessage;
    } catch (error) {
        console.log('Error coming from creating dms at service layer',error);
        throw error;
    }
}

export const addUserToDirectMessageService = async({ adminId, userId}) => {
    try {
        const isValidUser = await userRepository.getById(userId);
        if(!isValidUser){
            throw new ClientError({
                explanation: ['Channel not found to the given channel id'],
                message: 'Channel Not Found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const workspace = await createWorkspaceService({
            name: `general-${adminId}`,
            description: '',
            owner: adminId
        });

        await addMemberToWorkspaceService({
            workspaceId: workspace._id,
            memberId: userId,
            userId: adminId
        })
        
        return workspace;
    } catch (error) {
        console.log('error coming from add member to dms service',error);
        throw error;
    }
}