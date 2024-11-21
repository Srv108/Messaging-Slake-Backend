import express from 'express';

import { createWorkspaceController, deleteWorkspaceController, getAllWorkspceOfUserController } from '../../controller/workspaceController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';
import { createWorkSpaceSchema } from '../../validator/createWorkspaceSchema.js';
import { validate } from '../../validator/zodValidator.js';

const router = express.Router();

router.post('/',isAuthenticated,validate(createWorkSpaceSchema),createWorkspaceController);
router.delete('/:id',isAuthenticated,deleteWorkspaceController);
router.get('/',isAuthenticated,getAllWorkspceOfUserController);
export default router;
