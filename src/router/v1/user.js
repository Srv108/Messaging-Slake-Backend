import express from 'express';

import { signIn, signUp, validateEmailAndUsernameContoller } from '../../controller/userController.js';
import {
    userSignInSchema,
    userSignUpSchema
} from '../../validator/userSchema.js';
import { validate } from '../../validator/zodValidator.js';

const router = express.Router();

router.post('/signup', validate(userSignUpSchema), signUp);
router.post('/signin', validate(userSignInSchema), signIn);
router.get('/validateuser',validateEmailAndUsernameContoller);

export default router;
