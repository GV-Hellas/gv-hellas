import {z} from 'zod';
import {BUSINESS_SPONSOR_TYPES} from './schema';

const mediaTypeSchema = z.enum(['image', 'video', 'audio']);

export const localizedHtmlSchema = z.object({
    el: z.string().optional().default(''),
    de: z.string().optional().default('')
});

export const businessMediaSchema = z.object({
    id: z.string().min(1),
    type: mediaTypeSchema,
    url: z.string().optional().default(''),
    filename: z.string().optional(),
    originalFilename: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
    alt: localizedHtmlSchema.optional(),
    caption: localizedHtmlSchema.optional(),
    uploadKey: z.string().optional()
});

export const businessSectionSchema = z.object({
    id: z.string().min(1),
    beforeHtml: localizedHtmlSchema,
    media: z.array(businessMediaSchema).default([]),
    afterHtml: localizedHtmlSchema
});

export const businessPayloadSchema = z.object({
    sponsorType: z.enum(BUSINESS_SPONSOR_TYPES).default('listed'),
    name: z.string().trim().min(1, 'Business name is required'),
    slug: z.string().trim().optional().default(''),
    logo: z.string().optional().default(''),
    description: localizedHtmlSchema,
    url: z
        .string()
        .trim()
        .optional()
        .default('')
        .refine((value) => {
            if (!value) return true;

            try {
                const parsed = new URL(value);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
            } catch {
                return false;
            }
        }, 'Valid URL required'),
    email: z
        .string()
        .trim()
        .optional()
        .default('')
        .refine(
            (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            'Valid email required'
        ),
    telephone: z.string().trim().optional().default(''),
    contactPerson: z.string().trim().optional().default(''),
    sections: z.array(businessSectionSchema).min(1, 'At least one section is required')
});

export const businessSaveInputSchema = businessPayloadSchema.extend({
    id: z.number().int().positive().optional()
});

export type BusinessPayloadValidated = z.infer<typeof businessPayloadSchema>;
export type BusinessSaveInputValidated = z.infer<typeof businessSaveInputSchema>;