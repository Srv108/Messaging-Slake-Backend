import express from "express";

import { createRoomController } from "../../controller/roomController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/',isAuthenticated,createRoomController);

export default router;