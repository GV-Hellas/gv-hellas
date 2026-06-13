import type {SponsorType} from './types';

export const BUSINESS_SPONSOR_TYPES = [
    'listed',
    'bronze',
    'silver',
    'gold'
] as const satisfies readonly SponsorType[];

export const BUSINESS_SPONSOR_LABEL_KEYS: Record<SponsorType, string> = {
    listed: 'admin.businesses.sponsorTypes.listed',
    bronze: 'admin.businesses.sponsorTypes.bronze',
    silver: 'admin.businesses.sponsorTypes.silver',
    gold: 'admin.businesses.sponsorTypes.gold'
};

export const BUSINESS_SPONSOR_DESCRIPTION_KEYS: Record<SponsorType, string> = {
    listed: 'admin.businesses.sponsorTypeDescriptions.listed',
    bronze: 'admin.businesses.sponsorTypeDescriptions.bronze',
    silver: 'admin.businesses.sponsorTypeDescriptions.silver',
    gold: 'admin.businesses.sponsorTypeDescriptions.gold'
};