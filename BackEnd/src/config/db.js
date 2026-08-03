//im creating one centrl connection pool to the MySQL database using Knex.js.  This file will be imported into other files that need to access the database, so they can all share the same connection pool.  This is more efficient than creating a new connection for each query.  The connection details are stored in the knexfile.js configuration file, which is imported here.  The environment variable NODE_ENV is used to determine which environment to use (development, production, etc.).  If NODE_ENV is not set, it defaults to 'development'.  The db object is then exported for use in other files.

const knex = require('knex');                           //this here imports the core Knex library into the file
const knexConfig = require('../../knexfile');              //to import the knexfile.js configuration (with the MySQL connection details, host, user, password, and port live information).   

const environment = process.env.NODE_ENV || 'development';    // Pick environment (defaults to 'development')

const db = knex(knexConfig[environment]);                     //// Initialize the Knex instance with environment settings

module.exports = db;