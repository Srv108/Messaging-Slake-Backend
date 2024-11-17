import bcrypt from 'bcrypt';

import userRepository from '../repository/userRepository.js';
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
    try{

        // find user exist or not
        const user = ((userDetails.input === 'email') 
            ? (await userRepository.getByEmail(userDetails.email)) 
            : (await userRepository.getUserByUsername(userDetails.username)));

        if(!user){
            throw {
                status: 400,
                message: 'User Does Not Exist'
            }
        }
        console.log(user);
        const isValidPassword = bcrypt.compareSync(userDetails.password,user.password);

        if(!isValidPassword){
            throw{
                status: 401,
                message: 'Invalid Password'
            }
        }
        
        const token = await generateToken({email: user.email,username: user.username,id: user._id});
        return token;

    }catch(error){
        console.log(error);
        throw error;
    }
}

