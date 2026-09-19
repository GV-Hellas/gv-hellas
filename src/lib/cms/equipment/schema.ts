import {z} from 'zod';
import {eventSectionSchema} from '$lib/cms/events/schema';

const localizedTitleSchema = z.object({
    el: z.string().trim().min(1, 'Required'),
    de: z.string().trim().optional().default('')
});

const localizedDescriptionSchema = z.object({
    el: z.string().trim().max(500, 'Maximum 500 characters').optional().default(''),
    de: z.string().trim().max(500, 'Maximum 500 characters').optional().default('')
});

export const equipmentPayloadSchema = z.object({
    title: localizedTitleSchema,
    description: localizedDescriptionSchema,
    pricePerDay: z.number().finite().min(0, 'Must be 0 or greater'),
    sections: z.array(eventSectionSchema).min(1, 'At least one section is required')
});

export type EquipmentPayloadValidated = z.infer<typeof equipmentPayloadSchema>;
