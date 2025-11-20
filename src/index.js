import { existsSync,readFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';

import cors from 'cors';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';

import apiRouter from '../src/router/apiRoutes.js';
import bullServerAdapter from './config/bullboardConfig.js';
import { connectDB } from './config/dbConfig.js';
import { PORT, SSL_CERT_DATA, SSL_CERT_PATH, SSL_KEY_DATA, SSL_KEY_PATH, USE_HTTPS } from './config/serverConfig.js';
import channelSocketHandler from './controller/channelSocketController.js';
import message2SocketHandler from './controller/message2SocketController.js'
import messageSocketHandler from './controller/messageSocketController.js';
import roomSocketHandler from './controller/roomSocketController.js'
import { isAuthenticatedSocket } from './middlewares/authMiddleware.js';
import socketManager from './utils/socketManager.js';

const app = express();
let server;

// Configure HTTPS if enabled and certificates are available
if (USE_HTTPS) {
    try {
        let options;

        // Priority 1: Use inline certificate data from .env (SSL_KEY_DATA, SSL_CERT_DATA)
        if (SSL_KEY_DATA && SSL_CERT_DATA) {
            // Replace literal \n with actual newlines for multiline certificates
            const key = SSL_KEY_DATA.replace(/\\n/g, '\n');
            const cert = SSL_CERT_DATA.replace(/\\n/g, '\n');
            
            options = { key, cert };
            console.log('✅ HTTPS server created with inline SSL certificate data from .env');
        }
        // Priority 2: Use certificate files (SSL_KEY_PATH, SSL_CERT_PATH)
        else if (SSL_KEY_PATH && SSL_CERT_PATH) {
            // Check if certificate files exist
            if (!existsSync(SSL_KEY_PATH)) {
                throw new Error(`SSL key file not found at: ${SSL_KEY_PATH}`);
            }
            if (!existsSync(SSL_CERT_PATH)) {
                throw new Error(`SSL certificate file not found at: ${SSL_CERT_PATH}`);
            }

            options = {
                key: readFileSync(SSL_KEY_PATH),
                cert: readFileSync(SSL_CERT_PATH)
            };
            console.log('✅ HTTPS server created with SSL certificate files');
            console.log('   Key:', SSL_KEY_PATH);
            console.log('   Cert:', SSL_CERT_PATH);
        } else {
            throw new Error('No SSL certificates configured. Set either SSL_KEY_DATA/SSL_CERT_DATA or SSL_KEY_PATH/SSL_CERT_PATH');
        }

        server = createHttpsServer(options, app);
    } catch (error) {
        console.error('❌ Failed to create HTTPS server:', error.message);
        console.log('⚠️  Falling back to HTTP server');
        server = createHttpServer(app);
    }
} else {
    server = createHttpServer(app);
    console.log('ℹ️  Running HTTP server (non-secure)');
    console.log('   To enable HTTPS, set USE_HTTPS=true in .env file');
}
const io = new Server(server, {
    cors: {
        origin: '*',
        credentials: true,  // Enable credentials (cookies, authorization headers)
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'access-token', 'x-requested-with'],
        exposedHeaders: ['access-token', 'refresh-token'],
        maxAge: 600,  // How long the results of a preflight request can be cached (in seconds)
        preflightContinue: false,
        optionsSuccessStatus: 204
    },
    // Prevent automatic disconnections
    pingTimeout: 60000,        // 60 seconds - time to wait for pong response
    pingInterval: 25000,       // 25 seconds - interval between pings
    upgradeTimeout: 30000,     // 30 seconds - time to wait for upgrade
    allowUpgrades: true,       // Allow transport upgrades
    transports: ['websocket', 'polling'], // Support both transports
    connectTimeout: 45000      // 45 seconds - connection timeout
});

app.use(cors())
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.use('/ui', bullServerAdapter.getRouter());

app.get('/ping', (req, res) => {
    res.status(StatusCodes.OK).json({
        message: 'Pong Hui Hui 🙂!'
    });
});

// Debug endpoint to check SocketManager state
app.get('/debug/sockets', (req, res) => {
    const stats = socketManager.getStats();
    const users = [];
    
    socketManager.users.forEach((data, userId) => {
        users.push({
            userId,
            email: data.user.email || data.user._doc?.email,
            username: data.user.username || data.user._doc?.username,
            socketId: data.socketId,
            rooms: Array.from(data.rooms)
        });
    });
    
    res.json({
        stats,
        users,
        timestamp: new Date().toISOString()
    });
});

app.use('/api', apiRouter);

/* verify authenticated socket */
io.use(isAuthenticatedSocket);

