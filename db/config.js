//const mysql = require('mysql');

const mysql = require('mysql2');

// 封装数据库配置文件

module.exports = {

  config: {

    host: '100.82.133.39',
    port: 3306,
    user: 'team1',
    password: '123456qwert!',
    database: 'fashion_skincare_db',
    multipleStatements: true,
    timezone:'+08:00'

  },

  connect(sql, params, cb){

    let conn = mysql.createConnection(this.config)

    conn.connect(); // 打开链接

    conn.query(sql, params, cb); //执行mysql语句

    conn.end()//关闭链接

  },

  log(adminId, operationType, operationTable, operationContent, operationResult) {
    // adminId 无效时用 1（钟总管理员）兜底，避免外键约束失败
    const validAdminId = (!adminId || isNaN(+adminId) || +adminId <= 0) ? 1 : +adminId;
    const sql = 'INSERT INTO log (Log_AdminID, OperationType, OperationTable, OperationContent, OperationResult) VALUES (?, ?, ?, ?, ?)';
    const conn = mysql.createConnection(this.config);
    conn.connect();
    conn.query(sql, [validAdminId, operationType, operationTable, operationContent, operationResult], (err) => {
      if (err) console.error('日志记录失败:', err.message);
    });
    conn.end();
  }

}