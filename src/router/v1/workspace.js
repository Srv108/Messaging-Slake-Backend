import express from 'express';

import {
    addChannelToWorkspaceController,
    addMemberToWorkspaceController,
    createWorkspaceController,
    deleteWorkspaceController,
    getAllWorkspceOfUserIsMemberController,
    getWorkspaceByJoinCodeController,
    getWorkspaceByMemberController,
    updatedWorkspaceController
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
    '/:workspaceId/member',
    isAuthenticated,
    getWorkspaceByMemberController
);
router.put('/:workspaceId/update', isAuthenticated, updatedWorkspaceController);
export default router;
