require("dotenv").config(); //this loads the environment variables from the .env file into process.env, so that we can access them in our code. 

module.exports = {
  development: {
    client: "mysql2", //this is the datatbase driver that comes from the npm package, knex needs this to know which database driver to use, in this case mysql2 is the driver for MySQL database. Otherwise knex will not know how to connect to the database and will throw an error.
    connection: {
      host: process.env.DB_HOST || "127.0.0.1", //this is safe default for local IP but initially tries .env file first and falls back to hardcoded if value is not found
      port: process.env.DB_PORT || 3307,        //this is safe default for port ''
      user: process.env.DB_USER,                //  from .env
      password: process.env.DB_PASSWORD,        //  '' 
      database: process.env.DB_NAME,            //  ''
      dateStrings: true,                                //setting date to show in normal YYYY/MM/DD
    },
  
    migrations: { directory: "./migrations" },   //this is for knex to know where to find the migration files, which are used to create and modify the database schema. The migrations folder is located in the same directory as this knexfile.js file.
    seeds: { directory: "./seeds" },        //this is for knex to know where to find the seed files, which are used to populate the database with initial data. The seeds folder is located in the same directory as this knexfile.js file.
  },


  // this here is for testing purposes, so that we can run tests on a separate database without affecting the development database. The test database is also created in the same MySQL server as the development database, but with a different name. The test database is also configured to use the same migrations and seeds as the development database, so that we can easily set up and tear down the test database before and after each test run.
  test: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME_TEST || "financial_dashboard_test",
      dateStrings: true,
    },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },


//process.env is a global object that provides access to the environment variables of the current process. In this case, i'm using it to access the database connection details that are stored in the .env file. The dotenv package loads these variables into process.env when the application starts, allowing us to use them throughout our code without hardcoding sensitive information like database credentials.



production: {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
  },
  migrations: { directory: "./migrations" },
  seeds: { directory: "./seeds" },
},

};