import { StatusCodes } from "http-status-codes";

import userRepository from "../repository/userRepository.js";
import workspaceRepository from "../repository/workspaceRepository.js";
import ClientError from "../utils/Errors/clientError.js";
import { isUserMemberOfWorkspace } from "./workspaceService.js";

export const isUserMemberOfWorkspaceService = async (userId,workspaceId) => {
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

        const isValidUser = await isUserMemberOfWorkspace(userId,workspace);
        if (!isValidUser) {
            throw new ClientError({
                explanation: ['Invalid UserId'],
                message: 'User Not Found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }
        const user = await userRepository.getUserDetails(userId);
        return user;
    } catch (error) {
        throw error;
    }
}