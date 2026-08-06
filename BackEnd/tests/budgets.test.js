process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

describe('Budgets API (integration)', () => {
  let token;
  let categoryId;

  beforeAll(async () => {
    await db.migrate.latest();
    token = jwt.sign({ userId: 1, email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(async () => {
    await db('budgets').del();
    await db('transactions').del();
    await db('categories').del();
    [categoryId] = await db('categories').insert({ name: 'Test Groceries', type: 'expense' });
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('setting the overall budget for a year twice updates in place, not a duplicate row', async () => {
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: null, year: 2026, amount: 20000 });
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: null, year: 2026, amount: 25000 });

    const rows = await db('budgets').whereNull('category_id').andWhere({ year: 2026 });
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].amount)).toBe(25000);
  });

  test('a budget for one year does not leak into another year for the same category', async () => {
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: categoryId, year: 2025, amount: 1500 });
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: categoryId, year: 2026, amount: 1800 });

    const res2025 = await request(app).get('/api/budgets').query({ year: 2025 }).set('Authorization', `Bearer ${token}`);
    const res2026 = await request(app).get('/api/budgets').query({ year: 2026 }).set('Authorization', `Bearer ${token}`);

    const budget2025 = res2025.body.data.categoryBudgets.find((b) => b.category_id === categoryId);
    const budget2026 = res2026.body.data.categoryBudgets.find((b) => b.category_id === categoryId);
    expect(Number(budget2025.amount)).toBe(1500);
    expect(Number(budget2026.amount)).toBe(1800);
  });

  test('reconciliation flags category budgets that exceed the overall yearly budget', async () => {
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: null, year: 2026, amount: 1000 });
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: categoryId, year: 2026, amount: 1150 });

    const res = await request(app).get('/api/budgets').query({ year: 2026 }).set('Authorization', `Bearer ${token}`);

    expect(res.body.data.reconciliation.categoryBudgetsTotal).toBe(1150);
    expect(res.body.data.reconciliation.yearlyBudget).toBe(1000);
    expect(res.body.data.reconciliation.overBy).toBe(150);
  });

  test('setting an amount of 0 deletes the budget row rather than storing a zero', async () => {
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: categoryId, year: 2026, amount: 500 });
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: categoryId, year: 2026, amount: 0 });

    const rows = await db('budgets').where({ category_id: categoryId, year: 2026 });
    expect(rows).toHaveLength(0);
  });

  test('DELETE /api/budgets removes a specific year\'s budget', async () => {
    await request(app).put('/api/budgets').set('Authorization', `Bearer ${token}`).send({ category_id: null, year: 2026, amount: 20000 });

    const res = await request(app)
      .delete('/api/budgets')
      .query({ year: 2026 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const rows = await db('budgets').whereNull('category_id').andWhere({ year: 2026 });
    expect(rows).toHaveLength(0);
  });

});