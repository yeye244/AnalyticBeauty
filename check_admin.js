const mysql = require('mysql2');

const config = {
  host: '100.82.133.39',
  port: 3306,
  user: 'team1',
  password: '123456qwert!',
  database: 'fashion_skincare_db',
  timezone: '+08:00'
};

let conn = mysql.createConnection(config);
conn.connect();

// 查询表结构
conn.query('SHOW COLUMNS FROM admin', (err, cols) => {
  if (err) { console.error('表结构查询失败:', err.message); conn.end(); return; }
  console.log('admin 表字段:');
  cols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  // 查询数据
  conn.query('SELECT AdminID, AdminName, Phone, AdminRole FROM admin LIMIT 5', (err2, rows) => {
    if (err2) { console.error('数据查询失败:', err2.message); conn.end(); return; }
    console.log('\n前5条数据:');
    console.log(rows);
    conn.end();
  });
});
