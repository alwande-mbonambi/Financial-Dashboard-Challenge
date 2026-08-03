/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table                                              //to make it look clean i have basically written it line by line like this but (integer('category_id').unsigned().references('id').inTable('categories').onDelete('RESTRICT')) basically means Links every transaction to a category via a foreign key constraint, unsigned() ensures it matches the positive integer format of categories.id, .onDelete('RESTRICT'): Crucial safety rule! The database will block the user from deleting a category if any transactions are linked to it. This forces the application layer to reassign existing transactions before deleting a category.
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');                                  //this is to ensure data integrity and prevent orphaned transactions that reference non-existent categories. It enforces a rule that you cannot delete a category if there are any transactions associated with it, which helps maintain the consistency and reliability of the financial data in the application.
    table.enum('type', ['income', 'expense']).notNullable();
    table.date('date').notNullable();
    table.decimal('amount', 12, 2).notNullable().checkPositive();
    table.string('reference', 150);
    table.text('notes');
    table.enum('payment_method', ['Cash', 'Card', 'EFT']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
 
    table.index('date', 'idx_date');
    table.index('category_id', 'idx_category');
  });
};
 
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transactions');
};