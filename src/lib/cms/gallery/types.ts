export type GalleryMediaType = 'image' | 'video';
export type GalleryLang = 'el' | 'de';

export type GalleryLocalizedText = Record<GalleryLang, string>;

export type GalleryTag = {
    id: number;
    name: GalleryLocalizedText;
};

export type GalleryItem = {
    id: string;
    type: GalleryMediaType;
    src480: string;
    src960: string;
    videoSrc: string;
    alt: GalleryLocalizedText;
    tags: GalleryTag[];
    year: number | null;
    width: number | null;
    height: number | null;
    createdAt?: string;
    updatedAt?: string;
};
