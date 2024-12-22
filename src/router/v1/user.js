import express from 'express';

import { uploader } from '../../config/multerConfig.js';
import { signIn, signUp, updatePasswordController, updateUserDetailsController, validateEmailAndUsernameContoller } from '../../controller/userController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';
import {
    otpVerificationSchema,
    userDetailsSchema,
    userSignInSchema,
    userSignUpSchema,
    userVerificationSchema,
    validatePasswordSchema
} from '../../validator/userSchema.js';
import { validate } from '../../validator/zodValidator.js';
import otpRouter from './otp.js';

const router = express.Router();

router.post('/signup', validate(userSignUpSchema), signUp);
router.post('/signin', validate(userSignInSchema), signIn);
router.post('/validateuser',validate(userVerificationSchema),validateEmailAndUsernameContoller);
router.post('/updatepassword',validate(validatePasswordSchema),updatePasswordController);
router.use('/otpverification',validate(otpVerificationSchema),otpRouter);
router.put('/update/profile',isAuthenticated,validate(userDetailsSchema),uploader.single('avatar'),updateUserDetailsController);

export default router;
