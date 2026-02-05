import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { credit_allocations } from '$lib/server/db/schema';

export async function GET() {
    try {
        const res = await db.select().from(credit_allocations).limit(1);
        return json({ status: 'ok', data: res });
    } catch (e: any) {
        return json({ status: 'error', message: e.message }, { status: 500 });
    }
}
