import { z } from 'zod';

export const Question = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    prompt: z.string(),
    topic: z.string(),
});
export type Question = z.infer<typeof Question>;