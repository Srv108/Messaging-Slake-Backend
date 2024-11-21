import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import channelRepository from '../repository/channelRepository.js';
import workspaceRepository from "../repository/workspaceRepository.js";
import ClientError from '../utils/Errors/clientError.js';
import ValidationError from '../utils/Errors/validationError.js';

export const createWorkspaceService = async(workspaceData) => {
    try{
        console.log(workspaceData);
        const joinCode = uuidv4().substring(0,6).toUpperCase();

        const response = await workspaceRepository.create({
            name: workspaceData.name,
            // description: workspaceData.description,
            joinCode
        });

        await workspaceRepository.addMemberToWorkspace(
            response._id,
            workspaceData.owner,
            'admin'
        );

        const updatedWorkspace = await workspaceRepository.addChannelToWorkspace(
            response._id,
            'general'
        );

        return updatedWorkspace;
    }catch(error){
        console.log('User Service Error', error);
        if (error.name === 'ValidationError') {
            throw new ValidationError(
                {
                    error: error.errors
                },
                error.message
            );
        }
        if (error.name === 'MongoServerError' && error.code === 11000) {
            throw new ValidationError(
                {
                    error: ['Workspace with same details already exists']
                },
                'Workspace with same details already exists'
            );
        }
        throw error;
    }
}

export const getAllWorkspaceOfUserService = async(userId) => {
    const workspaces = await workspaceRepository.fetchAllWorkspceByMemberId(userId);
    console.log(workspaces);
    return workspaces;
}

export const deleteWorkspaceService = async(workspaceId,userId) => {
    try{
        const workspace = await workspaceRepository.getById(workspaceId);
        if(!workspace){
            throw new ClientError({
                explanation: ['Invalid details send by the client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.BAD_REQUEST
            })
        }

        const isUserOwnerOfWorkspace = await isUserAdminOfWorkspace(userId,workspace);

        if(isUserOwnerOfWorkspace){
            console.log(workspace.channels);
            await channelRepository.deleteMany(workspace.channels);

            const response = await workspaceRepository.delete(workspaceId);
            return response;
        }
        throw new ClientError({
            explanation: ['User is either not a memeber or an admin of the workspace'],
            message: 'You are not the admin of this workspace',
            statusCodes: StatusCodes.FORBIDDEN
        })
    }catch(error){
        console.log(error);
        throw error;
    }
}

export const isUserAdminOfWorkspace = async(userId,workspace) => {
    const response = await workspace.members.find(
        (member) => (
            (member.memberId.toString() === userId || member._id.toString() === userId) 
            && member.role === 'admin'
            )
    )
    console.log(response);
    return response;
}

export const isUserMemberOfWorkspace = async(userId,workspace) => {
    const response = await workspace.members.find(
        (member) => member.memberId.toString() === userId
    )
    return response;
}