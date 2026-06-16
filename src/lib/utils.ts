import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

const GREEK_RE = /[\u0370-\u03ff]/;

export function hasGreek(value: unknown) {
	return GREEK_RE.test(String(value || ''));
}

export function swissGerman(value: unknown) {
	return String(value || '').replaceAll('ß', 'ss').replaceAll('ẞ', 'SS');
}

export function htmlDecodeBasic(value: unknown) {
	return String(value || '')
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#039;', "'")
		.replaceAll('&#8211;', '–')
		.replaceAll('&#8212;', '—')
		.replaceAll('&#038;', '&');
}

export function stripHtml(value: unknown) {
	return htmlDecodeBasic(value)
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function needsGermanTranslation(el: unknown, de: unknown) {
	const source = String(el || '').trim();
	const target = String(de || '').trim();

	if (!source) return false;
	if (!target) return true;
	if (target === source) return true;
	if (hasGreek(target)) return true;

	return false;
}

export function stripGreekAccents(value: unknown) {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function greeklish(value: unknown) {
	let text = stripGreekAccents(htmlDecodeBasic(value)).toLowerCase();

	const multi: Array<[string, string]> = [
		['αι', 'ai'],
		['ει', 'i'],
		['οι', 'i'],
		['υι', 'i'],
		['ου', 'ou'],
		['αυ', 'av'],
		['ευ', 'ev'],
		['ηυ', 'iv'],
		['μπ', 'b'],
		['ντ', 'd'],
		['γκ', 'g'],
		['γγ', 'g'],
		['τσ', 'ts'],
		['τζ', 'tz']
	];

	for (const [from, to] of multi) {
		text = text.replaceAll(from, to);
	}

	const single: Record<string, string> = {
		'α': 'a',
		'β': 'v',
		'γ': 'g',
		'δ': 'd',
		'ε': 'e',
		'ζ': 'z',
		'η': 'i',
		'θ': 'th',
		'ι': 'i',
		'κ': 'k',
		'λ': 'l',
		'μ': 'm',
		'ν': 'n',
		'ξ': 'x',
		'ο': 'o',
		'π': 'p',
		'ρ': 'r',
		'σ': 's',
		'ς': 's',
		'τ': 't',
		'υ': 'y',
		'φ': 'f',
		'χ': 'ch',
		'ψ': 'ps',
		'ω': 'o'
	};

	return text.replace(/[α-ω]/g, (letter) => single[letter] || letter);
}

export function slugify(input: string) {
	return greeklish(input)
		.normalize('NFKD')
		.replace(/[^\w\s-]/g, '')
		.toLowerCase()
		.replace(/[_\s]+/g, '-')
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}