import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { publishers } from '../../db/schema';
import type { Database } from './db';
import { getAllPublishers } from './publishers';

describe('publishers data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns an empty list when there are no publishers', async () => {
        await expect(getAllPublishers(db)).resolves.toEqual([]);
    });

    it('returns all publishers ordered by name', async () => {
        await db.insert(publishers).values([
            { name: 'Zeta Works', description: 'third' },
            { name: 'Alpha Forge', description: 'first' },
            { name: 'Beta Lab', description: 'second' },
        ]);

        const all = await getAllPublishers(db);

        expect(all).toHaveLength(3);
        expect(all.map((publisher) => publisher.name)).toEqual([
            'Alpha Forge',
            'Beta Lab',
            'Zeta Works',
        ]);
        expect(all[0]).toEqual({
            id: expect.any(Number),
            name: 'Alpha Forge',
        });
    });
});