import mailer from '../config/mailConfig.js';
import mailQueue from '../queue/mailQueue.js';

mailQueue.process(async (job) => {
    const mailData = job.data;
    console.log('Email processing ...', mailData);
    try {
        await mailer.sendMail(mailData);
        console.log('Email sent successfully..');
    } catch (error) {
        console.log('Error processing email', error);
    }
});
