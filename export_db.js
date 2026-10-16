const mysql = require('mysql2');
const fs = require('fs');

const config = {
  host: '100.82.133.39',
  port: 3306,
  user: 'team1',
  password: '123456qwert!',
  database: 'fashion_skincare_db',
  timezone: '+08:00',
  multipleStatements: true
};

const conn = mysql.createConnection(config);

async function exportDb() {
  let sql = '-- =============================================\n';
  sql += '-- 数据库: fashion_skincare_db\n';
  sql += '-- 导出时间: ' + new Date().toLocaleString('zh-CN') + '\n';
  sql += '-- =============================================\n\n';
  sql += 'SET NAMES utf8mb4;\n';
  sql += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

  // 获取所有表
  const [tables] = await conn.promise().query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);

  console.log('找到表:', tableNames.length + ' 张');

  for (const tableName of tableNames) {
    console.log('导出表:', tableName);

    // 建表语句
    const [createRes] = await conn.promise().query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSql = createRes[0]['Create Table'];

    sql += `-- 表结构: ${tableName}\n`;
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sql += createSql + ';\n\n';

    // 数据
    const [rows] = await conn.promise().query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      sql += `-- 表数据: ${tableName} (${rows.length} 条)\n`;
      sql += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES\n`;

      const valueRows = rows.map(row => {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
        });
        return '  (' + values.join(', ') + ')';
      });
      sql += valueRows.join(',\n') + ';\n';
    } else {
      sql += `-- 表数据: ${tableName} (空表)\n`;
    }
    sql += '\n';
  }

  sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  // 写入文件
  const outPath = __dirname + '/fashion_skincare_db.sql';
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log('\n导出完成！文件:', outPath);
  console.log('文件大小:', (fs.statSync(outPath).size / 1024).toFixed(2), 'KB');

  conn.end();
}

exportDb().catch(err => {
  console.error('导出失败:', err.message);
  conn.end();
  process.exit(1);
});
