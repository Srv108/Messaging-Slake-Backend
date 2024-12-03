import { StatusCodes } from 'http-status-codes';

import { getMessageService } from '../service/messageService.js';
import {
    customErrorResponse,
    internalErrorResponse,
    successResponse
} from '../utils/common/responseObject.js';

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
