import {json} from '@sveltejs/kit';
import {listGallery} from '$lib/server/cms/galleryStore';

export async function GET() {
    return json(await listGallery());
}
