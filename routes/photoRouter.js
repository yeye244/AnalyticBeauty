const express = require("express");
const photoRouter = express.Router();
const DB = require("./../db/config");

module.exports = photoRouter;

photoRouter.get("/photo/page", function (req, res) {
    const { page = 1, pageSize = 10, userId = '', status = '', startDate = '', endDate = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (userId) { whereSql += ' AND (p.Photo_UserID = ? OR u.NickName LIKE ?)'; params.push(+userId, `%${userId}%`); }
    if (status) { whereSql += ' AND p.AnalysisStatus = ?'; params.push(status); }
    if (startDate) { whereSql += ' AND DATE(p.UploadTime) >= ?'; params.push(startDate); }
    if (endDate) { whereSql += ' AND DATE(p.UploadTime) <= ?'; params.push(endDate); }

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
    const { UserID, ImageURL, Status = '未分析', adminId } = req.body;
    if (!UserID || !ImageURL) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'INSERT INTO photo (Photo_UserID, PhotoURL, AnalysisStatus) VALUES (?, ?, ?)';
    DB.connect(sql, [+UserID, ImageURL, Status], (err, result) => {
        if (err) { 
            DB.log(adminId || 0, '新增', 'photo', `新增照片失败: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '新增失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '新增', 'photo', `新增照片，ID: ${result.insertId}，用户ID: ${UserID}`, '成功');
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
    });
});

photoRouter.post("/photo/update", function (req, res) {
    const { PhotoID, ImageURL, Status, adminId } = req.body;
    if (!PhotoID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'UPDATE photo SET PhotoURL = ?, AnalysisStatus = ? WHERE PhotoID = ?';
    DB.connect(sql, [ImageURL, Status, +PhotoID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '修改', 'photo', `修改照片失败，ID: ${PhotoID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '修改失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '修改', 'photo', `修改照片，ID: ${PhotoID}`, '成功');
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

// 删除照片：必须按 stylematch → recommendation → analysisresult → photo 顺序清理，
// 否则会因外键约束（analysisresult_ibfk_1 / recommendation_ibfk_2 / stylematch_ibfk_1）报错
photoRouter.post("/photo/delete", function (req, res) {
    const { PhotoID, adminId } = req.body;
    if (!PhotoID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    const pid = +PhotoID;

    // 第1步：查出该照片关联的所有分析结果ID
    DB.connect('SELECT AnalysisID FROM analysisresult WHERE Analysis_PhotoID = ?', [pid], (err, rows) => {
        if (err) {
            DB.log(adminId || 0, '删除', 'photo', `删除照片失败(查分析结果)，ID: ${pid}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败', data: null }); return;
        }
        const analysisIds = (rows || []).map(r => r.AnalysisID);

        // 第2步：删除 stylematch（依赖 analysisresult.AnalysisID）
        const delStylematch = (cb) => {
            if (!analysisIds.length) { cb(); return; }
            DB.connect('DELETE FROM stylematch WHERE SM_AnalysisID IN (?)', [analysisIds], (e) => {
                if (e) { cb(e); return; } cb();
            });
        };

        // 第3步：删除 recommendation（依赖 analysisresult.AnalysisID）
        const delRecommendation = (cb) => {
            if (!analysisIds.length) { cb(); return; }
            DB.connect('DELETE FROM recommendation WHERE Rec_AnalysisID IN (?)', [analysisIds], (e) => {
                if (e) { cb(e); return; } cb();
            });
        };

        // 第4步：删除 analysisresult（依赖 photo.PhotoID）
        const delAnalysis = (cb) => {
            DB.connect('DELETE FROM analysisresult WHERE Analysis_PhotoID = ?', [pid], (e) => {
                if (e) { cb(e); return; } cb();
            });
        };

        // 第5步：删除 photo
        const delPhoto = (cb) => {
            DB.connect('DELETE FROM photo WHERE PhotoID = ?', [pid], (e) => {
                if (e) { cb(e); return; } cb();
            });
        };

        // 按顺序执行
        delStylematch((e1) => {
            if (e1) { fail(e1); return; }
            delRecommendation((e2) => {
                if (e2) { fail(e2); return; }
                delAnalysis((e3) => {
                    if (e3) { fail(e3); return; }
                    delPhoto((e4) => {
                        if (e4) { fail(e4); return; }
                        DB.log(adminId || 0, '删除', 'photo',
                            `删除照片，ID: ${pid}，清理分析结果 ${analysisIds.length} 条`, '成功');
                        res.json({ code: 0, msg: '删除成功', data: null });
                    });
                });
            });
        });

        function fail(err) {
            DB.log(adminId || 0, '删除', 'photo', `删除照片失败，ID: ${pid}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败: ' + err.message, data: null });
        }
    });
});
