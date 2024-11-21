import { StatusCodes } from "http-status-codes";

import { createWorkspaceService, deleteWorkspaceService, getAllWorkspaceOfUserService } from "../service/workspaceService.js";
import { customErrorResponse, internalErrorResponse, successResponse } from "../utils/common/responseObject.js";

export const createWorkspaceController = async(req,res) => {
    try{

        const response = await createWorkspaceService({
            ...req.body,
            owner: req.user
        });

        console.log("WorkSpace details is ",response);
        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'Workspace created successfully',
            data: response
        });
    }catch(error){
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
}

export const deleteWorkspaceController = async(req,res) => {
    try{
        const response = await deleteWorkspaceService(req.params.id,req.user);
        return res.status(StatusCodes.ACCEPTED).json(successResponse({
            messgae: 'workspace deleted successfully',
            data: response
        }))
    }catch(error){
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

export const getAllWorkspceOfUserController = async(req,res) => {
    try{
        const workspaces = await getAllWorkspaceOfUserService(req.user);
        return res.status(StatusCodes.ACCEPTED).json(successResponse({
            messgae: 'workspace fetched successfully',
            data: workspaces
        }))
    }catch(error){
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