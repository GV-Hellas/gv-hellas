import {z} from 'zod';

export const EVENT_CATEGORIES = [
    'general',
    'dance',
    'kids',
    'assembly',
    'celebration'
] as const;

export const eventMediaTypeSchema = z.enum(['image', 'video', 'audio']);

export const localizedTextSchema = z.object({
    el: z.string().trim().min(1, 'Required'),
    de: z.string().trim().optional().default('')
});

export const optionalLocalizedTextSchema = z.object({
    el: z.string().optional().default(''),
    de: z.string().optional().default('')
});

export const eventMediaSchema = z.object({
    id: z.string().min(1),
    type: eventMediaTypeSchema,
    url: z.string().optional().default(''),
    filename: z.string().optional(),
    originalFilename: z.string().optional(),
    mimeType: z.string().optional(),
    size: z.number().optional(),
    alt: optionalLocalizedTextSchema.optional(),
    caption: optionalLocalizedTextSchema.optional(),
    uploadKey: z.string().optional()
});

export const eventSectionSchema = z.object({
    id: z.string().min(1),
    beforeHtml: optionalLocalizedTextSchema,
    media: z.array(eventMediaSchema).default([]),
    afterHtml: optionalLocalizedTextSchema
});

const nullablePriceSchema = z
    .union([z.number(), z.null()])
    .default(null);

export const eventPayloadSchema = z.object({
    title: localizedTextSchema,
    description: optionalLocalizedTextSchema,
    date: z.string().trim().min(1, 'Required'),
    time: z.string().trim().min(1, 'Required'),
    location: z.string().trim().min(1, 'Required'),
    category: z.enum(EVENT_CATEGORIES).default('general'),
    priceMembers: nullablePriceSchema,
    pricePublic: nullablePriceSchema,
    sections: z.array(eventSectionSchema).min(1, 'At least one section is required')
});

export type EventPayloadValidated = z.infer<typeof eventPayloadSchema>;