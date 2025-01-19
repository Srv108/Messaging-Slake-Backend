import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

import roomRepository from "../repository/roomRepository.js";
import userRepository from "../repository/userRepository.js";
import ClientError from "../utils/Errors/clientError.js";
import ValidationError from "../utils/Errors/validationError.js";

export const createRoomService = async (senderId,recieverId) => {
    try {
        const isValidObjectId = mongoose.Types.ObjectId.isValid(recieverId);
        if(!isValidObjectId){
            throw new ClientError({
                message: 'Invalid Reciever id',
                explanation: ['Reciever id sent by you is invalid'],
                statusCodes: StatusCodes.FORBIDDEN
            });
        }

        const isValidUser = await userRepository.getById(recieverId);
        if(!isValidUser){
            throw new ClientError({
                message: 'Invalid Reciever id',
                explanation: ['Reciever id sent by you is invalid'],
                statusCodes: StatusCodes.NOT_FOUND
            });
        }
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

        const isValidObjectId = mongoose.Types.ObjectId.isValid(recieverId);
        if(!isValidObjectId){
            throw new ClientError({
                message: 'Invalid Reciever id',
                explanation: ['Reciever id sent by you is invalid'],
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isValidUser = await userRepository.getById(recieverId);
        if(!isValidUser){
            throw new ClientError({
                message: 'Invalid Reciever id',
                explanation: ['Reciever id sent by you is invalid'],
                statusCodes: StatusCodes.NOT_FOUND
            });
        }
        const room = await roomRepository.getRoomBySenderAndReciverId(senderId,recieverId);

        return room;
    } catch (error) {
        console.log('Error coming in getting specific room service',error);
        throw error;
    }
}

export const updateRoomStatusService = async(roomId,data,userId) => {
    try {
        
        const room = await roomRepository.getById(roomId);
        if(!room){
            throw new ClientError({
                explanation: ['room id sent by the client is invalid'],
                message: 'Invalid room id',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }
        const isUserAuthenticated = (room.senderId.toString() === userId || room.recieverId.toString() === userId);

        if(!isUserAuthenticated){
            throw new ClientError({
                explanation: ['user is not authenticated to do this action'],
                message: 'invalid user id',
                statusCodes: StatusCodes.UNAUTHORIZED
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

export const getRoomByIdService = async(roomId,userId) => {
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

        const roomDetails = await roomRepository.getRoomDetails(roomId)
        return roomDetails;
    } catch (error) {
        console.log('error coming in getting room by id');
        throw error;
    }
}
