import type {EventPayload, StoredEvent} from '$lib/cms/events/types';
import {EVENT_CATEGORIES} from '$lib/cms/events/schema';
import {getSql} from '$lib/server/neonClient';

type EventRow = { slug:string; date:string|null; time:string|null; end_time:string|null; title_el:string|null; title_de:string|null; description_el:string|null; description_de:string|null; location:string|null; category:string|null; price_members:number|null; price_public:number|null; sections:unknown; created_at:string|null; updated_at:string|null };

function safeSlug(slug:string){return slug.trim().replace(/\.json$/i,'').replaceAll('/','').replaceAll('\\','')}
function nullableNumber(value:unknown){if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
function normalizeCategory(value:unknown):EventPayload['category']{return typeof value==='string'&&(EVENT_CATEGORIES as readonly string[]).includes(value)?value as EventPayload['category']:'general'}
function normalizeSections(value:unknown):EventPayload['sections']{if(Array.isArray(value))return value as EventPayload['sections'];if(typeof value==='string'&&value.trim()){try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed as EventPayload['sections']:[]}catch{return []}}return []}
function rowToStoredEvent(row:EventRow):StoredEvent{const now=new Date().toISOString();return{id:row.slug,slug:row.slug,title:{el:row.title_el||'',de:row.title_de||row.title_el||''},description:{el:row.description_el||'',de:row.description_de||''},date:row.date||'',time:row.time||'',endTime:row.end_time||'',location:row.location||'',category:normalizeCategory(row.category),priceMembers:nullableNumber(row.price_members),pricePublic:nullableNumber(row.price_public),sections:normalizeSections(row.sections),createdAt:row.created_at||now,updatedAt:row.updated_at||now}}

export async function getEvent(slug:string):Promise<StoredEvent|null>{const clean=safeSlug(slug);if(!clean)return null;const rows=await getSql()`SELECT * FROM events WHERE slug=${clean} LIMIT 1`;return rows[0]?rowToStoredEvent(rows[0] as EventRow):null}
export const getEventBySlug=getEvent;
export async function saveEvent(event:EventPayload,slug:string):Promise<StoredEvent>{const clean=safeSlug(slug);if(!clean)throw new Error('Invalid event slug');const sections=JSON.stringify(event.sections||[]);const rows=await getSql()`
 INSERT INTO events (slug,date,time,end_time,title_el,title_de,description_el,description_de,location,category,price_members,price_public,sections,updated_at)
 VALUES (${clean},${event.date||''},${event.time||''},${event.endTime||''},${event.title.el||''},${event.title.de||event.title.el||''},${event.description.el||''},${event.description.de||''},${event.location||''},${normalizeCategory(event.category)},${event.priceMembers},${event.pricePublic},${sections}::jsonb,NOW())
 ON CONFLICT (slug) DO UPDATE SET date=EXCLUDED.date,time=EXCLUDED.time,end_time=EXCLUDED.end_time,title_el=EXCLUDED.title_el,title_de=EXCLUDED.title_de,description_el=EXCLUDED.description_el,description_de=EXCLUDED.description_de,location=EXCLUDED.location,category=EXCLUDED.category,price_members=EXCLUDED.price_members,price_public=EXCLUDED.price_public,sections=EXCLUDED.sections,updated_at=NOW()
 RETURNING *`;return rowToStoredEvent(rows[0] as EventRow)}
export async function listEvents():Promise<StoredEvent[]>{const rows=await getSql()`SELECT * FROM events ORDER BY date DESC NULLS LAST,time DESC NULLS LAST`;return rows.map(r=>rowToStoredEvent(r as EventRow))}
export async function deleteEvent(slug:string):Promise<boolean>{const clean=safeSlug(slug);if(!clean)return false;const rows=await getSql()`DELETE FROM events WHERE slug=${clean} RETURNING slug`;return rows.length>0}
