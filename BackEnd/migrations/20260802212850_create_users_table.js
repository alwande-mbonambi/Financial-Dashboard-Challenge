/**
 * @param { import("knex").Knex } knex                      //this is a JSDoc comment that provides type information for the knex parameter, which is an instance of the Knex query builder. It allows for better code completion and type checking in editors that support JSDoc. Without it , the editor may not recognize the methods and properties of the knex object, making it harder to write and maintain the code.
 * @returns { Promise<void> }
 */
exports.up = function (knex) {                                   //exports.up defines the changes to apply to the database when running npx knex migrate:latest .this is where tables, columns, constraints, and indexes are created
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());           //defaultTo(knex.fn.now()) basically means that if no value is provided for the created_at column when a new user record is inserted, the database will automatically set it to the current timestamp at the moment of insertion. This ensures that every user record has a creation timestamp, which can be useful for tracking when users were added to the system.
  }); 
};
 
/**
 * @param { import("knex").Knex } knex                             //ive written it here the second time because a Knex migration file exports two separate functions: up and down, each function gets its own JSDoc comment to provide type information for the knex parameter. This helps maintain clarity and consistency in the code, especially when working with multiple functions that interact with the database.
 * @returns { Promise<void> }
 */
exports.down = function (knex) {                                    //exports.down deefines how to undo whatever i did. If you ever run npx knex migrate:rollback and restore the database to its previous state safely
  return knex.schema.dropTableIfExists('users');
};