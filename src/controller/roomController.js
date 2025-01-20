import { StatusCodes } from "http-status-codes";

import userRepository from "../repository/userRepository.js";
import { createRoomService, deleteRoomService, getAllRoomByUserIdService, getRoomByIdService, getRoomBySenderIdAndRecieverIdService, updateRoomStatusService } from "../service/roomService.js";
import { customErrorResponse, internalErrorResponse } from "../utils/common/responseObject.js";

export const createRoomController = async (req,res) => {
    try {
        
        const senderId = req.user.toString();
        let recieverId = req.body?.recieverId || req.body?.username;

        if(req?.body?.username){
            const reciever = await userRepository.getByUsername(req.body.username);
            if(!reciever){
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'User not found',
                    data: reciever
                })
            }
            recieverId = reciever._id;
        }

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
            messgae: `${(response.length === 0) ? 'no any rooms belongs to you' : 'all rooms fetched successfully'}`,
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
        
        const roomData = req.body;
        const response = await updateRoomStatusService(req.params.roomId,roomData,req.user);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'room updated successfully',
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

export const deleteRoomController = async (req,res) => {
    try {
        
        const response = await deleteRoomService(req.params.id,req.user);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'room deleted successfully',
            data: response
        });
    } catch (error) {
        console.log('Error coming in deleting room controller',error);
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

export const getRoomByIdController = async (req,res) => {
    try {
        
        const response = await getRoomByIdService(req.params.roomId,req.user);

        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'room fetched successfully',
            data: response
        });
    } catch (error) {
        console.log('Error coming in deleting room controller',error);
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