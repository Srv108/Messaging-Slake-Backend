import jwt from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../config/serverConfig.js';

export const generateToken = async(payload) => {
    return jwt.sign(payload,JWT_SECRET_KEY,{expiresIn: '1d'});
}

export const verifyToken = async(token) => {
    return jwt.verify(token,JWT_SECRET_KEY);
}