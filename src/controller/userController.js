import { StatusCodes } from 'http-status-codes';

import { SignUpService } from '../service/userService.js';
import {
  customErrorResponse,
  internalErrorResponse
} from '../utils/common/responseObject.js';
export const signUp = async (req, res) => {
  try {
    const user = req.body;
    const response = await SignUpService(user);
    return res.status(StatusCodes.OK).json({
      success: true,
      messgae: 'User created successfully',
      data: response
    });
  } catch (error) {
    console.log('Controller layer error ', error);
    if (error.statusCodes) {
      return res.status(error.statusCodes).json(customErrorResponse(error));
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(internalErrorResponse(error));
  }
};
