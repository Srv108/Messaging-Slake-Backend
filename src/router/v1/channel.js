import express from "express";

import { getChannelByIdController } from "../../controller/channelController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/:id',isAuthenticated,getChannelByIdController);

export default router;