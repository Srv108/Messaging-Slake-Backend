import { StatusCodes } from "http-status-codes";

import { matchOtpService } from "../service/otpService.js";
import { customErrorResponse, internalErrorResponse, successResponse } from "../utils/common/responseObject.js";

export const matchOtpController = async(req,res) => {
    try{
        const response = await matchOtpService(req.body);
        return res
            .status(StatusCodes.ACCEPTED)
            .json(successResponse(response, 'Verified Successfully'));
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