import express from 'express';

import channelRouter from './channel.js';
import userRouter from './user.js';
import workspaceRouter from './workspace.js';

const router = express.Router();

router.use('/users', userRouter);
router.use('/workspace', workspaceRouter);
router.use('/channel',channelRouter);

export default router;
