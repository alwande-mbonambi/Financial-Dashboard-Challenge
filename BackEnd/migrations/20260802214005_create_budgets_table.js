/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("budgets", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("CASCADE");
    table.decimal("amount_limit", 12, 2).notNullable();
    table.string("month_year", 7).notNullable(); // Format: "YYYY-MM" (e.g. "2026-08")
    table.timestamps(true, true);

    // Prevent duplicate budgets for the same category in the same month
    table.unique(["user_id", "category_id", "month_year"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("budgets");
};