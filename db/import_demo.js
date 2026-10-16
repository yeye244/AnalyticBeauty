// 导入 demo_data.sql 并逐表统计行数（用于验收）
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const { config } = require('./config');

const sqlPath = path.join(__dirname, 'demo_data.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const conn = mysql.createConnection({ ...config, multipleStatements: true });

conn.connect(err => {
  if (err) { console.error('❌ 数据库连接失败:', err.message); process.exit(1); }
  console.log('✅ 数据库连接成功:', config.host, '/', config.database);

  conn.query(sql, (err) => {
    if (err) { console.error('❌ 导入失败:', err.message); process.exit(1); }
    console.log('✅ demo_data.sql 导入成功\n');

    const tables = ['user','style','skincareproduct','skincareskintype','skincareeffecttag',
      'productbundle','bundleitem','photo','analysisresult','stylematch','recommendation','log'];
    const union = tables.map(t => `SELECT '${t}' AS tbl, COUNT(*) AS c FROM \`${t}\``).join(' UNION ALL ');
    conn.query('SELECT tbl, c FROM (' + union + ') x ORDER BY c', (err, rows) => {
      if (err) { console.error('统计失败:', err.message); process.exit(1); }
      console.log('---- 各表演示数据行数 ----');
      rows.forEach(r => console.log(`  ${r.tbl.padEnd(20)} ${r.c}`));
      conn.query('SELECT SUM(IsAccepted=1) AS accepted, COUNT(*) AS total FROM recommendation', (err, r2) => {
        if (!err && r2 && r2[0]) console.log(`\n  recommendation: 总 ${r2[0].total} 条，已采纳 ${r2[0].accepted} 条`);
        conn.end();
      });
    });
  });
});
