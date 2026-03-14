const mysql = require('mysql2');
const db = mysql.createConnection({
  user: 'root',
  password: 'Root@NECTA2025!',
  database: 'nectaassist_db',
  socketPath: '/tmp/mysql.sock' 
});
module.exports = db;
