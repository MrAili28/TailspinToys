import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});

describe('getAllGames filtering', () => {
    let db: Database;
    let categoryA: number;
    let categoryB: number;
    let publisherX: number;
    let publisherY: number;

    beforeEach(async () => {
        db = await createTestDatabase();

        const [catA] = await db
            .insert(categories)
            .values({ name: 'Category A', description: 'a' })
            .returning({ id: categories.id });
        const [catB] = await db
            .insert(categories)
            .values({ name: 'Category B', description: 'b' })
            .returning({ id: categories.id });
        const [catC] = await db
            .insert(categories)
            .values({ name: 'Category C', description: 'c' })
            .returning({ id: categories.id });
        const [pubX] = await db
            .insert(publishers)
            .values({ name: 'Publisher X', description: 'x' })
            .returning({ id: publishers.id });
        const [pubY] = await db
            .insert(publishers)
            .values({ name: 'Publisher Y', description: 'y' })
            .returning({ id: publishers.id });

        categoryA = catA.id;
        categoryB = catB.id;
        publisherX = pubX.id;
        publisherY = pubY.id;

        await db.insert(games).values([
            {
                title: 'Game A1',
                description: 'd',
                starRating: 4,
                categoryId: categoryA,
                publisherId: publisherX,
            },
            {
                title: 'Game A2',
                description: 'd',
                starRating: 4,
                categoryId: categoryA,
                publisherId: publisherY,
            },
            {
                title: 'Game B1',
                description: 'd',
                starRating: 4,
                categoryId: categoryB,
                publisherId: publisherX,
            },
            {
                title: 'Game C1',
                description: 'd',
                starRating: 4,
                categoryId: catC.id,
                publisherId: publisherY,
            },
        ]);
    });

    it('returns all games when no filters are provided', async () => {
        const all = await getAllGames(db);
        expect(all).toHaveLength(4);
    });

    it('returns all games when filter arrays are empty', async () => {
        const all = await getAllGames(db, { categoryIds: [], publisherIds: [] });
        expect(all).toHaveLength(4);
    });

    it('filters by a single category', async () => {
        const filtered = await getAllGames(db, { categoryIds: [categoryA] });
        expect(filtered.map((g) => g.title)).toEqual(['Game A1', 'Game A2']);
    });

    it('combines multiple selected categories with OR', async () => {
        const filtered = await getAllGames(db, { categoryIds: [categoryA, categoryB] });
        expect(filtered.map((g) => g.title)).toEqual(['Game A1', 'Game A2', 'Game B1']);
    });

    it('filters by publisher', async () => {
        const filtered = await getAllGames(db, { publisherIds: [publisherX] });
        expect(filtered.map((g) => g.title)).toEqual(['Game A1', 'Game B1']);
    });

    it('combines category and publisher filters with AND', async () => {
        const filtered = await getAllGames(db, {
            categoryIds: [categoryA],
            publisherIds: [publisherY],
        });
        expect(filtered.map((g) => g.title)).toEqual(['Game A2']);
    });

    it('returns an empty list when no games match the filters', async () => {
        const filtered = await getAllGames(db, {
            categoryIds: [categoryB],
            publisherIds: [publisherY],
        });
        expect(filtered).toEqual([]);
    });
});
