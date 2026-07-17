const express = require("express");
const styleRouter = express.Router();
const DB = require("./../db/config");

module.exports = styleRouter;

styleRouter.get("/style/list", function (req, res) {
    const { page = 1, pageSize = 10, name = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    //AND isDelete = '0'
    let params = [];//参数数组传值
    if (name) { 
        whereSql += ' AND StyleName LIKE ?';
        params.push(`%${name}%`); }

    let countSql = `SELECT COUNT(*) as total FROM style ${whereSql}`;//${whereSql}就是把写好的筛选条件插到sql语句里
    DB.connect(countSql, params, (err, countResult) => {//sql语句，参数数组，回调函数
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;//分页偏移量，求跳过前面多少条数据


        let dataSql = `SELECT s.StyleID, s.StyleName, s.StyleImageURL,COUNT(sm.SM_AnalysisID) as UseCount
                       FROM style s LEFT JOIN stylematch sm ON s.StyleID = sm.SM_StyleID
                       ${whereSql} 
                       GROUP BY s.StyleID, s.StyleName, s.StyleImageURL
                       ORDER BY s.StyleID 
                       LIMIT ? OFFSET ?`;//每页条数，偏移量，？是占位符
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {//搜索条件参数，每页条数，偏移量。+是字符串转数字
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }

            const result = list.map(r => ({ 
                ...r, 
                Description: r.StyleName + '风格', 
                CreateTime:'2026-05-01 10:00' }));//遍历查出来的数据，补前端页面的描述，创建时间。...r是保留原本查到的

            res.json({ code: 0, 
                msg: 'success', 
                data: { 
                    list: result, 
                    total,
                    page: +page,
                    pageSize: +pageSize } });//返回json格式数据给前端页面
        });
    });
});


styleRouter.post("/style/add", function (req, res) {
    const { StyleName, Description = '' } = req.body;//post请求参数都存在这
    if (!StyleName) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }//4001参数错误

    let sql = 'INSERT INTO style (StyleName) VALUES (?)';
    DB.connect(sql, [StyleName], (err, result) => {
        if (err) { 
            res.json({ code: 5000, msg: '新增失败', data: null }); //5000数据库错误
            return; }
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });//返回给前端新增数据的ID
    });
});


styleRouter.post("/style/update", function (req, res) {
    const { StyleID, StyleName } = req.body;
    if (!StyleID || !StyleName) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }

    let sql = 'UPDATE style SET StyleName=? WHERE StyleID = ?';
    DB.connect(sql, [StyleName,+StyleID], (err) => {
        if (err) {
             res.json({ code: 5000, msg: '修改失败', data: null });
             return; }
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});


styleRouter.post("/style/delete", function (req, res) {
    const { StyleID } = req.body;
    if (!StyleID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }

    let sql = 'DELETE FROM style WHERE StyleID = ?';
    //ALTER TABLE style ADD isDelete TINYINT DEFAULT 0;
    //let sql = 'UPDATE style SET isDelete = 1 WHERE StyleID = ?';
    DB.connect(sql, [+StyleID], (err) => {
        if (err) { 
            res.json({ code: 5000, msg: '删除失败', data: null }); 
            return; }
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});
