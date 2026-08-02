/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table.increments("id").primary(); 
    table.string("username", 50).notNullable().unique();
    table.string("email", 100).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.timestamps(true, true); // stamps to see when created at and updated at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};