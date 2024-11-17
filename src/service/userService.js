import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';

import userRepository from '../repository/userRepository.js';
import ClientError from '../utils/Errors/clientError.js';
import ValidationError from '../utils/Errors/validationError.js';
import { generateToken } from '../utils/jwt/jwtUtils.js';

export const SignUpService = async (data) => {
    try {
        const newUser = userRepository.create(data);
        return newUser;
    } catch (error) {
        console.log('User Service Error', error);
        if (error.name === 'ValidationError') {
            throw new ValidationError(
                {
                    error: error.errors
                },
                error.message
            );
        }
        if (error.name === 'MongoServerError' && error.code === 11000) {
            throw new ValidationError(
                {
                    error: ['A user with same email or username already exists']
                },
                'A user with same email or username already exists'
            );
        }
    }
};

export const SingInService = async (userDetails) => {
    try {
        validateLoginDetails(userDetails); // to validate the login types.....

        // find user exist or not
        const user =
            userDetails.loginType === 'email'
                ? await userRepository.getByEmail(userDetails.email)
                : await userRepository.getUserByUsername(userDetails.username);

        if (!user) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'No registered users  found with this email',
                statusCodes: StatusCodes.NOT_FOUND
            });
        }

        const isValidPassword = bcrypt.compareSync(
            userDetails.password,
            user.password
        );

        if (!isValidPassword) {
            throw new ClientError({
                explanation: 'Invalid data sent from the client',
                message: 'Invalid password, please try again',
                statusCode: StatusCodes.BAD_REQUEST
            });
        }

        const token = await generateToken({
            email: user.email,
            username: user.username,
            id: user._id
        });
        return {
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            token: token
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const validateLoginDetails = (userDetails) => {
    if (!userDetails.loginType) {
        throw new ClientError({
            explanation: 'Invalid data sent from the client',
            message: 'Login Type Required',
            statusCodes: StatusCodes.NOT_FOUND
        });
    }

    if (userDetails.loginType === 'username' && !userDetails.username) {
        throw new ClientError({
            explanation: 'Invalid data sent from the client',
            message: 'Username is required for username login.',
            statusCodes: StatusCodes.NOT_FOUND
        });
    }

    if (userDetails.loginType === 'email' && !userDetails.email) {
        throw new ClientError({
            explanation: 'Invalid data sent from the client',
            message: 'Email is required for email login.',
            statusCodes: StatusCodes.NOT_FOUND
        });
    }

    return true; // Validation passed
};
