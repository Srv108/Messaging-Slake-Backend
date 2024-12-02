import '../Consumer/mailConsumer.js';

import mailQueue from '../queue/mailQueue.js';

export const addEmailToMailQueue = async (emailData) => {
    console.log('Email sending process initiating....');
        await mailQueue.add(emailData);
        console.log('Email added to mail queue');
    
};
