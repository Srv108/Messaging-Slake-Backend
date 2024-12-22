import { StatusCodes } from 'http-status-codes';

import { SignUpService, SingInService, updatePasswordService, UpdateUserDpService, updateUserProfileService, validateEmailAndUsernameService } from '../service/userService.js';
import {
    customErrorResponse,
    internalErrorResponse,
    successResponse
} from '../utils/common/responseObject.js';

export const signUp = async (req, res) => {
    try {
        const response = await SignUpService(req.body);
        return res.status(StatusCodes.OK).json({
            success: true,
            messgae: 'User created successfully',
            data: response
        });
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

export const signIn = async (req, res) => {
    try {
        const response = await SingInService(req.body);
        return res
            .status(StatusCodes.ACCEPTED)
            .json(successResponse(response, 'SignedIn successfully'));
    } catch (error) {
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

export const validateEmailAndUsernameContoller = async(req,res) => {
    try {
        const response = await validateEmailAndUsernameService(req.body);
        return res
        .status(StatusCodes.ACCEPTED)
        .json(successResponse(response, 'Verified Successfully'));
    } catch (error) {
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

export const updatePasswordController = async(req,res) => {
    try{
        // const user = req.user;
        const response = await updatePasswordService(req.body);

        console.log(response);
        return res
        .status(StatusCodes.OK)
        .json(successResponse(response, 'Password updated Successfully'));

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
};

export const updateUserDpController = async(req,res) => {
    try {

        const userProfileDetails = {
            avatar: req.file.location,
            awsKey: req.file.key,
        }
        const response = await UpdateUserDpService(userProfileDetails,req.user);

        return res
        .status(StatusCodes.OK)
        .json(successResponse(response, 'ProfilePic updated Successfully'));
    } catch (error) {
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

export const updateUserProfileController = async(req,res) => {
    try {
        const response = await updateUserProfileService(req.body,req.user);

        return res
        .status(StatusCodes.OK)
        .json(successResponse(response, 'Profile updated Successfully'));
    } catch (error) {
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