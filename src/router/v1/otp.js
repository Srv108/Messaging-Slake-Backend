import express from 'express';

import { matchOtpController } from '../../controller/otpController.js';
import { otpVerificationSchema } from '../../validator/userSchema.js';
import { validate } from '../../validator/zodValidator.js';

const router = express.Router();

router.post('/',validate(otpVerificationSchema),matchOtpController);


export default router;
