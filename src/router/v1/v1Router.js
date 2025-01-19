import express from 'express';

import channelRouter from './channel.js';
import memberRouter from './member.js';
import messageRouter from './message.js';
import message2Router from './message2.js'
import roomRouter from './room.js'
import userRouter from './user.js';
import workspaceRouter from './workspace.js';

const router = express.Router();

router.use('/users', userRouter);
router.use('/workspace', workspaceRouter);
router.use('/channel', channelRouter);
router.use('/member', memberRouter);
router.use('/messages', messageRouter);
router.use('/directMessages',message2Router);
router.use('/room',roomRouter);

export default router;
