import type {EventPayload, StoredEvent} from '$lib/cms/events/types';
import {EVENT_CATEGORIES} from '$lib/cms/events/schema';
import {supabase} from '$lib/server/supabaseClient';

type EventRow = {
    slug: string;
    date: string | null;
    time: string | null;
    title_el: string | null;
    title_de: string | null;
    description_el: string | null;
    description_de: string | null;
    location: string | null;
    category: string | null;
    price_members: number | null;
    price_public: number | null;
    sections: unknown;
    created_at: string | null;
    updated_at: string | null;
};

function safeSlug(slug: string) {
    return slug
        .trim()
        .replace(/\.json$/i, '')
        .replaceAll('/', '')
        .replaceAll('\\', '');
}

function nullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '') return null;

    const n = Number(value);

    return Number.isFinite(n) ? n : null;
}

function isEventCategory(value: unknown): value is EventPayload['category'] {
    return (
        typeof value === 'string' &&
        (EVENT_CATEGORIES as readonly string[]).includes(value)
    );
}

function normalizeCategory(value: unknown): EventPayload['category'] {
    return isEventCategory(value) ? value : 'general';
}

function normalizeSections(value: unknown): EventPayload['sections'] {
    if (Array.isArray(value)) {
        return value as EventPayload['sections'];
    }

    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed as EventPayload['sections'];
            }
        } catch {
            return [];
        }
    }

    return [];
}

function rowToStoredEvent(row: EventRow): StoredEvent {
    const now = new Date().toISOString();

    return {
        id: row.slug,
        slug: row.slug,
        title: {
            el: row.title_el || '',
            de: row.title_de || row.title_el || ''
        },
        description: {
            el: row.description_el || '',
            de: row.description_de || ''
        },
        date: row.date || '',
        time: row.time || '',
        location: row.location || '',
        category: normalizeCategory(row.category),
        priceMembers: nullableNumber(row.price_members),
        pricePublic: nullableNumber(row.price_public),
        sections: normalizeSections(row.sections),
        createdAt: row.created_at || now,
        updatedAt: row.updated_at || now
    };
}

function eventToRow(event: EventPayload, slug: string) {
    return {
        slug,
        date: event.date || '',
        time: event.time || '',
        title_el: event.title.el || '',
        title_de: event.title.de || event.title.el || '',
        description_el: event.description.el || '',
        description_de: event.description.de || '',
        location: event.location || '',
        category: normalizeCategory(event.category),
        price_members: event.priceMembers,
        price_public: event.pricePublic,
        sections: event.sections || [],
        updated_at: new Date().toISOString()
    };
}

function formatSupabaseError(context: string, error: {message: string}) {
    return new Error(`${context}: ${error.message}`);
}

export async function getEvent(slug: string): Promise<StoredEvent | null> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) return null;

    const {data, error} = await supabase
        .from('events')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle<EventRow>();

    if (error) {
        throw formatSupabaseError(`Loading event "${cleanSlug}" failed`, error);
    }

    return data ? rowToStoredEvent(data) : null;
}

export async function getEventBySlug(slug: string): Promise<StoredEvent | null> {
    return getEvent(slug);
}

export async function saveEvent(event: EventPayload, slug: string): Promise<StoredEvent> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) {
        throw new Error('Invalid event slug');
    }

    const row = eventToRow(event, cleanSlug);

    const {data, error} = await supabase
        .from('events')
        .upsert(row, {
            onConflict: 'slug'
        })
        .select('*')
        .single<EventRow>();

    if (error) {
        throw formatSupabaseError(`Saving event "${cleanSlug}" failed`, error);
    }

    return rowToStoredEvent(data);
}

export async function listEvents(): Promise<StoredEvent[]> {
    const {data, error} = await supabase
        .from('events')
        .select('*')
        .order('date', {
            ascending: false
        })
        .order('time', {
            ascending: false
        });

    if (error) {
        throw formatSupabaseError('Listing events failed', error);
    }

    return (data || []).map((row) => rowToStoredEvent(row as EventRow));
}

export async function deleteEvent(slug: string): Promise<boolean> {
    const cleanSlug = safeSlug(slug);

    if (!cleanSlug) return false;

    const {error, count} = await supabase
        .from('events')
        .delete({
            count: 'exact'
        })
        .eq('slug', cleanSlug);

    if (error) {
        throw formatSupabaseError(`Deleting event "${cleanSlug}" failed`, error);
    }

    return (count ?? 0) > 0;
}