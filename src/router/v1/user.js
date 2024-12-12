import express from 'express';

import { signIn, signUp, updatePasswordController, validateEmailAndUsernameContoller } from '../../controller/userController.js';
import {
    userSignInSchema,
    userSignUpSchema
} from '../../validator/userSchema.js';
import { validate } from '../../validator/zodValidator.js';
import otpRouter from './otp.js';

const router = express.Router();

router.post('/signup', validate(userSignUpSchema), signUp);
router.post('/signin', validate(userSignInSchema), signIn);
router.post('/validateuser',validateEmailAndUsernameContoller);
router.post('/updatepassword',updatePasswordController);
router.use('/otpverification',otpRouter);

export default router;
