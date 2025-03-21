import { StatusCodes } from 'http-status-codes';

import { s3 } from '../config/awsConfig.js';
import { AWS_BUCKET_NAME, IMAGE_KEY } from '../config/serverConfig.js';
import message2Repository from '../repository/message2Repository.js';
import { deleteMessageService, fetchLastMessageDetailsService, getAllMessageByRoomIdService } from '../service/message2Service.js';
import { getMessageService } from '../service/messageService.js';
import {
    customErrorResponse,
    internalErrorResponse,
    successResponse
} from '../utils/common/responseObject.js';
import ClientError from '../utils/Errors/clientError.js';

export const getMessageController = async (req, res) => {
    try {
        const messages = await getMessageService(
            {
                channelId: req.params.channelId
            },
            req.user,
            req.query.page || 1,
            req.query.limit || 20
        );

        return res.status(StatusCodes.OK).json(
            successResponse({
                data: messages,
                messgae: 'Message fetched successfully'
            })
        );
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

export const getPresignedUrlFromAws = async(req,res) => {
    try {

        const time = Date.now().toString();

        /* ensures for no any space and if there replace it with underscore _  */
        const safeFileName = req.query.fileName.replace(/\s+/g, "_"); 

        const url = await s3.getSignedUrlPromise('putObject',{
            Bucket: AWS_BUCKET_NAME,
            Key: `${safeFileName}-${time}-${IMAGE_KEY}`,
            Expires: 120,
            ContentType: req.query.contentType 
        })

        return res.status(StatusCodes.OK).json(
            successResponse({
                data: {presignedUrl: url,time: time},
                messgae: 'Presigned URL generated successfully'
            })
        );
    } catch (error) {
        console.log('Controller layer error  in getting url ', error);
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

export const getMessageForRoomController = async(req,res) => {
    try {

        const response = await getAllMessageByRoomIdService(
            {
                roomId: req.params.roomId
            },
            req.user,
            req.query.page || 1,
            req.query.limit || 20
        );

        return res.status(StatusCodes.OK).json(
            successResponse({
                data: response,
                messgae: 'Message fetched successfully'
            })
        );
    } catch (error) {
        console.log('Controller layer error  in getting message for rooms ', error);
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

export const getLastMessageForRoomController = async(req,res) => {
    try {
        
        const response = await fetchLastMessageDetailsService(req.params.roomId,req.user);

        return res.status(StatusCodes.OK).json(
            successResponse({
                data: response,
                messgae: 'Last Message fetched successfully'
            })
        );
    } catch (error) {
        console.log('Controller layer error  in getting last message for rooms ', error);
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

export const deleteRoomMessageController = async(req,res) => {
    try {
        
        const response = await deleteMessageService(req.params.messageId,req.user);

        return res.status(StatusCodes.OK).json(
            successResponse({
                data: response,
                messgae: 'Message deleted successfully'
            })
        );
    } catch (error) {
        console.log('Controller layer error  in deleting message for rooms ', error);
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

export const getDownloadPresignedUrlFromAws = async(req,res) => {
    try {
        const message = await message2Repository.getById(req.params.id);

        if(!message || !message.imageKey){
            throw new ClientError({
                message: 'Invalid message id sent',
                explanation: 'message id sent by the client side is not found',
                statusCodes: StatusCodes.NOT_FOUND
            })
        }

        const url = await s3.getSignedUrlPromise('getObject',{
            Bucket: AWS_BUCKET_NAME,
            Key: message.imageKey,
            Expires: 120,
        })

        return res.status(StatusCodes.OK).json(
            successResponse({
                data: url,
                messgae: 'Download Presigned URL generated successfully'
            })
        );
    } catch (error) {
        console.log('Controller layer error  in getting url ', error);
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