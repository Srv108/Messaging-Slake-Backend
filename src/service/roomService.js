import { StatusCodes } from "http-status-codes";

import roomRepository from "../repository/roomRepository.js";
import ClientError from "../utils/Errors/clientError.js";
import ValidationError from "../utils/Errors/validationError.js";

export const createRoomService = async (senderId,recieverId) => {
    try {
        console.log('Senderid and reciever id is ',senderId,recieverId);
        const room = await roomRepository.create({ senderId, recieverId });

        const roomDetails = await roomRepository.getRoomDetails(room._id);
        return roomDetails;
        
    } catch (error) {
        console.log('Error in creating room Service ', error);
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
                    error: ['Room with same details already exists']
                },
                'Room with same details already exists'
            );
        }
        throw error;
    }
}

export const getAllRoomByUserIdService = async(userId) => {
    try {
        
        const rooms = await roomRepository.getAllRoomsByUserId(userId);

        return rooms;
    } catch (error) {
        console.log('Error in getting room service',error);

        throw error;
    }
}

export const getRoomBySenderIdAndRecieverIdService = async(senderId,recieverId) => {
    try {
        const room = await roomRepository.getRoomBySenderAndReciverId(senderId,recieverId);

        return room;
    } catch (error) {
        console.log('Error coming in getting specific room service',error);
        throw error;
    }
}

export const updateRoomStatusService = async(roomId,data) => {
    try {
        
        const room = await roomRepository.getById(roomId);
        if(!room){
            throw new ClientError({
                explanation: ['room id sent by the client is invalid'],
                message: 'Invalid room id',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const response = await roomRepository.update(roomId,data);

        return response;
    } catch (error) {
        console.log('Error in updating room status',error);
        throw error;
    }
}

export const deleteRoomService = async(roomId,userId) => {
    try {
        const room = await roomRepository.getById(roomId);
        if(!room){
            throw new ClientError({
                explanation: ['room id sent by the client is invalid'],
                message: 'Invalid room id',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isUserPartOfRoom = (room.senderId.toString() === userId || room.recieverId.toString() === userId)
        if(!isUserPartOfRoom){
            throw new ClientError({
                explanation: ['user id sent by the client is invalid'],
                message: 'user is unauthorised to do this action',
                statusCodes: StatusCodes.UNAUTHORIZED
            });
        }

        const response = await roomRepository.delete(roomId);
        return response;
    } catch (error) {
        console.log('Error in deleting room service',error);
        throw error;
    }
}
