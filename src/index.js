import express from 'express';
import { StatusCodes } from 'http-status-codes';

import apiRouter from '../src/router/apiRoutes.js';
import { connectDB } from './config/dbConfig.js';
import transporter from './config/mailConfig.js';
import { PORT } from './config/serverConfig.js';
import { isAuthenticated } from './middlewares/authMiddleware.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', isAuthenticated, (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'Pong Hui Hui 🙂!'
    });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
    transporter.sendMail({
        from: 'lucifer4864yd@gmail.com',
        to: 'srv.br009@gmail.com',
        subject: 'Message from MessageSlake Backend',
        text: 'Welcome to the our Message Slake App'
    })
});
