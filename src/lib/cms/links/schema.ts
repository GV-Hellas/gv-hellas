import {z} from 'zod';

export const localizedTextSchema = z.object({
    el: z.string().trim().min(1, 'Required'),
    de: z.string().trim().optional().default('')
});

export const localizedHtmlSchema = z.object({
    el: z.string().optional().default(''),
    de: z.string().optional().default('')
});

export const linkLogoVariantsSchema = z.object({
    webp: z.string().optional().default(''),
    jpg: z.string().optional().default('')
});

export const linkPayloadSchema = z.object({
    name: localizedTextSchema,
    descriptionHtml: localizedHtmlSchema.optional().default({
        el: '',
        de: ''
    }),
    url: z
        .string()
        .trim()
        .url('Valid URL required')
        .refine((value) => {
            try {
                const parsed = new URL(value);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
            } catch {
                return false;
            }
        }, 'Only HTTP and HTTPS URLs are allowed'),
    logo: z.string().optional().default(''),
    logoVariants: linkLogoVariantsSchema.optional().default({
        webp: '',
        jpg: ''
    })
});

export const linkSaveInputSchema = linkPayloadSchema.extend({
    id: z.number().int().positive().optional()
});

export type LinkPayloadValidated = z.infer<typeof linkPayloadSchema>;
export type LinkSaveInputValidated = z.infer<typeof linkSaveInputSchema>;