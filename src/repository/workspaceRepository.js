import { StatusCodes } from 'http-status-codes';

import User from '../schema/user.js';
import WorkSpace from '../schema/workspace.js';
import ClientError from '../utils/Errors/clientError.js';
import channelRepository from './channelRepository.js';
import crudRepository from './crudRepository.js';

const workspaceRepository = {
    ...crudRepository(WorkSpace),
    getWorkspaceDetailsById: async function (workspaceId) {
        const workspace = await WorkSpace.findById(workspaceId)
            .populate('members.memberId', 'username email avatar')
            .populate('channels');

        return workspace;
    },
    getWorkspaceByName: async function (workspaceName) {
        const workspace = await WorkSpace.findOne({
            name: workspaceName
        });
        if (!workspace) {
            throw new ClientError({
                explanation: 'invalid data sent by the client',
                message: 'workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        return workspace;
    },
    getWorkspaceByJoinCode: async function (joinCode) {
        const workspace = await WorkSpace.findOne({
            joinCode: joinCode
        });
        if (!workspace) {
            throw new ClientError({
                explanation: 'invalid data sent by the client',
                message: 'Invalid Join Code',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        return workspace;
    },
    addMemberToWorkspace: async function (workspaceId, memberId, role) {
        const workspace = await WorkSpace.findById(workspaceId);
        if (!workspace) {
            throw new ClientError({
                explanation: 'invalid data sent by the client side',
                message: 'Workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isValidUser = await User.findById(memberId);
        if (!isValidUser) {
            throw new ClientError({
                explanation: 'invalid data sent by the client',
                message: 'member not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        // const isMemberAlreadyInWorkspace = WorkSpace.members.findOne('members.memberId': memberId);
        const isMemberAlreadyInWorkspace = workspace.members.find(
            (members) => members.memberId == memberId
        );
        if (isMemberAlreadyInWorkspace) {
            throw new ClientError({
                explanation: 'member already present in the workspace',
                message: 'member already present in the workspace',
                statusCodes: StatusCodes.FORBIDDEN
            });
        }

        // now add member to the workspace
        workspace.members.push({
            memberId,
            role
        });

        await workspace.save();

        return workspace;
    },
    addChannelToWorkspace: async function (workspaceId, channelName) {
        const workspace =
            await WorkSpace.findById(workspaceId).populate('channels');

        if (!workspace) {
            throw new ClientError({
                explanation: 'invalid data sent by the client side',
                message: 'Workspace not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        // is channel already in workspace or not
        const isChannelAlreadyInWorkspace = workspace.channels.find(
            (channel) => channel.name == channelName
        );

        if (isChannelAlreadyInWorkspace) {
            throw new ClientError({
                explanation: 'member already present in the workspace',
                message: 'Channel already present in the workspace',
                statusCodes: StatusCodes.FORBIDDEN
            });
        }

        // now create a channel with ChannelName
        const channel = await channelRepository.create({
            name: channelName,
            workspaceId: workspaceId
        });

        workspace.channels.push(channel);
        await workspace.save();

        return workspace;
    },
    fetchAllWorkspceByMemberId: async function (memberId) {
        const workspace = await WorkSpace.find({
            'members.memberId': memberId
        })
            .populate('members.memberId', 'username email avatar')
            .populate('channels', 'name');

        return workspace;
    }
};

export default workspaceRepository;
