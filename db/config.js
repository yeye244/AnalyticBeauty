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

  }

}