import { StatusCodes } from "http-status-codes";

import { deleter } from "../config/multerConfig.js";
import message2Repository from "../repository/message2Repository.js";
import roomRepository from "../repository/roomRepository.js";
import ClientError from "../utils/Errors/clientError.js";
// import { createRoomService } from "./roomService.js";

export const createMessageService = async(data) => {
    try {
        
        // const room = await roomRepository.getById(data.roomId);
        // if(!room){
        //     const response = createRoomService(data.senderId,data.recieverId);
        //     data.roomId = response._id;
        // }

        const newMessage = await message2Repository.create(data);
        const messageDetails = await message2Repository.getMessageDetails(newMessage._id);

        return messageDetails;
    } catch (error) {
        console.log('Error coming in creating message for one one chatting service',error);
        throw error;
    }
}

export const isUserAuthenticated = async(roomId,userId) => {
    try {
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
    } catch (error) {
        console.log('Error in authenticating user to get messgae',error);
        throw error;
    }
}

export const getAllMessageByRoomIdService = async(messageParams,userId,page,limit) => {
    try {
        
        await isUserAuthenticated(messageParams.roomId,userId);

        // const messages = await message2Repository.getAllMessageByRoomId({roomId});
        const messages = await message2Repository.getPaginatedMessage(
            messageParams,
            page,
            limit
        );
        
        
        return messages;
    } catch (error) {
        console.log('Error in getting all messgae by room id ',error);
        throw error;
    }
}

export const fetchLastMessageDetailsService = async(roomId,userId) => {
    try {
        
        await isUserAuthenticated(roomId,userId);

        const lastMessageDetails = await message2Repository.getLastMessageDetails(roomId);

        return lastMessageDetails;
    } catch (error) {
        console.log('Error in getting last messgae by room id ',error);
        throw error;
    }
}

export const deleteMessageService = async(messageId,userId) => {
    try {
        
        const message = await message2Repository.getMessageDetails(messageId);
        if(message.senderId._id.toString() !== userId){
            throw new ClientError({
                explanation: ['user is not sender of this mssg'],
                message: 'you are not authorised for delete this message',
                statusCodes: StatusCodes.UNAUTHORIZED
            });
        }

        if(message.image){
            console.log(message.imageKey);
            await deleter(message.imageKey);
        }
        
        await message2Repository.delete(messageId);

        return {
            success: 'true',
            message: 'Message deleted successfully',
            statusCodes: StatusCodes.OK
        }
    } catch (error) {
        console.log('error in deleting message',error);
        throw error;
    }
}