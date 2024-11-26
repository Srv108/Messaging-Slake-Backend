import nodemailer from 'nodemailer';

import { APP_PASS } from './serverConfig.js';

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "lucifer4864yd@gmail.com",
        pass: APP_PASS,
    },
})

export default transporter;