/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {            //this function
  // 1. .del() clears all eisting rows ifrom a specified table . the purpose of it here it being in this order is to clear existing data in reverse dependency order to avoid foreign key errors. transactions and budgets both depend on categories.id.  If i tried to delete categories first, MySQL would throw a foreign key error because transactions still reference those categories.  Deleting budgets and transactions first clears out child records so categories can be deleted cleanly.
  await knex('budgets').del();
  await knex('transactions').del();
  await knex('categories').del();

  // 2. setting default categories
  //Income Categories 
  const [salaryId] = await knex('categories').insert({ name: 'Salary', type: 'income' });                //im inserting new category rows using knex('categories').insert(...) and i need to use const [...] here specifically because these variables will be needed by transactions and budgets to identify the category ids (foreign key)
  const [freelanceId] = await knex('categories').insert({ name: 'Freelance', type: 'income' });
  const [investmentsId] = await knex('categories').insert({ name: 'Investments', type: 'income' });

  const [Test] = await knex('categories').insert({ name: 'Test', type: 'income' });  //i want to test the  deletion of  a category with a transaction with it

  //Expense Categories 
  const [rentId] = await knex('categories').insert({ name: 'Rent & Housing', type: 'expense' });
  const [groceriesId] = await knex('categories').insert({ name: 'Groceries', type: 'expense' });
  const [utilitiesId] = await knex('categories').insert({ name: 'Utilities & Bills', type: 'expense' });
  const [diningId] = await knex('categories').insert({ name: 'Dining Out', type: 'expense' });
  const [transportId] = await knex('categories').insert({ name: 'Transport & Fuel', type: 'expense' });

  
  await knex('budgets').insert([           //3. over here im seeding the overall yearly budgets for 2024, 2025, 2026 so i can have dense population of data in my tables
    //2024 Budgets
    { category_id: null, year: 2024, amount: 200000.00 }, 
    { category_id: rentId, year: 2024, amount: 84000.00 },
    { category_id: groceriesId, year: 2024, amount: 36000.00 },
    { category_id: utilitiesId, year: 2024, amount: 18000.00 },
    { category_id: diningId, year: 2024, amount: 12000.00 },
    { category_id: transportId, year: 2024, amount:24000.00 },

    //2025 Budgets
    { category_id: null, year: 2025, amount: 220000.00 },
    { category_id: rentId, year: 2025, amount: 90000.00 },
    { category_id: groceriesId, year: 2025, amount: 42000.00 },
    { category_id: utilitiesId, year: 2025, amount: 21000.00 },
    { category_id: diningId, year: 2025, amount: 15000.00 },
    { category_id: transportId, year: 2025, amount: 27000.00 },

    //2026 Budgets 
    { category_id: null, year: 2026, amount: 250000.00 }, 
    { category_id: rentId, year: 2026, amount: 96000.00 },
    { category_id: groceriesId, year: 2026, amount: 48000.00 },
    { category_id: utilitiesId, year: 2026, amount: 24000.00 },
    { category_id: diningId, year: 2026, amount: 18000.00 },
    { category_id: transportId, year: 2026, amount: 30000.00 }
  ]);

  // 4. seeded transactions for 2024, 2025, 2026
  await knex('transactions').insert([

    // 2024 
    {
      category_id: salaryId,
      type: 'income',
      date: '2024-06-25',
      amount: 25000.00,
      reference: 'June Salary',
      notes: '2024 base salary',
      payment_method: 'EFT'
    },
    {
      category_id: rentId,
      type: 'expense',
      date: '2024-07-01',
      amount: 7000.00,
      reference: 'July Rent 2024',
      notes: 'Old lease rate',
      payment_method: 'EFT'
    },
    {
      category_id: groceriesId,
      type: 'expense',
      date: '2024-08-15',
      amount: 2800.00,
      reference: 'Mid-month Groceries',
      notes: 'Checkers run',
      payment_method: 'Card'
    },
    {
      category_id: transportId,
      type: 'expense',
      date: '2024-11-10',
      amount: 500.00,
      reference: 'Fuel',
      notes: '2024 fuel rates',
      payment_method: 'Cash'
    },

    // 2025 
    {
      category_id: salaryId,
      type: 'income',
      date: '2025-03-25',
      amount: 28000.00,
      reference: 'March Salary',
      notes: 'Annual raise applied',
      payment_method: 'EFT'
    },
    {
      category_id: freelanceId,
      type: 'income',
      date: '2025-05-12',
      amount: 5000.00,
      reference: 'Logo Design Project',
      notes: 'Freelance client invoice',
      payment_method: 'EFT'
    },
    {
      category_id: rentId,
      type: 'expense',
      date: '2025-06-01',
      amount: 7500.00,
      reference: 'June Rent 2025',
      notes: 'Lease escalation',
      payment_method: 'EFT'
    },
    {
      category_id: diningId,
      type: 'expense',
      date: '2025-09-20',
      amount: 450.00,
      reference: 'Birthday Dinner',
      notes: 'Celebration out',
      payment_method: 'Card'
    },
    {
      category_id: utilitiesId,
      type: 'expense',
      date: '2025-12-05',
      amount: 1600.00,
      reference: 'Dec Utilities',
      notes: 'Municipality winter charges',
      payment_method: 'EFT'
    },

    // 2026 
    {
      category_id: salaryId,
      type: 'income',
      date: '2026-07-25',
      amount: 32000.00,
      reference: 'July Salary',
      notes: 'July salary deposit from Tech Corp',
      payment_method: 'EFT'
    },
    {
      category_id: freelanceId,
      type: 'income',
      date: '2026-07-28',
      amount: 8500.00,
      reference: 'Web Dev Freelance Project',
      notes: 'Final payment for e-commerce client UI',
      payment_method: 'EFT'
    },
    {
      category_id: investmentsId,
      type: 'income',
      date: '2026-08-01',
      amount: 1200.00,
      reference: 'Q2 Dividend Payment',
      notes: 'Index fund payouts',
      payment_method: 'EFT'
    },
    {
      category_id: rentId,
      type: 'expense',
      date: '2026-08-01',
      amount: 8000.00,
      reference: 'August Apartment Rent',
      notes: 'Monthly lease payment',
      payment_method: 'EFT'
    },
    {
      category_id: groceriesId,
      type: 'expense',
      date: '2026-08-02',
      amount: 1450.50,
      reference: 'Weekly Grocery Run',
      notes: 'Woolworths fresh produce & staples',
      payment_method: 'Card'
    },
    {
      category_id: utilitiesId,
      type: 'expense',
      date: '2026-08-02',
      amount: 1850.00,
      reference: 'Eskom & Water Bill',
      notes: 'August municipal services',
      payment_method: 'EFT'
    },
    {
      category_id: diningId,
      type: 'expense',
      date: '2026-08-02',
      amount: 380.00,
      reference: 'Dinner with Team',
      notes: 'Burger & drinks',
      payment_method: 'Card'
    },
    {
      category_id: transportId,
      type: 'expense',
      date: '2026-08-03',
      amount: 650.00,
      reference: 'Fuel Top-up',
      notes: 'Full tank at Shell',
      payment_method: 'Cash'
    },

    {                      //testing transaction for category deletion
     category_id: Test,
      type: 'income',
      date: '2026-08-02',
      amount: 380.00,
      reference: 'Dinner with Team',
      notes: 'Burger & drinks',
      payment_method: 'Card' 
    }
  ]);
};