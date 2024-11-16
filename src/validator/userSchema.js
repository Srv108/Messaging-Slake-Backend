import { z } from 'zod';

export const userSignUpSchema = z.object({
  email: z.string().email(),
  userName: z.string().min(3),
  password: z.string()
});

export const userSignInSchema = z.object({});
