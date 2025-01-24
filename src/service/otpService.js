import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import otpGenerator from 'otp-generator';

import { addEmailToMailQueue } from '../Producer/mailQueueProducer.js';
import otpRepository from '../repository/otpRepository.js';
import userRepository from '../repository/userRepository.js';
import { generatedOtpMail } from '../utils/common/mailObject.js';
import ClientError from '../utils/Errors/clientError.js';
import { generateToken } from '../utils/jwt/jwtUtils.js';

export const generateOtpForUserService = async(email) => {
    try {
        const isValidEmail = await userRepository.getByEmail(email);
        if(!isValidEmail){
            throw new ClientError({
                message: 'Unauthorised Login',
                explanation: ['Email sent by the client is not valid'],
                statuscodes: StatusCodes.UNAUTHORIZED
            })
        }
        
        const otp = otpGenerator.generate(6,{lowerCaseAlphabets: false,upperCaseAlphabets: false, specialChars: false });

        const otpDetails = await otpRepository.create({email,otp});
        addEmailToMailQueue({
            ...generatedOtpMail({
                otp: otp,
                email: isValidEmail.email,
                username: isValidEmail.username
            }),
            to: isValidEmail.email
        })

        return otpDetails;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const matchOtpService = async(otpObject) => {
    try {
        const user = await userRepository.getByEmail(otpObject.email);
        if(!user){
            throw new ClientError({
                message: 'Invalid Email',
                explanation: ['email id sent by the client is invalid'],
                statuscodes: StatusCodes.NOT_FOUND
            })
        }
        const otpDetails = await otpRepository.getOtpByEmail(otpObject.email);
        const hashedOtp = otpDetails.otp;

        const isValidOtp = bcrypt.compareSync(otpObject.otp,hashedOtp);
        if(!isValidOtp){
            throw new ClientError({
                message: 'Unauthorised Login',
                explanation: ['Otp submitted by the client is not valid'],
                statuscodes: StatusCodes.UNAUTHORIZED
            })
        }

        const token = await generateToken({
            id: user._id,
            email: user.email,
            username: user.username,
        },'5m');

        return {
            verified: 'ok',
            email: user.email,
            message: 'you can move ahead !',
            token: token
        }

    } catch (error) {
        console.log(error);
        throw error;
    }
}