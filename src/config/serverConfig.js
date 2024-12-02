import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;

export const DEV_DB_URL = process.env.DEV_DB_URL;
export const PROD_DB_URL = process.env.PROD_DB_URL;
export const NODE_ENV = process.env.NODE_ENV;

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const APP_PASS = process.env.APP_PASS;

export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_HOST = process.env.REDIS_HOST;

export const MAIL_ID = process.env.MAIL_ID;
