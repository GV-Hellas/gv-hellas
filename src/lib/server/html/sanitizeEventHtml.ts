import sanitizeHtml from 'sanitize-html';

export function sanitizeEventHtml(html: string) {
    return sanitizeHtml(html || '', {
        allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a'],
        allowedAttributes: {
            a: ['href', 'target', 'rel']
        },
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', {
                target: '_blank',
                rel: 'noopener noreferrer'
            })
        }
    });
}