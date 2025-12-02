const express = require("express");
const path = require("path");
const db = require("./spp-app/database");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "spp-app/Public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "spp-app/View"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "spp-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware cek login
function cekLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

// ----------------------------------------------------------
// 1. ROUTE GET (MENAMPILKAN HALAMAN)
// ----------------------------------------------------------

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/dashboard", cekLogin, (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM siswa", (err1, rows1) => {
    const totalSiswa = rows1?.[0]?.total || 0;

    db.query("SELECT COUNT(*) AS total FROM spp", (err2, rows2) => {
      const totalSPP = rows2?.[0]?.total || 0;

      db.query(
        "SELECT SUM(jumlah_bayar) AS total FROM pembayaran",
        (err3, rows3) => {
          const totalBayar = rows3?.[0]?.total || 0;

          const totalTunggakan = 0;

          // WAJIB: totalSPP dikirim ke EJS
          res.render("dashboard", {
            user: req.session.user,
            totalSiswa: totalSiswa,
            totalSPP: totalSPP,
            totalBayar: totalBayar,
            totalTunggakan: totalTunggakan,
          });
        }
      );
    });
  });
});

// Halaman Data Siswa
app.get("/siswa", cekLogin, (req, res) => {
  db.query("SELECT * FROM siswa", (err, results) => {
    if (err) {
      console.error(err);
      return res.render("siswa", { data: [] });
    }
    res.render("siswa", { data: results || [] });
  });
});

// Halaman Data SPP
app.get("/spp", cekLogin, (req, res) => {
  db.query("SELECT * FROM spp", (err, results) => {
    if (err) {
      console.error(err);
      return res.render("spp", { data: [] });
    }
    res.render("spp", { data: results || [] });
  });
});

// Halaman Pembayaran
app.get("/pembayaran", cekLogin, (req, res) => {
  db.query("SELECT * FROM pembayaran", (err, results) => {
    if (err) {
      console.error(err);
      results = [];
    }

    // Get siswa and spp data for the form
    db.query("SELECT * FROM siswa", (err, siswaData) => {
      if (err) siswaData = [];

      db.query("SELECT * FROM spp", (err, sppData) => {
        if (err) sppData = [];

        res.render("pembayaran", {
          bayar: results || [],
          siswa: siswaData || [],
          spp: sppData || [],
        });
      });
    });
  });
});

// ----------------------------------------------------------
// 2. ROUTE POST (MENAMBAHKAN DATA)
// ----------------------------------------------------------

// Login
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
      if (
        storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$")
      ) {
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
        level: user.level,
      };

      console.log("User logged in:", req.session.user);

      return res.redirect("/dashboard");
    }
  );
});

// Tambah Siswa
app.post("/siswa/add", cekLogin, (req, res) => {
  const { nis, nama, kelas, alamat } = req.body;

  const sql = `INSERT INTO siswa (nisn, nama, kelas, alamat) VALUES (?,?,?,?)`;
  db.query(sql, [nis, nama, kelas, alamat], (err) => {
    if (err) {
      console.error(err);
      return res.redirect("/siswa");
    }
    res.redirect("/siswa");
  });
});

// Tambah SPP
app.post("/spp/add", cekLogin, (req, res) => {
  const { tahun, nominal } = req.body;

  const sql = `INSERT INTO spp (tahun, nominal) VALUES (?,?)`;
  db.query(sql, [tahun, nominal], (err) => {
    if (err) {
      console.error(err);
      return res.redirect("/spp");
    }
    res.redirect("/spp");
  });
});

// Tambah Pembayaran
app.post("/pembayaran/add", cekLogin, (req, res) => {
  const { id_siswa, id_spp, jumlah_bayar } = req.body;

  const sql = `INSERT INTO pembayaran 
        (id_siswa, id_spp, jumlah_bayar, tgl_bayar) 
        VALUES (?,?,?, NOW())`;

  db.query(sql, [id_siswa, id_spp, jumlah_bayar], (err) => {
    if (err) {
      console.error(err);
      return res.redirect("/pembayaran");
    }
    res.redirect("/pembayaran");
  });
});

// Logout
app.get("/logout", cekLogin, (req, res) => {
  res.redirect("/");
});

// ----------------------------------------------------------
// 3. MENJALANKAN SERVER
// ----------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.listen(3000, () => console.log("Server berjalan di http://localhost:3000"));
