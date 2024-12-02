import express from 'express';
import { StatusCodes } from 'http-status-codes';

import apiRouter from '../src/router/apiRoutes.js';
import bullServerAdapter from './config/bullboardConfig.js';
import { connectDB } from './config/dbConfig.js';
import { PORT } from './config/serverConfig.js';
import { isAuthenticated } from './middlewares/authMiddleware.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/ui',bullServerAdapter.getRouter());

app.get('/ping', isAuthenticated, (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'Pong Hui Hui 🙂!'
    });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
