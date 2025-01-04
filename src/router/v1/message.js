import express from 'express';

import { getMessageController, getPresignedUrlFromAws } from '../../controller/messageController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/:channelId', isAuthenticated, getMessageController);
router.get('/pre-signed-url',isAuthenticated,getPresignedUrlFromAws);

export default router;
