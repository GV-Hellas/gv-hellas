import type {EventMedia} from '$lib/cms/events/types';

export type Lang = 'el' | 'de';

export type LocalizedHtml = Record<Lang, string>;

export type SponsorType = 'listed' | 'bronze' | 'silver' | 'gold';

export type BusinessMedia = EventMedia;

export type BusinessSection = {
    id: string;
    beforeHtml: LocalizedHtml;
    media: BusinessMedia[];
    afterHtml: LocalizedHtml;
};

export type BusinessPayload = {
    sponsorType: SponsorType;
    name: string;
    slug: string;
    logo?: string;
    description: LocalizedHtml;
    url: string;
    email: string;
    telephone: string;
    contactPerson: string;
    sections: BusinessSection[];
};

export type StoredBusiness = BusinessPayload & {
    id: number;
    createdAt: string;
    updatedAt: string;
};

export type BusinessSaveInput = Partial<StoredBusiness> & BusinessPayload;