import type {SponsorType} from './types';

export const BUSINESS_SPONSOR_TYPES = [
    'main',
    'sponsor'
] as const satisfies readonly SponsorType[];

export const BUSINESS_SPONSOR_LABEL_KEYS: Record<SponsorType, string> = {
    sponsor: 'admin.businesses.sponsorTypes.sponsor',
    main: 'admin.businesses.sponsorTypes.main'
};

export const BUSINESS_SPONSOR_DESCRIPTION_KEYS: Record<SponsorType, string> = {
    sponsor: 'admin.businesses.sponsorTypeDescriptions.sponsor',
    main: 'admin.businesses.sponsorTypeDescriptions.main'
};