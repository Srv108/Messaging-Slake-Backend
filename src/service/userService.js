import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';

import { deleter } from '../config/multerConfig.js';
import userRepository from '../repository/userRepository.js';
import ClientError from '../utils/Errors/clientError.js';
import ValidationError from '../utils/Errors/validationError.js';
import { generateToken } from '../utils/jwt/jwtUtils.js';
import { createDMsService } from './directMessageService.js';
import { generateOtpForUserService } from './otpService.js';

export const SignUpService = async (data) => {
    try {
        const newUser = await userRepository.create(data);
        await createDMsService(newUser._id);
        
        return newUser;
    } catch (error) {
        console.log('User Service Error', error);
        if (error.name === 'ValidationError') {
            throw new ValidationError(
                {
                    error: error.errors,
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
            token: token,
            id: user._id
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

export const validateEmailAndUsernameService = async(userDetails) => {
    try {
        const isValidEmail = await userRepository.getByEmail(userDetails.email);

        if(!isValidEmail){
            throw new ClientError({
                explanation: ['Email sent by the client is invalid'],
                message: 'Username details are incorrect',
                statusCode: StatusCodes.NOT_FOUND
            })
        }

        const isValidUsername = await userRepository.getUserByUsername(userDetails.username);
        if(!isValidUsername){
            throw new ClientError({
                explanation: ['Username sent by the client is invalid'],
                message: 'Username details are incorrect',
                statusCode: StatusCodes.NOT_FOUND
            })
        }
        console.log(isValidEmail.email);
        await generateOtpForUserService(isValidEmail.email);
        return ({
            email: isValidEmail.email,
            username: isValidEmail.username,
            avatar: isValidEmail.avatar,
            createdAt: isValidEmail.createdAt,
            updatedAt: isValidEmail.updatedAt
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
}


export const updatePasswordService = async(updateObject) => {
    try{
        const isValidUser = await userRepository.getByEmail(updateObject.email);
        if(!isValidUser){
            throw new ClientError({
                explanation: ['email sent by the client is invalid'],
                message: 'email details are incorrect',
                statusCode: StatusCodes.NOT_FOUND
            })
        }
        const updatedUser = await userRepository.findByEmailAndUpdate({updateObject});
        return updatedUser;
    }catch(error){
        console.log(error);
        throw error;
    }
}

export const UpdateUserDpService = async(userProfileDetails,userId) => {
    try{
        const isValidUser = await userRepository.getById(userId);
        if(!isValidUser) {
            throw new ClientError({
                explanation: ['User id sent by the client is invalid'],
                message: 'You are not authorised to update',
                statusCode: StatusCodes.NOT_FOUND
            })
        }
        const fileKey = isValidUser?.awsKey;
        if(fileKey) await deleter(fileKey);

        const response = await userRepository.update(userId,{...userProfileDetails,skipPasswordHashing: true});
        console.log(response);
        return response;
    }catch(error){
        console.log('Error in updating user details',error);
        throw error;
    }
}

export const updateUserProfileService = async (userDetails,userId) => {
    try {
        const isValidUser = await userRepository.getById(userId);
        if(!isValidUser) {
            throw new ClientError({
                explanation: ['User id sent by the client is invalid'],
                message: 'You are not authorised to update',
                statusCode: StatusCodes.NOT_FOUND
            })
        }
        const response = await userRepository.update(userId,{...userDetails,skipPasswordHashing: true});
        return response;
    } catch (error) {
        console.log('error in update user details service',error);
        throw error;
    }
}