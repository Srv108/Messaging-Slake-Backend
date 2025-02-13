import express from 'express';

import { getDownloadPresignedUrlFromAws, getMessageController, getPresignedUrlFromAws } from '../../controller/messageController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/pre-signed-url',isAuthenticated,getPresignedUrlFromAws);
router.get('/get-download-signed-url/:id',isAuthenticated,getDownloadPresignedUrlFromAws);
router.get('/:channelId', isAuthenticated, getMessageController);

export default router;
