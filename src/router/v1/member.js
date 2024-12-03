import express from 'express';

import { isUserMemberOfWorkspaceController } from '../../controller/memberController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get(
    '/workspace/:id',
    isAuthenticated,
    isUserMemberOfWorkspaceController
);

export default router;
