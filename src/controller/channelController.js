import { StatusCodes } from 'http-status-codes';

import { getChannelByIdService } from '../service/channelService.js';
import {
    customErrorResponse,
    internalErrorResponse,
    successResponse
} from '../utils/common/responseObject.js';

export const getChannelByIdController = async (req, res) => {
    try {
        const channel = await getChannelByIdService(req.params.id, req.user);
        console.log('channel in controller layer ', channel);
        return res.status(StatusCodes.OK).json(
            successResponse({
                data: channel,
                message: 'Channel fetched successfully !'
            })
        );
    } catch (error) {
        console.log(
            'Controller layer get ChannelById Controller error ',
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
