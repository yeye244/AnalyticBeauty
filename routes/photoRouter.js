const express = require("express");
const photoRouter = express.Router();
const DB = require("./../db/config");

module.exports = photoRouter;

photoRouter.get("/photo/page", function (req, res) {
    const { page = 1, pageSize = 10, userId = '', status = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (userId) { whereSql += ' AND (p.Photo_UserID = ? OR u.NickName LIKE ?)'; params.push(+userId, `%${userId}%`); }
    if (status) { whereSql += ' AND p.AnalysisStatus = ?'; params.push(status); }

    let countSql = `SELECT COUNT(*) as total FROM photo p LEFT JOIN user u ON p.Photo_UserID = u.UserID ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT p.PhotoID, p.Photo_UserID as UserID, u.NickName as UserName, p.PhotoURL as ImageURL, p.UploadTime, p.AnalysisStatus as Status
                       FROM photo p LEFT JOIN user u ON p.Photo_UserID = u.UserID 
                       ${whereSql} ORDER BY p.UploadTime DESC LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            res.json({ code: 0, msg: 'success', data: { list, total, page: +page, pageSize: +pageSize } });
        });
    });
});

photoRouter.post("/photo/add", function (req, res) {
    const { UserID, ImageURL, Status = '未分析' } = req.body;
    if (!UserID || !ImageURL) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'INSERT INTO photo (Photo_UserID, PhotoURL, AnalysisStatus) VALUES (?, ?, ?)';
    DB.connect(sql, [+UserID, ImageURL, Status], (err, result) => {
        if (err) { res.json({ code: 5000, msg: '新增失败', data: null }); return; }
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
    });
});

photoRouter.post("/photo/update", function (req, res) {
    const { PhotoID, ImageURL, Status } = req.body;
    if (!PhotoID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'UPDATE photo SET PhotoURL = ?, AnalysisStatus = ? WHERE PhotoID = ?';
    DB.connect(sql, [ImageURL, Status, +PhotoID], (err) => {
        if (err) { res.json({ code: 5000, msg: '修改失败', data: null }); return; }
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

photoRouter.post("/photo/delete", function (req, res) {
    const { PhotoID } = req.body;
    if (!PhotoID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'DELETE FROM photo WHERE PhotoID = ?';
    DB.connect(sql, [+PhotoID], (err) => {
        if (err) { res.json({ code: 5000, msg: '删除失败', data: null }); return; }
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});
