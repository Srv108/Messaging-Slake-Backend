import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export const IMAGE_KEY = process.env.IMAGE_KEY;

export const AWS_REGION = process.env.AWS_REGION
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

// SSL Configuration - supports both file paths and inline certificate data
export const SSL_KEY_PATH = process.env.SSL_KEY_PATH || join(__dirname, '../certs/key.pem');
export const SSL_CERT_PATH = process.env.SSL_CERT_PATH || join(__dirname, '../certs/cert.pem');
export const SSL_KEY_DATA = process.env.SSL_KEY_DATA; // Certificate key as string
export const SSL_CERT_DATA = process.env.SSL_CERT_DATA; // Certificate as string
export const USE_HTTPS = process.env.USE_HTTPS === 'true';