/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.enum('type', ['income', 'expense']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
 
    table.unique(['name', 'type'], 'uniq_category');
  });
};
 
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('categories');
};
 