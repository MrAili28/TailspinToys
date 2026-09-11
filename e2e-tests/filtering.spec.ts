import { test, expect } from '@playwright/test';

test.describe('Game Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display filter controls with category and publisher options', async ({ page }) => {
    await test.step('Verify the filters panel is visible', async () => {
      await expect(page.getByTestId('game-filters')).toBeVisible();
    });

    await test.step('Verify category and publisher checkboxes are present', async () => {
      await expect(page.getByRole('checkbox', { name: 'Strategy' })).toBeVisible();
      await expect(page.getByRole('checkbox', { name: 'CodeForge Studios' })).toBeVisible();
    });
  });

  test('should filter the game list by a single category', async ({ page }) => {
    const visibleCards = page.locator('[data-testid="game-card"]:visible');

    await test.step('Select the Strategy category filter', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
    });

    await test.step('Verify only games in the Strategy category are shown', async () => {
      await expect(visibleCards).toHaveCount(4);
      const categories = await visibleCards.getByTestId('game-category').allTextContents();
      expect(categories.every((category) => category === 'Strategy')).toBe(true);
    });
  });

  test('should filter the game list by a single publisher', async ({ page }) => {
    const visibleCards = page.locator('[data-testid="game-card"]:visible');

    await test.step('Select the CodeForge Studios publisher filter', async () => {
      await page.getByRole('checkbox', { name: 'CodeForge Studios' }).check();
    });

    await test.step('Verify only games from CodeForge Studios are shown', async () => {
      await expect(visibleCards).toHaveCount(6);
      const publisherTags = await visibleCards.getByTestId('game-publisher').allTextContents();
      expect(publisherTags.every((publisher) => publisher === 'CodeForge Studios')).toBe(true);
    });
  });

  test('should combine category and publisher filters', async ({ page }) => {
    const visibleCards = page.locator('[data-testid="game-card"]:visible');

    await test.step('Select a category and a publisher filter', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
      await page.getByRole('checkbox', { name: 'CodeForge Studios' }).check();
    });

    await test.step('Verify only the game matching both filters is shown', async () => {
      await expect(visibleCards).toHaveCount(1);
      await expect(visibleCards.getByTestId('game-title')).toHaveText('DevOps Dominion');
    });

    await test.step('Verify the filtered empty state stays hidden while games are shown', async () => {
      await expect(page.getByTestId('filtered-empty-state')).toBeHidden();
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should reset all filters when the clear filters button is clicked', async ({ page }) => {
    const visibleCards = page.locator('[data-testid="game-card"]:visible');
    const totalCount = await visibleCards.count();

    await test.step('Select a filter and confirm the list narrows', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
      await expect(visibleCards).toHaveCount(4);
    });

    await test.step('Clear filters and confirm all games are shown again', async () => {
      await page.getByTestId('clear-filters-button').click();
      await expect(visibleCards).toHaveCount(totalCount);
      await expect(page.getByRole('checkbox', { name: 'Strategy' })).not.toBeChecked();
    });
  });
});
