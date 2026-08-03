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
      .nullable()                                             // this is to say that a buget category can be left unset or without one
      .references('id')
      .inTable('categories');
    table.integer('year').notNullable();                     //this is to say that the overall budget set for the year is mandatory
    table.decimal('amount', 12, 2).notNullable();
 
    table.unique(['category_id', 'year'], 'uniq_category_year');     //this prevents setting multiple distinct targets for the same category in the same year
  });
};
 
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('budgets');
};
 


//nullable(): This is the key trick of our schema design, Case A (Specific Category Budget): If category_id = 3 (e.g., "Marketing"), this row sets a spending target specifically for Marketing.Case B (Overall Business Budget): If category_id = NULL, this row sets a target for the entire business as a whole!

//Example:
//
//id	    category_id	    year    	amount	          What does this record mean?
//1	            NULL	    2026	   1000000.00	      Overall Target: Total business spending budget for 2026 is R1,000,000.
//2	         5 (Rent)	    2026        120000.00	      Category Target: Rent budget for 2026 is R120,000.
//3          8 (Software)   2026         30000.00         Category Target: Software budget for 2026 is R30,000.