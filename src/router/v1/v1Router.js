import express from 'express';

import channelRouter from './channel.js';
import memberRouter from './member.js';
import userRouter from './user.js';
import workspaceRouter from './workspace.js';

const router = express.Router();

router.use('/users', userRouter);
router.use('/workspace', workspaceRouter);
router.use('/channel', channelRouter);
router.use('/member',memberRouter);

export default router;
