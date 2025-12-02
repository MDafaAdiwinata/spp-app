const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
  ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) {
        console.error("MySQL Connection Error:", err.message);
        console.log("Server will start but database queries may fail");
    } else {
        console.log("MySQL Connected!");
    }
});

module.exports = db;
