import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories } from '../../db/schema';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('categories data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns an empty list when there are no categories', async () => {
        await expect(getAllCategories(db)).resolves.toEqual([]);
    });

    it('returns all categories ordered by name', async () => {
        await db.insert(categories).values([
            { name: 'Zeta Zone', description: 'third' },
            { name: 'Adventure', description: 'first' },
            { name: 'Puzzle', description: 'second' },
        ]);

        const all = await getAllCategories(db);

        expect(all).toHaveLength(3);
        expect(all.map((category) => category.name)).toEqual(['Adventure', 'Puzzle', 'Zeta Zone']);
        expect(all[0]).toEqual({
            id: expect.any(Number),
            name: 'Adventure',
        });
    });
});
