process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const app = require('../src/app');

describe('Summary API (integration)', () => {
  let token;
  let incomeCategoryId;
  let expenseCategoryId;

  beforeAll(async () => {
    await db.migrate.latest();
    token = jwt.sign({ userId: 1, email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  beforeEach(async () => {
    await db('budgets').del();
    await db('transactions').del();
    await db('categories').del();
    [incomeCategoryId] = await db('categories').insert({ name: 'Test Salary', type: 'income' });
    [expenseCategoryId] = await db('categories').insert({ name: 'Test Rent', type: 'expense' });

    await db('transactions').insert([
      { category_id: incomeCategoryId, type: 'income', date: '2026-06-15', amount: 10000, payment_method: 'EFT' },
      { category_id: expenseCategoryId, type: 'expense', date: '2026-06-16', amount: 4000, payment_method: 'Card' },
      // Outside the June window on purpose, to prove the date filter works
      { category_id: incomeCategoryId, type: 'income', date: '2026-05-15', amount: 9000, payment_method: 'EFT' },
    ]);
  });

  test('totals only include transactions within startDate/endDate', async () => {
    const res = await request(app)
      .get('/api/summary')
      .query({ startDate: '2026-06-01', endDate: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.totalIncome).toBe(10000);
    expect(res.body.data.totalExpenses).toBe(4000);
    expect(res.body.data.net).toBe(6000);
  });

  test('marginPct is net / income * 100, rounded to 1 decimal', async () => {
    const res = await request(app)
      .get('/api/summary')
      .query({ startDate: '2026-06-01', endDate: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    // 6000 / 10000 = 60.0%
    expect(res.body.data.marginPct).toBe(60);
  });

  test('a comparison window produces a +100% delta when the prior period was zero', async () => {
    const res = await request(app)
      .get('/api/summary')
      .query({
        startDate: '2026-06-01', endDate: '2026-06-30', compareStartDate: '2026-04-01', compareEndDate: '2026-04-30',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.deltas.income).toBe(100);
  });

  test('with no comparison window given, deltas are all zero', async () => {
    const res = await request(app)
      .get('/api/summary')
      .query({ startDate: '2026-06-01', endDate: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.deltas).toEqual({
      income: 0, expenses: 0, net: 0, margin: 0,
    });
  });
});

describe('Auth API (integration)', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db('users').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('registration succeeds once', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'owner@test.com', password: 'a-real-password' });
    expect(res.status).toBe(201);
  });

  test('a second registration attempt is rejected — single-owner lock', async () => {
    await request(app).post('/api/auth/register').send({ email: 'owner@test.com', password: 'a-real-password' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'someone-else@test.com', password: 'another-password' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('REGISTRATION_CLOSED');
  });

  test('login with correct credentials returns a token', async () => {
    await request(app).post('/api/auth/register').send({ email: 'owner@test.com', password: 'correct-password' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('login with the wrong password is rejected', async () => {
    await request(app).post('/api/auth/register').send({ email: 'owner@test.com', password: 'correct-password' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});