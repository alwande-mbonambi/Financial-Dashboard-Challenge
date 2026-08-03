/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.enum('type', ['income', 'expense']).notNullable();              //this here is an enum column that restricts the values to either 'income' or 'expense'. This ensures that each category is clearly defined as either an income category or an expense category, which is important for accurate financial tracking and reporting. By enforcing this constraint at the database level, it can prevent invalid data from being inserted into the categories table, which helps maintain data integrity and consistency across the application.
    table.timestamp('created_at').defaultTo(knex.fn.now());
 
    table.unique(['name', 'type'], 'uniq_category');                       //this creates a composite unique index named uniq_category. This allows the user to have an for an eample "Entertainment" expense and an "Entertainment" income (if needed), but prevents duplicate "Rent" expense entries.
  });
};
 
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('categories');
};
 