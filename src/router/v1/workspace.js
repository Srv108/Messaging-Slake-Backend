import express from 'express';

import {
    addChannelToWorkspaceController,
    addMemberToWorkspaceController,
    createWorkspaceController,
    deleteWorkspaceController,
    getAllWorkspceOfUserIsMemberController,
    getWorkspaceByIdController,
    getWorkspaceByJoinCodeController,
    joinWorkspaceController,
    updatedWorkspaceController,
    updateWorkspaceJoincodeController
} from '../../controller/workspaceController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';
import { createWorkSpaceSchema } from '../../validator/createWorkspaceSchema.js';
import { validate } from '../../validator/zodValidator.js';

const router = express.Router();

router.post(
    '/',
    isAuthenticated,
    validate(createWorkSpaceSchema),
    createWorkspaceController
);
router.delete('/:id', isAuthenticated, deleteWorkspaceController);
router.get('/', isAuthenticated, getAllWorkspceOfUserIsMemberController);
router.put(
    '/:workspaceId/members',
    isAuthenticated,
    addMemberToWorkspaceController
);

router.put(
    '/:workspaceId/channel',
    isAuthenticated,
    addChannelToWorkspaceController
);

router.get('/joincode', isAuthenticated, getWorkspaceByJoinCodeController);
router.get(
    '/:workspaceId',
    isAuthenticated,
    getWorkspaceByIdController
);
router.put('/:workspaceId/update', isAuthenticated, updatedWorkspaceController);

router.put('/:workspaceId/join',isAuthenticated,joinWorkspaceController);
router.put('/:workspaceId/joincode/reset',isAuthenticated,updateWorkspaceJoincodeController);
export default router;
