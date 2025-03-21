import { createServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import fs from 'fs';
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
import { isAuthenticated, isAuthenticatedSocket } from './middlewares/authMiddleware.js';

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

/* verify authenticated socket */
io.use(isAuthenticatedSocket);
console.log("Checking file existence:", fs.existsSync('./src/utils/common/responseObject.js'));

io.on('connection', (socket) => {
    const user = socket?.user;
    socket.join(`${user?.username}-${user.id}`);

    console.log('User connected',socket.id,user?.email,user?.id);

    roomSocketHandler(io,socket);
    message2SocketHandler(io,socket);
    channelSocketHandler(io,socket);
    messageSocketHandler(io,socket);

    socket.on('offer',({ from, to, offer },callback) => {
        console.log(`offer coming from ${from.email} to ${to.room}`,from,to);

        /* if user not in the room the send notification to join the room and also sent offer with it*/
        console.log(`Sending IncomingCallNotification to room is ${to.room} for`,`${to.user.username}-${to.user.id}`);
        socket.to(`${to.user.username}-${to.user.id}`).emit('IncomingCallNotification',{ offer, from: from,to: to })

        callback({
            success: true,
            message: 'Successfully recieved and forward offer to the remote peer',
            data: offer
        })
    })

    socket.on('answer',({ answer, from, to},callback) => {
        console.log(`answer coming from ${from} to ${to.room}`, answer);

        socket.to(to.room).emit('newAnswer',{answer, from: from});

        console.log(`answer is emitted from the server ${socket.id} to the room ${to.room}`);

        callback({
            success: true,
            message: 'Successfully recieved and forward offer to the remote peer',
            data: answer
        })
    })

    socket.on('ice-candidate',({ from, to, candidate },callback) => {
        console.log(`candidate coming from ${from.email} to ${to.room}`);
        socket.to(to.room).emit('newIce-candidate',{candidate, from: socket.id});

        callback({
            success: true,
            message: 'Successfully recieved and forward candidate to the remote peer',
            data: candidate
        })
    })

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