io.on('connection', (socket) => {
    const user = socket?.user;

    console.log('\n========== NEW CONNECTION ==========');
    console.log('[Connection] Socket ID:', socket.id);
    console.log('[Connection] User:', user?.email, '(', user?.username, ')');
    console.log('[Connection] User ID:', user?.id);
    console.log('[Connection] Transport:', socket.conn.transport.name);

    // Join user-specific room
    const userRoom = `${user?.username}-${user.id}`;
    socket.join(userRoom);
    console.log('[Connection] ✅ Joined user-specific room:', userRoom);

    // Register user in SocketManager for stateful tracking
    const connectionInfo = socketManager.addUser(socket.id, user, io);
    console.log('[Connection] ✅ Registered in SocketManager');
    console.log('[Connection] Is reconnection?', connectionInfo.isReconnection);
    
    if (connectionInfo.previousSocketId) {
        console.log('[Connection] Previous socket ID:', connectionInfo.previousSocketId);
    }

    console.log('[SocketManager] Current stats:', socketManager.getStats());

    // If reconnection, rejoin all previous rooms automatically
    if (connectionInfo.isReconnection && connectionInfo.rooms.length > 0) {
        console.log(`[Reconnection] Auto-rejoining ${connectionInfo.rooms.length} rooms for ${user?.email}`);
        connectionInfo.rooms.forEach(roomId => {
            socket.join(roomId);
            console.log(`[Reconnection] Rejoined room: ${roomId}`);
        });
        
        // Notify client about reconnection with room list
        socket.emit('reconnected', {
            message: 'Successfully reconnected',
            rooms: connectionInfo.rooms,
            previousSocketId: connectionInfo.previousSocketId
        });
    }

    // Initialize all socket handlers
    roomSocketHandler(io, socket);
    message2SocketHandler(io, socket);
    channelSocketHandler(io, socket);
    messageSocketHandler(io, socket);

    // WebRTC signaling handlers
    socket.on('offer', ({ from, to, offer }, callback) => {
        console.log(`offer coming from ${from.email} to ${to.room}`, from, to);

        /* if user not in the room the send notification to join the room and also sent offer with it*/
        console.log(`Sending IncomingCallNotification to room is ${to.room} for`, `${to.user.username}-${to.user.id}`);
        socket.to(`${to.user.username}-${to.user.id}`).emit('IncomingCallNotification', { offer, from: from, to: to })

        callback({
            success: true,
            message: 'Successfully recieved and forward offer to the remote peer',
            data: offer
        })
    })

    socket.on('answer', ({ answer, from, to }, callback) => {
        console.log(`answer coming from ${from} to ${to.room}`, answer);

        socket.to(to.room).emit('newAnswer', { answer, from: from });

        console.log(`answer is emitted from the server ${socket.id} to the room ${to.room}`);

        callback({
            success: true,
            message: 'Successfully recieved and forward offer to the remote peer',
            data: answer
        })
    })

    socket.on('ice-candidate', ({ candidate, from, to }, callback) => {
        console.log(`ICE candidate from ${from.email} to ${to.room}`, candidate);
        
        // Forward the ICE candidate to the target user
        socket.to(to.room).emit('ice-candidate', { 
            candidate,
            from,
            to: {
                user: {
                    id: from.id,
                    username: from.username,
                    email: from.email
                },
                room: to.room
            }
        });

        callback({
            success: true,
            message: 'ICE candidate forwarded successfully'
        });
    });

    socket.on('renegotiation-needed', ({ from, to }, callback) => {
        console.log(`Renegotiation needed from ${from.email} to ${to.room}`);
        
        // Target the initiator (the one who needs to create the new offer)
        // Assuming the *other* user in the room is the one who initiated the first call.
        // If you track who is the initiator on the server, use that info.
        // Otherwise, you must send a request to the *other* person in the room.
        
        // Emit the request back to the room (everyone but the sender)
        socket.to(to.room).emit('renegotiation-request', { from, to });

        callback({
            success: true,
            message: 'Renegotiation request forwarded'
        });
    });

    // // Add error handling for offer/answer
    // const handleSignalingError = (socket, error, type) => {
    //     console.error(`Error in ${type}:`, error);
    //     socket.emit('webrtc-error', {
    //         type: type,
    //         error: error.message || 'Unknown error occurred'
    //     });
    // };

    socket.on('disconnect', (reason) => {
        console.log('\n========== DISCONNECTION ==========');
        console.log('[Disconnect] Socket ID:', socket.id);
        console.log('[Disconnect] User:', socket.user?.email);
        console.log('[Disconnect] Reason:', reason);
        console.log('[Disconnect] Transport:', socket.conn?.transport?.name);
        
        // Remove user from SocketManager
        socketManager.removeUser(socket.id);
        console.log('[Disconnect] ✅ Removed from SocketManager');
        
        console.log('[SocketManager] Stats after disconnect:', socketManager.getStats());
        console.log('========== DISCONNECTION COMPLETE ==========\n');
    });
});

server.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
