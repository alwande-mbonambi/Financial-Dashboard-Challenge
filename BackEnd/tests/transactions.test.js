process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

describe('Transactions API (integration)', () => {
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
    [categoryId] = await db('categories').insert({ name: 'Test Salary', type: 'income' });
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('rejects a negative amount with 400 (the bug we specifically fixed)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: -500, type: 'expense', date: '2026-06-01', category_id: categoryId, payment_method: 'Cash',
      });

    expect(res.status).toBe(400);
  });

  test('rejects a category_id that does not exist', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500, type: 'income', date: '2026-06-01', category_id: 999999, payment_method: 'EFT',
      });

    expect(res.status).toBe(400);
  });

  test('creates a transaction with valid data', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 12000, type: 'income', date: '2026-06-15', category_id: categoryId, payment_method: 'EFT', reference: 'June salary',
      });

    expect(res.status).toBe(201);
    expect(Number(res.body.data.amount)).toBe(12000);
  });

  test('GET /:id on a nonexistent transaction returns 404', async () => {
    const res = await request(app)
      .get('/api/transactions/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('DELETE removes the transaction, subsequent GET 404s', async () => {
    const create = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100, type: 'income', date: '2026-06-01', category_id: categoryId, payment_method: 'Cash',
      });

    const del = await request(app)
      .delete(`/api/transactions/${create.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const get = await request(app)
      .get(`/api/transactions/${create.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  test('payment-split percentages always sum to exactly 100', async () => {
    await db('transactions').insert([
      { category_id: categoryId, type: 'income', date: '2026-06-01', amount: 100, payment_method: 'Cash' },
      { category_id: categoryId, type: 'income', date: '2026-06-02', amount: 100, payment_method: 'Card' },
      { category_id: categoryId, type: 'income', date: '2026-06-03', amount: 100, payment_method: 'EFT' },
    ]);

    const res = await request(app)
      .get('/api/transactions/payment-split')
      .query({ startDate: '2026-06-01', endDate: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const total = res.body.data.split.reduce((sum, m) => sum + m.pct, 0);
    expect(total).toBe(100);
  });

  test('payment-split returns all three methods even when only one was used', async () => {
    await db('transactions').insert({
      category_id: categoryId, type: 'income', date: '2026-06-01', amount: 100, payment_method: 'Cash',
    });

    const res = await request(app)
      .get('/api/transactions/payment-split')
      .query({ startDate: '2026-06-01', endDate: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    const names = res.body.data.split.map((m) => m.name).sort();
    expect(names).toEqual(['Card', 'Cash', 'EFT']);
  });
});