import { StatusCodes } from "http-status-codes";

import message2Repository from "../repository/message2Repository.js";
import roomRepository from "../repository/roomRepository.js";
import userRepository from "../repository/userRepository.js";
import ClientError from "../utils/Errors/clientError.js";
import { createRoomService } from "./roomService.js";

export const createMessageService = async(data) => {
    try {
        
        const room = await roomRepository.getById(data.roomId);
        if(!room){
            const response = createRoomService(data.senderId,data.recieverId);
            data.roomId = response._id;
        }
        const newMessage = await message2Repository.create(data);
        const messageDetails = await message2Repository.getMessageDetails(newMessage._id);

        return messageDetails;
    } catch (error) {
        console.log('Error coming in creating message for one one chatting service',error);
        throw error;
    }
}

export const getAllMessageByRoomIdService = async(roomId,userId) => {
    try {

        const isValidUser = await userRepository.getById(userId);
        if(!isValidUser){
            throw new ClientError({
                explanation: ['Invalid user id sent by client'],
                message: 'user not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const room = await roomRepository.getById(roomId);
        if(!room){
            throw new ClientError({
                explanation: ['Invalid room id sent by client'],
                message: 'room not found',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isUserPartOfRoom = (room.senderId.toString() === userId || room.recieverId.toString() === userId);

        if(!isUserPartOfRoom){
            throw new ClientError({
                explanation: ['user is not a member of this room'],
                message: 'you are not authorised for this room',
                statusCodes: StatusCodes.UNAUTHORIZED
            });
        }
        const messages = await message2Repository.getAllMessageByRoomId(roomId);

        return messages;
    } catch (error) {
        console.log('Error in getting all messgae by room id ',error);
        throw error;
    }
}