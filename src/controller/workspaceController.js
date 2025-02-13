import { StatusCodes } from 'http-status-codes';

import {
    addChannelToWorkspaceService,
    addMemberTOWorkspaceByUsernameService,
    addMemberToWorkspaceService,
    createWorkspaceService,
    deleteWorkspaceService,
    getAllWorkspaceOfUserIsMemberService,
    getWorkspaceByIdService,
    getWorkspaceByJoinCodeService,
    joinWorkspaceService,
    updatedWorkspaceService,
    updateWorkspaceJoincodeService
} from '../service/workspaceService.js';
import {
    customErrorResponse,
    internalErrorResponse,
    successResponse
} from '../utils/common/responseObject.js';

export const createWorkspaceController = async (req, res) => {
    try {
        const response = await createWorkspaceService({
            ...req.body,
            owner: req.user
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'Workspace created successfully',
            data: response
        });
    } catch (error) {
        console.log('Controller layer error ', error);
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const deleteWorkspaceController = async (req, res) => {
    try {
        const response = await deleteWorkspaceService(req.params.id, req.user);
        return res.status(StatusCodes.ACCEPTED).json(
            successResponse({
                messgae: 'workspace deleted successfully',
                data: response
            })
        );
    } catch (error) {
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const getAllWorkspceOfUserIsMemberController = async (req, res) => {
    try {
        const workspaces = await getAllWorkspaceOfUserIsMemberService(req.user);
        return res.status(StatusCodes.ACCEPTED).json(
            successResponse({
                messgae: 'workspace fetched successfully',
                data: workspaces
            })
        );
    } catch (error) {
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const addMemberToWorkspaceController = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        const memberId = req.body.user;
        const role = req.body.role;
        const response = await addMemberToWorkspaceService(
            workspaceId,
            memberId,
            role,
            req.user
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'Member added successfully',
            data: response
        });
    } catch (error) {
        console.log('Controller layer error ', error);
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const addChannelToWorkspaceController = async (req, res) => {
    try {
        const response = await addChannelToWorkspaceService(
            req.params.workspaceId,
            req.body.channelName,
            req.user
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'Channel added successfully',
            data: response
        });
    } catch (error) {
        console.log(
            'Controller layer addChannelToWorkspaceController error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const getWorkspaceByJoinCodeController = async (req, res) => {
    try {
        const joinCode = req.body.joinCode;
        const response = await getWorkspaceByJoinCodeService(
            joinCode,
            req.user
        );

        return res
            .status(StatusCodes.OK)
            .json(successResponse(response, 'Workspace fetched successfully'));
    } catch (error) {
        console.log(
            'Controller layer getWorkspaceByJoinCodeController error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const getWorkspaceByIdController = async (req, res) => {
    try {
        const response = await getWorkspaceByIdService(
            req.params.workspaceId,
            req.user
        );
        return res
            .status(StatusCodes.OK)
            .json(successResponse(response, 'Workspace fetched successfully'));
    } catch (error) {
        console.log(
            'Controller layer getWorkspaceByMemberController error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const updatedWorkspaceController = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        const workspaceData = req.body;
        const response = await updatedWorkspaceService(
            workspaceId,
            workspaceData,
            req.user
        );

        return res
            .status(StatusCodes.OK)
            .json(successResponse(response, 'Workspace Updated Successfully'));
    } catch (error) {
        console.log(
            'Controller layer updatedWorkspaceController error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};

export const updateWorkspaceJoincodeController = async(req,res) => {
    try{

        const response = await updateWorkspaceJoincodeService(req.params.workspaceId,req.user);
        return res
            .status(StatusCodes.OK)
            .json(successResponse(response, 'Workspace Updated Successfully'));
    }catch(error){
        console.log(
            'Controller layer update Workspace joincode error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
}

export const joinWorkspaceController = async(req,res) => {
    try {
        
        const response = await joinWorkspaceService(
            req.params.workspaceId,
            req.body.joinCode,
            req.user
        );
        return res
            .status(StatusCodes.OK)
            .json(successResponse(response, 'Workspace joined Successfully'));

    } catch (error) {
        console.log(
            'join Workspace controller error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
}

export const addMemberTOWorkspaceByUsernameController = async(req,res) => {
    try {
        
        const response = await addMemberTOWorkspaceByUsernameService(
            req.params.workspaceId,
            req.body.username,
            req.user
        );

        return res
            .status(StatusCodes.OK)
            .json(successResponse(response, 'Workspace joined Successfully'));

    } catch (error) {
        console.log(
            'join Workspace controller error ',
            error
        );
        if (error.statusCodes) {
            return res
                .status(error.statusCodes)
                .json(customErrorResponse(error));
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
}