import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getDB } from '$lib/server/db';
import type { StoredEvent } from '$lib/cms/events/types';

type EventRow = {
    slug: string;
    date: string;
    time: string;
    title_el: string;
    title_de: string;
    description_el: string | null;
    description_de: string | null;
    location: string;
    category: string;
    price_members: number | null;
    price_public: number | null;
    sections: string;
    created_at: string;
    updated_at: string;
};

function parseSections(raw: string) {
    try {
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function rowToEvent(row: EventRow): StoredEvent {
    return {
        id: row.slug,
        slug: row.slug,
        title: {
            el: row.title_el || '',
            de: row.title_de || row.title_el || ''
        },
        description: {
            el: row.description_el || '',
            de: row.description_de || row.description_el || ''
        },
        date: row.date || '',
        time: row.time || '',
        location: row.location || '',
        category: row.category || 'general',
        priceMembers: row.price_members,
        pricePublic: row.price_public,
        sections: parseSections(row.sections),
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

export const GET: RequestHandler = async ({ params }) => {
    const db = getDB();

    const row = db
        .prepare(
            `
      SELECT
        slug,
        date,
        time,
        title_el,
        title_de,
        description_el,
        description_de,
        location,
        category,
        price_members,
        price_public,
        sections,
        created_at,
        updated_at
      FROM events
      WHERE slug = ?
      LIMIT 1
      `
        )
        .get(params.slug) as EventRow | undefined;

    if (!row) {
        throw error(404, 'Event not found');
    }

    return json(rowToEvent(row));
};