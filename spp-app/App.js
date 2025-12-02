const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");

const app = express();
app.set("view engine", "ejs");
// Set views directory (project uses `View`) and public assets directory (`Public`)
app.set("views", __dirname + "/View");
app.use(express.static(__dirname + "/Public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "spp-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Koneksi database
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "ukk_spp",
});

db.connect((err) => {
  if (err) {
    console.error("DB Connection error:", err);
  } else {
    console.log("DB Connected!");
  }
});

// Middleware cek login
function cekLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// ======================
// HALAMAN LOGIN
// ======================
app.get("/", (req, res) => {
  // jika sudah login, langsung ke dashboard
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login");
});

// ======================
// PROSES LOGIN
// ======================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Pastikan username & password diisi
  if (!username || !password) {
    req.session.destroy(() => {});
    return res.send("Harap isi username dan password!");
  }

  db.query(
    "SELECT * FROM petugas WHERE username = ? LIMIT 1",
    [username],
    (err, rows) => {
      if (err) {
        console.error("DB Error:", err);
        req.session.destroy(() => {});
        return res.send("Terjadi kesalahan server!");
      }

      // Username tidak ditemukan
      if (!rows || rows.length === 0) {
        req.session.destroy(() => {});
        return res.send("Username tidak ditemukan!");
      }

      const user = rows[0];
      const storedPassword = user.password;

      let passwordValid = false;

      // Jika password di DB berupa bcrypt
      if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
        try {
          passwordValid = bcrypt.compareSync(password, storedPassword);
        } catch (e) {
          console.error("bcrypt error:", e);
          passwordValid = false;
        }
      } else {
        // Jika password masih plaintext
        passwordValid = password === storedPassword;
      }

      // Password salah
      if (!passwordValid) {
        req.session.destroy(() => {});
        return res.send("Password salah!");
      }

      // Login OK → simpan session
      req.session.user = {
        id: user.id_petugas,
        username: user.username,
        nama: user.nama_petugas,
        level: user.level
      };

      console.log("User logged in:", req.session.user);

      return res.redirect("/dashboard");
    }
  );
});

// Dashboard
app.get("/dashboard", cekLogin, (req, res) => {
  // Total Siswa
  db.query("SELECT COUNT(*) AS total FROM siswa", (err1, rows1) => {
    const totalSiswa = rows1?.[0]?.total || 0;

    // Total SPP
    db.query("SELECT COUNT(*) AS total FROM spp", (err2, rows2) => {
      const totalSPP = rows2?.[0]?.total || 0;

      // Total pembayaran
      db.query(
        "SELECT SUM(jumlah_bayar) AS total FROM pembayaran",
        (err3, rows3) => {
          const totalBayar = rows3?.[0]?.total || 0;

          const totalTunggakan = 0;

          // ⛔ Pastikan totalSPP dikirim ke EJS
          res.render("dashboard", {
            user: req.session.user,
            totalSiswa,
            totalSPP,
            totalBayar,
            totalTunggakan,
          });
        }
      );
    });
  });
});



// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Logout gagal!");
    }
    res.redirect("/");
  });
});

// CRUD Siswa
app.get("/siswa", cekLogin, (req, res) => {
  // select using aliases so field names match the template (lowercase)
  db.query(
    "SELECT id, NIS AS nis, Nama AS nama, Kelas AS kelas FROM siswa",
    (err, rows) => {
      if (err) {
        console.error("Query siswa error:", err);
        rows = [];
      }
      res.render("siswa", { data: rows || [] });
    }
  );
});

app.post("/siswa/add", cekLogin, (req, res) => {
  const { nis, nama, kelas } = req.body;
  console.log("[siswa/add] Received body:", req.body);
  if (!nis || !nama || !kelas) {
    console.warn("[siswa/add] Incomplete data, aborting insert");
    return res.send("Data tidak lengkap!");
  }

  // use actual column names in table (NIS, Nama, Kelas)
  db.query(
    "INSERT INTO siswa (NIS, Nama, Kelas) VALUES (?, ?, ?)",
    [nis, nama, kelas],
    (err, result) => {
      if (err) {
        console.error("Insert siswa error:", err);
        return res.status(500).send("Gagal menambah siswa!");
      }

      console.log(
        "[siswa/add] Insert OK, insertId:",
        result && result.insertId
      );

      // optional: fetch the newly inserted row and log it for diagnosis
      db.query(
        "SELECT * FROM siswa WHERE id = ? OR nis = ? OR nisn = ? LIMIT 1",
        [result.insertId, nis, nis],
        (err2, rows2) => {
          if (err2) {
            console.error("[siswa/add] Post-insert select error:", err2);
          } else {
            console.log("[siswa/add] Post-insert row:", rows2 && rows2[0]);
          }
          return res.redirect("/siswa");
        }
      );
    }
  );
});

// Input SPP
app.get("/spp", cekLogin, (req, res) => {
  db.query("SELECT * FROM spp", (err, rows) => {
    if (err) {
      console.error("Query spp error:", err);
      rows = [];
    }
    res.render("spp", { data: rows || [] });
  });
});

app.post("/spp/add", cekLogin, (req, res) => {
  const { tahun, nominal } = req.body;
  if (!tahun || !nominal) {
    return res.send("Data tidak lengkap!");
  }
  db.query(
    "INSERT INTO spp (tahun, nominal) VALUES (?, ?)",
    [tahun, nominal],
    (err) => {
      if (err) {
        console.error("Insert spp error:", err);
        return res.send("Gagal menambah SPP!");
      }
      res.redirect("/spp");
    }
  );
});

// Pembayaran
app.get("/pembayaran", cekLogin, (req, res) => {
  db.query("SELECT * FROM siswa", (err, siswa) => {
    if (err) {
      console.error("Query siswa error:", err);
      siswa = [];
    }
    db.query("SELECT * FROM spp", (err, spp) => {
      if (err) {
        console.error("Query spp error:", err);
        spp = [];
      }
      res.render("pembayaran", { siswa: siswa || [], spp: spp || [] });
    });
  });
});

app.post("/pembayaran/add", cekLogin, (req, res) => {
  const { id_siswa, id_spp, jumlah_bayar } = req.body;
  if (!id_siswa || !id_spp || !jumlah_bayar) {
    return res.send("Data tidak lengkap!");
  }
  db.query(
    "INSERT INTO pembayaran (id_siswa, id_spp, tanggal, jumlah_bayar) VALUES (?, ?, CURDATE(), ?)",
    [id_siswa, id_spp, jumlah_bayar],
    (err) => {
      if (err) {
        console.error("Insert pembayaran error:", err);
        return res.send("Gagal memproses pembayaran!");
      }
      res.send("Pembayaran berhasil! <a href='/pembayaran'>Kembali</a>");
    }
  );
});

app.listen(3000, () => console.log("Server berjalan di http://localhost:3000"));
