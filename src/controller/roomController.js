import { StatusCodes } from "http-status-codes";

import { createRoomService, getAllRoomByUserIdService, getRoomBySenderIdAndRecieverIdService, updateRoomStatusService } from "../service/roomService.js";
import { customErrorResponse, internalErrorResponse } from "../utils/common/responseObject.js";

export const createRoomController = async (req,res) => {
    try {
        
        const senderId = req.user.toString();
        const recieverId = req.body.recieverId;
        const response = await createRoomService(senderId,recieverId);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'room created successfully',
            data: response
        });
    } catch (error) {
        console.log('Error coming in creating room controller',error);
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

export const getAllRoomByUserIdController = async(req,res) => {
    try {
        
        const response = await getAllRoomByUserIdService(req.user);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'all rooms fetched successfully',
            data: response
        });
    } catch (error) {
        console.log('Error coming in getting all room controller',error);
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

export const getRoomBySenderIdAndRecieverIdController = async(req,res) => {
    try {
        
        const response = await getRoomBySenderIdAndRecieverIdService(req.user,req.body.recieverId);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'room fetched successfully',
            data: response
        });
    } catch (error) {
        console.log('Error coming in getting room controller',error);
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

export const updateRoomStatusController = async(req,res) => {
    try {
        
        const response = await updateRoomStatusService(req.body.roomId,req.body.data);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'room fetched successfully',
            data: response
        });
    } catch (error) {
        console.log('Error coming in updating room controller',error);
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