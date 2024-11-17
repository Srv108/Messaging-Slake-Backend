import express from 'express';
import { StatusCodes } from 'http-status-codes';

import apiRouter from '../src/router/apiRoutes.js';
import { connectDB } from './config/dbConfig.js';
import { PORT } from './config/serverConfig.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'Pong'
    });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
