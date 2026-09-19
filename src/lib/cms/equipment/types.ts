import type {EventMedia, EventSection, Lang, LocalizedText} from '$lib/cms/events/types';

export type EquipmentMedia = EventMedia;
export type EquipmentSection = EventSection;

export type EquipmentPayload = {
    title: LocalizedText;
    description: LocalizedText;
    pricePerDay: number;
    sections: EquipmentSection[];
};

export type StoredEquipment = EquipmentPayload & {
    id: number;
    slug: string;
    createdAt: string;
    updatedAt: string;
};

export type {Lang, LocalizedText};
