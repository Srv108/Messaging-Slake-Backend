import express from 'express';

import { signUp } from '../../controller/userController.js';
import { userSignUpSchema } from '../../validator/userSchema.js';
import { validate } from '../../validator/zodValidator.js';

const router = express.Router();

router.post('/signUp',validate(userSignUpSchema), signUp);

export default router;
