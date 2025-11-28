const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'ukk_spp'
});

db.connect(err => {
  if (err) return console.error('DB connect error:', err);
  console.log('DB Connected for schema inspect');

  db.query('SHOW CREATE TABLE siswa', (err, rows) => {
    if (err) console.error('SHOW CREATE TABLE error:', err);
    else console.log('SHOW CREATE TABLE siswa:\n', rows[0]['Create Table']);

    db.query('DESCRIBE siswa', (err2, rows2) => {
      if (err2) console.error('DESCRIBE error:', err2);
      else console.table(rows2);

      db.query('SELECT COUNT(*) as cnt FROM siswa', (err3, rows3) => {
        if (err3) console.error('COUNT error:', err3);
        else console.log('Row count:', rows3[0].cnt);
        db.end();
      });
    });
  });
});
