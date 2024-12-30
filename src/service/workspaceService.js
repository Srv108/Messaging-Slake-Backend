import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { addEmailToMailQueue } from '../Producer/mailQueueProducer.js';
import channelRepository from '../repository/channelRepository.js';
import userRepository from '../repository/userRepository.js';
import workspaceRepository from '../repository/workspaceRepository.js';
import { workspaceJoinMail } from '../utils/common/mailObject.js';
import ClientError from '../utils/Errors/clientError.js';
import ValidationError from '../utils/Errors/validationError.js';

export const createWorkspaceService = async (workspaceData) => {
    try {
        console.log(workspaceData);
        const joinCode = uuidv4().substring(0, 6).toUpperCase();

        const response = await workspaceRepository.create({
            name: workspaceData.name,
            description: workspaceData.description,
            joinCode
        });

        await workspaceRepository.addMemberToWorkspace(
            response._id,
            workspaceData.owner,
            'admin'
        );

        const updatedWorkspace =
            await workspaceRepository.addChannelToWorkspace(
                response._id,
                'general'
            );

        return updatedWorkspace;
    } catch (error) {
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
};

export const getAllWorkspaceOfUserIsMemberService = async (userId) => {
    try {
        const workspaces =
            await workspaceRepository.fetchAllWorkspceByMemberId(userId);
        console.log(workspaces);
        return workspaces;
    } catch (error) {
        console.log('getAllWorkspaceOfUserIsMemberService error', error);
        throw error;
    }
};

export const deleteWorkspaceService = async (workspaceId, userId) => {
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: ['Invalid details send by the client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.BAD_REQUEST
            });
        }

        const isUserOwnerOfWorkspace = await isUserAdminOfWorkspace(
            userId,
            workspace
        );

        if (isUserOwnerOfWorkspace) {
            console.log(workspace.channels);
            await channelRepository.deleteMany(workspace.channels);

            const response = await workspaceRepository.delete(workspaceId);
            return response;
        }
        throw new ClientError({
            explanation: [
                'User is either not a memeber or an admin of the workspace'
            ],
            message: 'You are not the admin of this workspace',
            statusCodes: StatusCodes.FORBIDDEN
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const isUserAdminOfWorkspace = async (userId, workspace) => {
    const response = await workspace.members.find(
        (member) =>
            (member.memberId.toString() === userId ||
                member.memberId._id.toString() === userId) &&
            member.role === 'admin'
    );
    console.log('what si res    ', response);
    return response;
};

export const isUserMemberOfWorkspace = async (userId, workspace) => {
    const response = await workspace.members.find(
        (member) => member.memberId._id.toString() === userId
    );
    return response || false;
};

export const getWorkspaceByJoinCodeService = async (joinCode, memberId) => {
    try {
        const workspace =
            await workspaceRepository.getWorkspaceByJoinCode(joinCode);

        if (!workspace) {
            throw new ClientError({
                explanation: ['Invalid joincode sent by client'],
                message: 'Invalid Join Code',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isMember = await isUserMemberOfWorkspace(memberId, workspace);
        if (!isMember) {
            throw new ClientError({
                explanation: ['user is not a member of the workspace'],
                message: 'user is not a member of the workspace',
                statusCodes: StatusCodes.FORBIDDEN
            });
        }

        return workspace;
    } catch (error) {
        console.log('Get workspace by join code service error', error);
        throw error;
    }
};

export const updatedWorkspaceService = async (
    workspaceId,
    workspaceData,
    userId
) => {
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: ['Invalid workspace id sent by client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const user = await isUserAdminOfWorkspace(userId, workspace);
        if (!user) {
            return new ClientError({
                explanation: [
                    'User is either not a memeber or an admin of the workspace'
                ],
                message: 'You are not the admin of this workspace',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const updatedWorkspace = await workspaceRepository.update(
            workspaceId,
            workspaceData
        );
        return updatedWorkspace;
    } catch (error) {
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
};

export const updateWorkspaceJoincodeService = async(workspaceId,userId) => {
    try {
        const newJoinCode = uuidv4().substring(0, 6).toUpperCase();
        const workspace = await updatedWorkspaceService(workspaceId,{joinCode: newJoinCode},userId);

        return workspace;
    } catch (error) {
        console.log('Error in update workspace join code service',error);
        throw error;
    }
}
export const addMemberToWorkspaceService = async (
    workspaceId,
    memberId,
    role,
    userId
) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const workspace = await workspaceRepository.getById(workspaceId);
        if (!workspace) {
            console.log('workspace not found');
            throw new ClientError({
                explanation: ['Invalid workspace id sent by client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isValidMember = await userRepository.getById(memberId);
        if (!isValidMember) {
            console.log('Member not found');
            throw new ClientError({
                explanation: ['Invalid member id sent by client'],
                message: 'Member not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isAdmin = await isUserAdminOfWorkspace(userId, workspace);
        if (!isAdmin) {
            throw new ClientError({
                explanation: [
                    'User who is adding member not the admin of the workspace'
                ],
                message: 'User is not admin of the workspace',
                statusCodes: StatusCodes.FORBIDDEN
            });
        }

        const isValidUser = await userRepository.getById(memberId);
        if (!isValidUser) {
            throw new ClientError({
                explanation: ['Invalid UserId'],
                message: 'User Not Found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isMember = await isUserMemberOfWorkspace(memberId, workspace);
        if (isMember) {
            throw new ClientError({
                explanation: ['Member is already part of the workspace'],
                message: 'Member is already part of the workspace',
                statusCodes: StatusCodes.FORBIDDEN
            });
        }

        console.log(workspace);
        const response = await workspaceRepository.addMemberToWorkspace(
            workspaceId,
            memberId,
            role
        );
        console.log('Email : ', isValidUser.email);
        console.log(isValidUser);
        addEmailToMailQueue({
            ...workspaceJoinMail(workspace),
            to: isValidUser.email
        });

        return response;
    } catch (error) {
        throw error;
    }
};

const isChannelAlreadyInWorkspace = async (workspace, channelName) => {
    return workspace.channels.find((channel) => {
        channel.name === channelName;
    });
};

export const addChannelToWorkspaceService = async (
    workspaceId,
    channelName,
    userId
) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const workspace =
            await workspaceRepository.getWorkspaceDetailsById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: ['Invalid workspace id sent by client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }
        const isAdmin = await isUserAdminOfWorkspace(userId, workspace);
        if (!isAdmin) {
            throw new ClientError({
                explanation: ['user is not admin of the workspace'],
                message: 'user is not admin of the workspace',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isChannelExist = await isChannelAlreadyInWorkspace(
            workspace,
            channelName
        );

        if (isChannelExist) {
            throw new ClientError({
                explanation: ['channel alread exist in workspace'],
                message: 'channel alread exist in workspace',
                statusCodes: StatusCodes.FORBIDDEN
            });
        }
        const response = await workspaceRepository.addChannelToWorkspace(
            workspaceId,
            channelName
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const getWorkspaceByIdService = async (workspaceId, memberId) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const workspace = await workspaceRepository.getWorkspaceDetailsById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: ['Invalid workspace id sent by client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        console.log(memberId);
        const isMember = await isUserMemberOfWorkspace(memberId, workspace);
        if (!isMember) {
            throw new ClientError({
                explanation: ['User is not a memeber of the workspace'],
                message: 'You are not the member of this workspace',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        return workspace;
    } catch (error) {
        throw error;
    }
};

export const joinWorkspaceService = async(workspaceId,joinCode,userId) => {
    try {
        // const workspace = await getWorkspaceByJoinCodeService(joinCode,userId)
        const workspace = await workspaceRepository.getWorkspaceDetailsById(workspaceId);

        if(!workspace){
            throw new ClientError({
                explanation: ['Invalid workspace id sent by client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            })
        }

        if(workspace.joinCode !== joinCode){
            throw new ClientError({
                explanation: ['Invalid joinCode sent by client'],
                message: 'workspace not found',
                statusCodes: StatusCodes.UNAUTHORIZED
            })
        }

        const response = await workspaceRepository.addMemberToWorkspace(workspaceId,userId,'member');

        return response;
    } catch (error) {
        console.log('Error in join workspace service',error);
        throw error;
    }
}

export const addMemberTOWorkspaceByUsernameService = async(workspaceId, username, adminId) => {
    try {
        const user = await userRepository.getByUsername(username);
        if (!user) {
            throw new ClientError({
                explanation: ['User does not exist'],
                message: 'User not exists',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const response = await addMemberToWorkspaceService(
            workspaceId,
            user._id,
            'member',
            adminId
        )

        return response;
    } catch (error) {
        console.log('Error coming from add member to workspace service by username',error);
        throw error;
    }
}