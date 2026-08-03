/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('budgets', (table) => {
    table.increments('id').primary();
    table
      .integer('category_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('categories');
    table.integer('year').notNullable();
    table.decimal('amount', 12, 2).notNullable();
 
    table.unique(['category_id', 'year'], 'uniq_category_year');
  });
};
 
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('budgets');
};
 