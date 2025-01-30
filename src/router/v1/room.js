import express from "express";

import { createRoomController, deleteRoomController, getAllRoomByUserIdController, getMemberDetailsController, getRoomByIdController, getRoomBySenderIdAndRecieverIdController, updateRoomStatusController } from "../../controller/roomController.js";
import { isAuthenticated } from "../../middlewares/authMiddleware.js";
// import { roomCreateSchema } from "../../validator/roomSchema.js";

const router = express.Router();

router.post('/',isAuthenticated,createRoomController);
router.get('/',isAuthenticated,getAllRoomByUserIdController); // to get all rooms related to a specific user
router.get('/user',isAuthenticated,getRoomBySenderIdAndRecieverIdController);
router.get('/member',isAuthenticated,getMemberDetailsController);
router.get('/:roomId',isAuthenticated,getRoomByIdController);
router.put('/:roomId/update',isAuthenticated,updateRoomStatusController);
router.delete('/:id',isAuthenticated,deleteRoomController);
export default router;