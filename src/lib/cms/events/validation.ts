import {z} from 'zod';
import {EVENT_CATEGORIES} from './schema';

const localizedTextSchema = z.object({
    el: z.string().trim().min(1, 'Required'),
    de: z.string().trim().min(1, 'Required')
});

const optionalLocalizedHtmlSchema = z.object({
    el: z.string().optional().default(''),
    de: z.string().optional().default('')
});

const priceSchema = z
    .number()
    .min(0, 'Must be 0 or greater')
    .nullable();

export const eventPayloadSchema = z.object({
    title: localizedTextSchema,
    description: z.object({
        el: z.string().trim().max(360, 'Maximum 360 characters').optional().default(''),
        de: z.string().trim().max(360, 'Maximum 360 characters').optional().default('')
    }),

    date: z.string().trim().min(1, 'Required'),
    time: z.string().trim().min(1, 'Required'),
    location: z.string().trim().min(1, 'Required'),

    category: z.string().refine(
        (value) => EVENT_CATEGORIES.includes(value as never),
        'Invalid category'
    ),

    priceMembers: priceSchema,
    pricePublic: priceSchema,

    sections: z
        .array(
            z.object({
                id: z.string().min(1),
                beforeHtml: optionalLocalizedHtmlSchema,
                afterHtml: optionalLocalizedHtmlSchema,
                media: z.array(z.any()).default([])
            })
        )
        .min(1, 'At least one section is required')
});

export type EventPayloadValidated = z.infer<typeof eventPayloadSchema>;