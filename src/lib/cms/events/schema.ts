import { z } from 'zod';

export const EVENT_CATEGORIES = [
    'general',
    'dance',
    'kids',
    'assembly',
    'celebration'
] as const;

const localizedTextSchema = z.object({
    el: z.string().trim(),
    de: z.string().trim()
});

const mediaSchema = z.object({
    id: z.string().min(1),
    type: z.enum(['image', 'video', 'audio']),
    uploadKey: z.string().optional(),
    url: z.string().optional(),
    filename: z.string().optional(),
    mimeType: z.string().optional(),
    alt: localizedTextSchema.optional()
});

const sectionSchema = z.object({
    id: z.string().min(1),
    beforeHtml: localizedTextSchema,
    media: z.array(mediaSchema),
    afterHtml: localizedTextSchema
});

export const eventPayloadSchema = z.object({
    title: localizedTextSchema.refine((v) => v.el || v.de, {
        message: 'Title is required in at least one language'
    }),
    description: localizedTextSchema.refine(
        (v) => v.el.length <= 360 && v.de.length <= 360,
        { message: 'Description must be max 360 characters per language' }
    ),
    date: z.string().min(1),
    time: z.string().min(1),
    location: z.string().trim().min(1),
    category: z.enum(EVENT_CATEGORIES),
    priceMembers: z.number().min(0).nullable(),
    pricePublic: z.number().min(0).nullable(),
    sections: z.array(sectionSchema).min(1)
});

export type EventPayloadInput = z.infer<typeof eventPayloadSchema>;