const express = require("express");
const systemRouter = express.Router();
const DB = require("./../db/config");

module.exports = systemRouter;

// 管理员 CRUD
systemRouter.get("/admin/page", function (req, res) {
    const { page = 1, pageSize = 10, account = '', role = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (account) { whereSql += ' AND AdminName LIKE ?'; params.push(`%${account}%`); }
    if (role) { whereSql += ' AND AdminRole = ?'; params.push(role); }

    let countSql = `SELECT COUNT(*) as total FROM admin ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT AdminID, AdminName, AdminRole, LastLoginIP, LastLoginTime, CreateTime
                       FROM admin ${whereSql} ORDER BY AdminID LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => ({
                AdminID: r.AdminID,
                AdminAccount: r.AdminName,
                AdminName: r.AdminName,
                Role: r.AdminRole,
                LastLogin: r.LastLoginTime,
                Status: '正常'
            }));
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});

systemRouter.post("/admin/add", function (req, res) {
    const { AdminAccount, AdminPassword, Role = '普通管理员', adminId } = req.body;
    if (!AdminAccount || !AdminPassword) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'INSERT INTO admin (AdminName, AdminPWD, AdminRole) VALUES (?, ?, ?)';
    DB.connect(sql, [AdminAccount, AdminPassword, Role], (err, result) => {
        if (err) { 
            DB.log(adminId || 0, '新增', 'admin', `新增管理员失败: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '新增失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '新增', 'admin', `新增管理员，ID: ${result.insertId}，账号: ${AdminAccount}，角色: ${Role}`, '成功');
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
    });
});

systemRouter.post("/admin/update", function (req, res) {
    const { AdminID, AdminAccount, AdminPassword, Role, adminId } = req.body;
    if (!AdminID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let fields = [];
    let params = [];
    if (AdminAccount !== undefined) { fields.push('AdminName = ?'); params.push(AdminAccount); }
    if (AdminPassword !== undefined) { fields.push('AdminPWD = ?'); params.push(AdminPassword); }
    if (Role !== undefined) { fields.push('AdminRole = ?'); params.push(Role); }
    if (!fields.length) { res.json({ code: 4001, msg: '没有要更新的字段', data: null }); return; }
    params.push(+AdminID);
    let sql = `UPDATE admin SET ${fields.join(', ')} WHERE AdminID = ?`;
    DB.connect(sql, params, (err) => {
        if (err) { 
            DB.log(adminId || 0, '修改', 'admin', `修改管理员失败，ID: ${AdminID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '修改失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '修改', 'admin', `修改管理员，ID: ${AdminID}`, '成功');
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

systemRouter.post("/admin/delete", function (req, res) {
    const { AdminID, adminId } = req.body;
    if (!AdminID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'DELETE FROM admin WHERE AdminID = ?';
    DB.connect(sql, [+AdminID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '删除', 'admin', `删除管理员失败，ID: ${AdminID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '删除', 'admin', `删除管理员，ID: ${AdminID}`, '成功');
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});

// 复杂查询5：操作日志统计 Admin + Log
systemRouter.get("/log/page", function (req, res) {
    const { page = 1, pageSize = 10, admin = '', type = '', result = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (admin) { whereSql += ' AND a.AdminName LIKE ?'; params.push(`%${admin}%`); }
    if (type) { whereSql += ' AND l.OperationType = ?'; params.push(type); }
    if (result) { whereSql += ' AND l.OperationResult = ?'; params.push(result); }

    let countSql = `SELECT COUNT(*) as total FROM log l LEFT JOIN admin a ON l.Log_AdminID = a.AdminID ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT l.LogID, a.AdminName, l.OperationType, l.OperationTable, l.OperationContent, l.OperationTime, l.OperationResult
                       FROM log l LEFT JOIN admin a ON l.Log_AdminID = a.AdminID
                       ${whereSql} ORDER BY l.OperationTime DESC LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            res.json({ code: 0, msg: 'success', data: { list, total, page: +page, pageSize: +pageSize } });
        });
    });
});

// 日志统计
systemRouter.get("/log/stats", function (req, res) {
    let totalSql = 'SELECT COUNT(*) as total FROM log';
    let successSql = "SELECT COUNT(*) as sCount FROM log WHERE OperationResult = '成功'";
    let failSql = "SELECT COUNT(*) as fCount FROM log WHERE OperationResult = '失败'";
    let todaySql = "SELECT COUNT(*) as tCount FROM log WHERE DATE(OperationTime) = CURDATE()";
    let typeSql = "SELECT OperationType, COUNT(*) as Cnt FROM log GROUP BY OperationType";
    let adminSql = "SELECT a.AdminName, COUNT(*) as Cnt FROM log l LEFT JOIN admin a ON l.Log_AdminID = a.AdminID GROUP BY l.Log_AdminID ORDER BY Cnt DESC LIMIT 10";

    let result = {};
    let done = 0;
    function checkDone() {
        done++;
        if (done === 6) res.json({ code: 0, msg: 'success', data: result });
    }

    DB.connect(totalSql, [], (err, d) => { result.total = d[0].total; checkDone(); });
    DB.connect(successSql, [], (err, d) => { result.success = d[0].sCount; checkDone(); });
    DB.connect(failSql, [], (err, d) => { result.fail = d[0].fCount; checkDone(); });
    DB.connect(todaySql, [], (err, d) => { result.today = d[0].tCount; checkDone(); });
    DB.connect(typeSql, [], (err, d) => { result.typeStats = d; checkDone(); });
    DB.connect(adminSql, [], (err, d) => { result.adminStats = d; checkDone(); });
});
