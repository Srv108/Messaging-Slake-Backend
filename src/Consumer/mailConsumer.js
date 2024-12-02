import mailer from '../config/mailConfig.js';
import mailQueue from '../queue/mailQueue.js';

mailQueue.process(async (job) => {
    const mailData = job.data;
    console.log('Email processing ...', mailData);
    try {
        const response = await mailer.sendMail(mailData);
        console.log('Email sent successfully..', response);
    } catch (error) {
        console.log('Error processing email', error);
    }
});
