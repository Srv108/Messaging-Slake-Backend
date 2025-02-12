import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';

import apiRouter from '../src/router/apiRoutes.js';
import bullServerAdapter from './config/bullboardConfig.js';
import { connectDB } from './config/dbConfig.js';
import { PORT } from './config/serverConfig.js';
import channelSocketHandler from './controller/channelSocketController.js';
import message2SocketHandler from './controller/message2SocketController.js'
import messageSocketHandler from './controller/messageSocketController.js';
import roomSocketHandler from './controller/roomSocketController.js'
import { isAuthenticated } from './middlewares/authMiddleware.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.use(cors())
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

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

    message2SocketHandler(io,socket);
    roomSocketHandler(io,socket);
    messageSocketHandler(io,socket);
    channelSocketHandler(io,socket);
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
