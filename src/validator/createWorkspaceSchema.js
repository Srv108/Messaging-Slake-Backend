import { z } from 'zod';

export const createWorkSpaceSchema = z.object({
    name: z.string().min(3)
});
