const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "ukk_spp",
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi DB gagal:", err);
    process.exit(1);
  }
  console.log("Koneksi DB berhasil!");

  // Credentials
  const username = "admin";
  const password = "123456";
  const hashedPassword = bcrypt.hashSync(password, 8);

  // Cek apakah user sudah ada
  db.query(
    "SELECT * FROM petugas WHERE username = ?",
    [username],
    (err, rows) => {
      if (err) {
        console.error("Query error:", err);
        db.end();
        process.exit(1);
      }

      if (rows && rows.length > 0) {
        console.log(`User "${username}" sudah ada. Updating password...`);
        // Update password
        db.query(
          "UPDATE petugas SET password = ? WHERE username = ?",
          [hashedPassword, username],
          (err) => {
            if (err) {
              console.error("Update error:", err);
              db.end();
              process.exit(1);
            }
            console.log(
              `\n✓ Password user "${username}" berhasil diperbarui!\n`
            );
            console.log(`Username: ${username}`);
            console.log(`Password: ${password}`);
            console.log(`\nPassword terenkripsi: ${hashedPassword}`);
            db.end();
            process.exit(0);
          }
        );
        return;
      }

      // Insert user baru
      db.query(
        "INSERT INTO petugas (username, password) VALUES (?, ?)",
        [username, hashedPassword],
        (err) => {
          if (err) {
            console.error("Insert error:", err);
            db.end();
            process.exit(1);
          }

          console.log(`\n✓ User berhasil dibuat!\n`);
          console.log(`Username: ${username}`);
          console.log(`Password: ${password}`);
          console.log(`\nPassword terenkripsi sudah disimpan di database.`);

          db.end();
          process.exit(0);
        }
      );
    }
  );
});
