import fs from 'fs';
import path from 'path';

import { MAIL_ID } from '../../config/serverConfig.js';
export function workspaceJoinMail(workspace) {
    return {
        from: MAIL_ID,
        subject: `You have been added to a ${workspace.name}`,
        text: `Congratulations! You have been added to the workspace ${workspace.name}`
    };
}

export function generatedOtpMail(otp) {

    const filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(filename);
    const mailTemplatePath = path.resolve(__dirname, '../mailTemplate/mailTemplate.html');

    const htmlTemplate = fs.readFileSync(mailTemplatePath, 'utf-8');
    const emailHtmlContent = htmlTemplate.replace('${otp}', otp);
    return {
        from: MAIL_ID, // Sender email (make sure you set this up in your environment)
        subject: 'OTP Verification for Your Account',
        html: emailHtmlContent
    }
}
