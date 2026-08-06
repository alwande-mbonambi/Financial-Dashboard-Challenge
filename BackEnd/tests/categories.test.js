process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

describe('Categories API (integration)', () => {
  let token;

  beforeAll(async () => {
    await db.migrate.latest();
    token = jwt.sign({ userId: 1, email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(async () => {
    await db('budgets').del();
    await db('transactions').del();
    await db('categories').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('creates a category and returns it under { success, data }', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Groceries', type: 'expense' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Groceries');
  });

  test('POST with a missing "type" returns a 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Type' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('deleting a category with zero transactions succeeds', async () => {
    const create = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Unused Category', type: 'expense' });

    const res = await request(app)
      .delete(`/api/categories/${create.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('deleting a category WITH transactions is blocked with 409 + transactionCount', async () => {
    const create = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rent', type: 'expense' });
    const categoryId = create.body.data.id;

    await db('transactions').insert({
      category_id: categoryId,
      type: 'expense',
      date: '2026-06-01',
      amount: 4500,
      payment_method: 'EFT',
    });

    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CATEGORY_HAS_TRANSACTIONS');
    expect(res.body.transactionCount).toBe(1);
  });

  test('reassign-to-other moves transactions and deletes the source category', async () => {
    const create = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dining Out', type: 'expense' });
    const categoryId = create.body.data.id;

    await db('transactions').insert({
      category_id: categoryId,
      type: 'expense',
      date: '2026-06-01',
      amount: 300,
      payment_method: 'Card',
    });

    const res = await request(app)
      .post(`/api/categories/${categoryId}/reassign-to-other`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const stillThere = await db('categories').where({ id: categoryId }).first();
    expect(stillThere).toBeUndefined();

    const otherCategory = await db('categories').where({ name: 'Other', type: 'expense' }).first();
    expect(otherCategory).toBeDefined();
    const movedTransaction = await db('transactions').where({ category_id: otherCategory.id }).first();
    expect(movedTransaction).toBeDefined();
  });

  test('the default "Other" category itself cannot be deleted', async () => {
    const [otherId] = await db('categories').insert({ name: 'Other', type: 'expense' });

    const res = await request(app)
      .delete(`/api/categories/${otherId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});