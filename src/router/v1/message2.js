import express from "express";

import { deleteRoomMessageController, getLastMessageForRoomController, getMessageForRoomController } from "../../controller/messageController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/:roomId',isAuthenticated,getMessageForRoomController)
router.get('/:roomId/lastMessage',isAuthenticated,getLastMessageForRoomController);
router.delete('/delete/:messageId',isAuthenticated,deleteRoomMessageController);

export default router;