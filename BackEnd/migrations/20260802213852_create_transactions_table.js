/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
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