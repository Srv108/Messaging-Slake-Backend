import express from "express";

import { getMessageForRoomController } from "../../controller/messageController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/:roomId',isAuthenticated,getMessageForRoomController);

export default router;