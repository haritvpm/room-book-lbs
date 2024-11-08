const oracledb = require('oracledb');

// Configure the Oracle DB connection
const dbConfig = {
  user: 'your_username',    // Your Oracle XE username
  password: 'your_password',  // Your Oracle XE password
  connectString: 'localhost/XE'  // Connection string (XE is the default for Oracle Express)
};

// Establish connection pool
async function initializeDB() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log('Successfully connected to Oracle XE');
    return connection;
  } catch (err) {
    console.error('Error connecting to Oracle XE:', err);
    throw err;
  }
}

module.exports = initializeDB;
