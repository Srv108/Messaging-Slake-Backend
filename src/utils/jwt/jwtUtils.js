import jwt from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../config/serverConfig.js';

export const generateToken = async (payload,time='1d') => {
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: time });
};

export const verifyToken = async (token) => {
    return jwt.verify(token, JWT_SECRET_KEY);
};
