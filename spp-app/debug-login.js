const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "ukk_spp"
});

db.connect((err) => {
    if (err) {
        console.error("DB Connection error:", err);
        process.exit(1);
    }
    console.log("DB Connected!\n");

    // Cek user admin
    db.query("SELECT * FROM petugas WHERE username='admin'", (err, rows) => {
        if (err) {
            console.error("Query error:", err);
            db.end();
            process.exit(1);
        }

        if (!rows || rows.length === 0) {
            console.log("❌ User 'admin' tidak ada di database!");
            db.end();
            process.exit(1);
        }

        const user = rows[0];
        console.log("✓ User ditemukan:");
        console.log("  ID:", user.id);
        console.log("  Username:", user.username);
        console.log("  Password (hashed):", user.password);
        console.log("  Password panjang:", user.password ? user.password.length : "NULL");

        // Test compareSync
        console.log("\n--- Test bcrypt.compareSync ---");
        const testPassword = "123456";
        try {
            const match = bcrypt.compareSync(testPassword, user.password);
            console.log(`Hasil: ${match ? '✓ PASSWORD COCOK!' : '❌ PASSWORD TIDAK COCOK'}`);
        } catch (e) {
            console.error("❌ Error saat compareSync:", e.message);
        }

        db.end();
        process.exit(0);
    });
});
