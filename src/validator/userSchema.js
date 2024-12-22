import { z } from 'zod';

export const userSignUpSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string()
});

export const userSignInSchema = z.object({
    email: z.string().email().optional(), // Validate email if provided
    username: z.string().min(3).optional(), // Validate username if provided
    password: z.string(),
    loginType: z.string(),
});

export const otpVerificationSchema = z.object({
    email: z.string().email(),
    otp: z.string()
});

export const userVerificationSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3),
})

export const validatePasswordSchema = z.object({
    password: z.string(),
})
export const userDetailsSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
})