import { StatusCodes } from "http-status-codes";

import { isUserMemberOfWorkspaceService } from "../service/memberService.js";
import { customErrorResponse, internalErrorResponse, successResponse } from "../utils/common/responseObject.js";

export const isUserMemberOfWorkspaceController = async(req,res) => {
    try {
        const response = await isUserMemberOfWorkspaceService(
            req.user,
            req.params.id
        );
        return res.status(StatusCodes.OK).json(successResponse({
            data: response,
            message: 'User Found'
        }))
    } catch (error) {
        console.log(
            'Controller layer isUserMemberOfWorkspace error ',
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
}