const express = require("express");
const crypto = require("crypto");
const userRouter = express.Router();
const DB = require("./../db/config");

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = userRouter;

// 管理员登录
userRouter.route("/user/login")
    .get(function (req, res) {
        const { username, password } = req.query;
        let sql = 'SELECT * FROM admin WHERE AdminName = ? AND AdminPWD = ?';
        DB.connect(sql, [username, md5(password)], (err, data) => {
            if (!err && data && data.length === 1) {
                DB.connect('UPDATE admin SET LastLoginTime = NOW() WHERE AdminID = ?', [data[0].AdminID], () => {});
                res.json({ code: 0, msg: '登录成功', data: { uid: data[0].AdminID, uname: data[0].AdminName, uaccess: data[0].AdminName, role: data[0].AdminRole } });
            } else {
                res.json({ code: 4001, msg: '账号或密码错误', data: {} });
            }
        });
    })
    .post(function (req, res) {
        const { username, password } = req.body;
        let sql = 'SELECT * FROM admin WHERE AdminName = ? AND AdminPWD = ?';
        DB.connect(sql, [username, md5(password)], (err, data) => {
            if (!err && data && data.length === 1) {
                DB.connect('UPDATE admin SET LastLoginTime = NOW() WHERE AdminID = ?', [data[0].AdminID], () => {});
                res.json({ code: 0, msg: '登录成功', data: { uid: data[0].AdminID, uname: data[0].AdminName, uaccess: data[0].AdminName, role: data[0].AdminRole } });
            } else {
                res.json({ code: 4001, msg: '账号或密码错误', data: {} });
            }
        });
    });

// 用户管理分页查询
userRouter.get("/user/page", function (req, res) {
    const { page = 1, pageSize = 10, name = '', status = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (name) { whereSql += ' AND NickName LIKE ?'; params.push(`%${name}%`); }
    if (status) { whereSql += ' AND UserStatus = ?'; params.push(status === '正常' ? 1 : 0); }

    let countSql = `SELECT COUNT(*) as total FROM user ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT UserID, UserAccount, NickName, UserGender, UserAge, SkinType, RegisterTime, UserStatus
                       FROM user ${whereSql} ORDER BY UserID LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => ({
                UserID: r.UserID,
                UserName: r.NickName,
                Account: r.UserAccount,
                Phone: '-',
                Gender: r.UserGender,
                SkinType: r.SkinType,
                RegisterTime: r.RegisterTime,
                Status: r.UserStatus === 1 ? '正常' : '已禁用'
            }));
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});
