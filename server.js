const express = require("express");
const path = require("path");
const db = require("./spp-app/database");
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "spp-app/Public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "spp-app/View"));

// ----------------------------------------------------------
// 1. ROUTE GET (MENAMPILKAN HALAMAN)
// ----------------------------------------------------------

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/dashboard", (req, res) => {
  // Get total siswa
  db.query("SELECT COUNT(*) as count FROM siswa", (err, results) => {
    const totalSiswa = results[0].count;

    // Get total pembayaran
    db.query(
      "SELECT SUM(jumlah_bayar) as total FROM pembayaran",
      (err, results) => {
        const totalBayar = results[0].total || 0;

        // Simple mock user object
        const user = { username: "Admin" };

        res.render("dashboard", {
          user: user,
          totalSiswa: totalSiswa,
          totalBayar: totalBayar,
          totalTunggakan: 0,
        });
      }
    );
  });
});

// Halaman Data Siswa
app.get("/siswa", (req, res) => {
  db.query("SELECT * FROM siswa", (err, results) => {
    if (err) {
      console.error(err);
      return res.render("siswa", { data: [] });
    }
    res.render("siswa", { data: results || [] });
  });
});

// Halaman Data SPP
app.get("/spp", (req, res) => {
  db.query("SELECT * FROM spp", (err, results) => {
    if (err) {
      console.error(err);
      return res.render("spp", { data: [] });
    }
    res.render("spp", { data: results || [] });
  });
});

// Halaman Pembayaran
app.get("/pembayaran", (req, res) => {
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

  // Simple login validation (for demo purposes)
  if (username && password) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/");
  }
});

// Tambah Siswa
app.post("/siswa/add", (req, res) => {
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
app.post("/spp/add", (req, res) => {
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
app.post("/pembayaran/add", (req, res) => {
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
app.get("/logout", (req, res) => {
  res.redirect("/");
});

// ----------------------------------------------------------
// 3. MENJALANKAN SERVER
// ----------------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.listen(3000, () => console.log("Server berjalan di http://localhost:3000"));
