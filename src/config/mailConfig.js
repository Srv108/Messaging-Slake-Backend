import nodemailer from 'nodemailer';

import { APP_PASS, MAIL_ID } from './serverConfig.js';

export default nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: MAIL_ID,
        pass: APP_PASS
    }
});
