export type Lang = 'el' | 'de';

export type LocalizedText = Record<Lang, string>;

export type LinkLogoVariants = {
    webp?: string;
    jpg?: string;
};

export type LinkPayload = {
    name: LocalizedText;
    descriptionHtml: LocalizedText;
    url: string;
    logo?: string;
    logoVariants?: LinkLogoVariants;
};

export type StoredLink = LinkPayload & {
    id: number;
    createdAt: string;
    updatedAt: string;
};

export type LinkSaveInput = {
    id?: number;
    name: LocalizedText;
    descriptionHtml?: LocalizedText;
    url: string;
    logo?: string;
    logoVariants?: LinkLogoVariants;
};