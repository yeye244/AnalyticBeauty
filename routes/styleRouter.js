const express = require("express");
const styleRouter = express.Router();
const DB = require("./../db/config");

module.exports = styleRouter;

styleRouter.get("/style/list", function (req, res) {
    const { page = 1, pageSize = 10, name = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (name) { whereSql += ' AND StyleName LIKE ?'; params.push(`%${name}%`); }

    let countSql = `SELECT COUNT(*) as total FROM style ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT s.StyleID, s.StyleName, s.StyleImageURL,
                              COUNT(sm.SM_AnalysisID) as UseCount
                       FROM style s LEFT JOIN stylematch sm ON s.StyleID = sm.SM_StyleID
                       ${whereSql} GROUP BY s.StyleID, s.StyleName, s.StyleImageURL
                       ORDER BY s.StyleID LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => ({ ...r, Description: r.StyleName + '风格', CreateTime: '2026-05-01 10:00' }));
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});

styleRouter.post("/style/add", function (req, res) {
    const { StyleName, Description = '', adminId } = req.body;
    if (!StyleName) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'INSERT INTO style (StyleName) VALUES (?)';
    DB.connect(sql, [StyleName], (err, result) => {
        if (err) { 
            DB.log(adminId || 0, '新增', 'style', `新增风格失败: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '新增失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '新增', 'style', `新增风格，ID: ${result.insertId}，名称: ${StyleName}`, '成功');
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
    });
});

styleRouter.post("/style/update", function (req, res) {
    const { StyleID, StyleName, adminId } = req.body;
    if (!StyleID || !StyleName) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'UPDATE style SET StyleName = ? WHERE StyleID = ?';
    DB.connect(sql, [StyleName, +StyleID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '修改', 'style', `修改风格失败，ID: ${StyleID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '修改失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '修改', 'style', `修改风格，ID: ${StyleID}，名称: ${StyleName}`, '成功');
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

styleRouter.post("/style/delete", function (req, res) {
    const { StyleID, adminId } = req.body;
    if (!StyleID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'DELETE FROM style WHERE StyleID = ?';
    DB.connect(sql, [+StyleID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '删除', 'style', `删除风格失败，ID: ${StyleID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '删除', 'style', `删除风格，ID: ${StyleID}`, '成功');
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});
