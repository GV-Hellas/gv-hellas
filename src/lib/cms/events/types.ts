export type Lang = 'el' | 'de';

export type LocalizedText = {
    el: string;
    de: string;
};

export type EventMediaType = 'image' | 'video' | 'audio';

export type EventMedia = {
    id: string;
    type: 'image' | 'video' | 'audio';
    url?: string;
    filename?: string;
    originalFilename?: string;
    mimeType?: string;
    size?: number;
    alt?: {
        el: string;
        de: string;
    };
    caption?: {
        el: string;
        de: string;
    };
    uploadKey?: string;
};

export type EventSection = {
    id: string;
    beforeHtml: LocalizedText;
    media: EventMedia[];
    afterHtml: LocalizedText;
};

export type EventPayload = {
    title: LocalizedText;
    description: LocalizedText;
    date: string;
    time: string;
    location: string;
    category: string;
    priceMembers: number | null;
    pricePublic: number | null;
    sections: EventSection[];
};

export type StoredEvent = EventPayload & {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
};