export type HomepageLang = 'el' | 'de';

export type HomepageLocalizedText = Record<HomepageLang, string>;

export type HomepageSlide = {
    id: number;
    enabled: boolean;
    sortOrder: number;
    title: HomepageLocalizedText;
    description: HomepageLocalizedText;
    alt: HomepageLocalizedText;
    image480: string;
    image960: string;
    image1920: string;
    imageFallback: string;
    createdAt: string;
    updatedAt: string;
};

export type HomepageSlideInput = Omit<HomepageSlide, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: number;
};
