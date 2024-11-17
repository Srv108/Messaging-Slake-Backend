import express from 'express';

import { signIn, signUp } from '../../controller/userController.js';
import {
    userSignInSchema,
    userSignUpSchema
} from '../../validator/userSchema.js';
import { validate } from '../../validator/zodValidator.js';

const router = express.Router();

router.post('/signUp', validate(userSignUpSchema), signUp);
router.get('/signIn', validate(userSignInSchema), signIn);

export default router;
