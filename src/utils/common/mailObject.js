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

export function generatedOtpMail(userDetails) {

    const filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(filename);
    const mailTemplatePath = path.resolve(__dirname, '../mailTemplate/mailTemplate.html');

    const htmlTemplate = fs.readFileSync(mailTemplatePath, 'utf-8');
    const emailHtmlContent = htmlTemplate
        .replace('${otp}', userDetails.otp).
        replace('${email}',userDetails.email)
        .replace('${username}', userDetails.username);
    return {
        from: MAIL_ID, // Sender email (make sure you set this up in your environment)
        subject: 'OTP Verification for Your Account',
        html: emailHtmlContent
    }
}

export function generatedNotificationMail(notificationData) {
    const filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(filename);
    const notificationTemplatePath = path.resolve(__dirname, '../mailTemplate/notificationTemplate.html');

    const htmlTemplate = fs.readFileSync(notificationTemplatePath, 'utf-8');
    const emailHtmlContent = htmlTemplate
        .replace('${recipientName}', notificationData.recipientName)
        .replace('${senderName}', notificationData.senderName)
        .replace('${senderEmail}', notificationData.senderEmail)
        .replace('${messagePreview}', notificationData.messagePreview)
        .replace('${messageType}', notificationData.messageType)
        .replace('${timestamp}', new Date(notificationData.timestamp).toLocaleString())
        .replace('${hasImage}', notificationData.hasImage ? 'Yes' : 'No');

    return {
        from: MAIL_ID,
        to: notificationData.recipientEmail,
        subject: `New message from ${notificationData.senderName} on MessageSlake`,
        html: emailHtmlContent
    };
}
