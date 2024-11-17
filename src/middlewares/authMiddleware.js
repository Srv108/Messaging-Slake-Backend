import { StatusCodes } from 'http-status-codes';
import { JWT_SECRET_KEY } from '../config/serverConfig.js';
import {
    customErrorResponse,
    internalErrorResponse
} from '../utils/common/responseObject.js';
import { verifyToken } from '../utils/jwt/jwtUtils.js';
import userRepository from '../repository/userRepository.js';

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.headers['access-token'];

        if (!token) {
            throw res.status(StatusCodes.FORBIDDEN).json(
                customErrorResponse({
                    message: 'Token is required'
                })
            );
        }

        const response = await verifyToken(token, JWT_SECRET_KEY);

        if (!response) {
            throw res.status(StatusCodes.BAD_REQUEST).json(
                customErrorResponse({
                    explanation: 'Invalid token sent',
                    message: 'Invalid Token. please try again!'
                })
            );
        }

        const user = await userRepository.getById(response.id);
        req.user = user;
        next();
    } catch (error) {
        console.log('Auth middleware error', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(StatusCodes.FORBIDDEN).json(
                customErrorResponse({
                    explanation: 'Invalid data sent from the client',
                    message: 'Invalid auth token provided'
                })
            );
        }
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(internalErrorResponse(error));
    }
};
