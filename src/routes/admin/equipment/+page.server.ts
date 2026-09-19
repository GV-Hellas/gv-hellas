import {fail} from '@sveltejs/kit';
import type {Actions, ServerLoad} from '@sveltejs/kit';

import {deleteEquipment, listEquipment} from '$lib/server/cms/equipmentStore';

export const load: ServerLoad = async () => {
    return {
        equipment: await listEquipment()
    };
};

export const actions: Actions = {
    delete: async ({request}) => {
        const form = await request.formData();
        const id = Number(form.get('id'));

        if (!Number.isFinite(id) || id <= 0) {
            return fail(400, {
                ok: false,
                id: null,
                errorKey: 'admin.equipment.errors.invalidId'
            });
        }

        try {
            const deleted = await deleteEquipment(id);

            if (!deleted) {
                return fail(404, {
                    ok: false,
                    id,
                    errorKey: 'admin.equipment.errors.notFound'
                });
            }

            return {
                ok: true,
                id
            };
        } catch {
            return fail(500, {
                ok: false,
                id,
                errorKey: 'admin.equipment.errors.deleteFailed'
            });
        }
    }
};
