import { createServer } from 'node:http';

import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';

import apiRouter from '../src/router/apiRoutes.js';
import bullServerAdapter from './config/bullboardConfig.js';
import { connectDB } from './config/dbConfig.js';
import { PORT } from './config/serverConfig.js';
import channelSocketHandler from './controller/channelSocketController.js';
import messageSocketHandler from './controller/messageSocketController.js';
import { isAuthenticated } from './middlewares/authMiddleware.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
const io = new Server(server);

app.use('/ui', bullServerAdapter.getRouter());

app.get('/ping', isAuthenticated, (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'Pong Hui Hui 🙂!'
    });
});

app.use('/api', apiRouter);

io.on('connection', (socket) => {
    console.log('User connected',socket.id);
    
    // socket.on('message', (data) => {
    //     console.log('message coming is ',data);
    //     io.emit('message',data);
    // });

    messageSocketHandler(io,socket);
    channelSocketHandler(io,socket);
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
