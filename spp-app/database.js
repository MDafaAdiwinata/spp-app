const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false },
});

db.getConnection((err, conn) => {
  if (err) {
    console.error("DB Connection error:", err);
  } else {
    console.log("DB Connected!");
    conn.release();
  }
});

module.exports = db;