const express = require("express");
const recommendRouter = express.Router();
const DB = require("./../db/config");

module.exports = recommendRouter;

// 推荐记录 CRUD
recommendRouter.get("/recommend/page", function (req, res) {
    const { page = 1, pageSize = 10, type = '', status = '', user = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (type) { whereSql += ' AND r.RecommendationType = ?'; params.push(type); }
    if (status !== '') { whereSql += ' AND r.IsAccepted = ?'; params.push(status === '已采纳' ? 1 : 0); }
    if (user) { whereSql += ' AND u.NickName LIKE ?'; params.push(`%${user}%`); }

    let countSql = `SELECT COUNT(*) as total FROM recommendation r LEFT JOIN user u ON r.Rec_UserID = u.UserID ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT r.RecommendationID as RecommendID, r.Rec_UserID as UserID, u.NickName as UserName,
                              r.RecommendationType as RecommendType, r.RecommendationReason as RecommendReason,
                              r.IsAccepted, r.RecommendationTime as RecommendTime
                       FROM recommendation r LEFT JOIN user u ON r.Rec_UserID = u.UserID
                       ${whereSql} ORDER BY r.RecommendationTime DESC LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => ({
                ...r,
                Status: r.IsAccepted === 1 ? '已采纳' : '未采纳',
                RecommendScore: null
            }));
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});

recommendRouter.post("/recommend/add", function (req, res) {
    const { UserID, RecommendType, RecommendReason, Status = '未采纳', RecommendScore = null, adminId } = req.body;
    if (!UserID || !RecommendType || !RecommendReason) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    const isAccepted = Status === '已采纳' ? 1 : 0;
    let sql = `INSERT INTO recommendation (Rec_UserID, Rec_AnalysisID, RecommendationType, RecommendationReason, IsAccepted) 
               VALUES (?, 1, ?, ?, ?)`;
    DB.connect(sql, [+UserID, RecommendType, RecommendReason, isAccepted], (err, result) => {
        if (err) { 
            DB.log(adminId || 0, '新增', 'recommendation', `新增推荐失败: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '新增失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '新增', 'recommendation', `新增推荐，ID: ${result.insertId}，类型: ${RecommendType}`, '成功');
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
    });
});

recommendRouter.post("/recommend/update", function (req, res) {
    const { RecommendID, RecommendType, RecommendReason, Status, RecommendScore, adminId } = req.body;
    if (!RecommendID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    const isAccepted = Status === '已采纳' ? 1 : 0;
    let sql = `UPDATE recommendation SET RecommendationType = ?, RecommendationReason = ?, IsAccepted = ? 
               WHERE RecommendationID = ?`;
    DB.connect(sql, [RecommendType, RecommendReason, isAccepted, +RecommendID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '修改', 'recommendation', `修改推荐失败，ID: ${RecommendID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '修改失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '修改', 'recommendation', `修改推荐，ID: ${RecommendID}`, '成功');
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

recommendRouter.post("/recommend/delete", function (req, res) {
    const { RecommendID, adminId } = req.body;
    if (!RecommendID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'DELETE FROM recommendation WHERE RecommendationID = ?';
    DB.connect(sql, [+RecommendID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '删除', 'recommendation', `删除推荐失败，ID: ${RecommendID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '删除', 'recommendation', `删除推荐，ID: ${RecommendID}`, '成功');
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});

// 复杂查询2：推荐详情查询 Recommendation + User + AnalysisResult
recommendRouter.get("/recommend/detail", function (req, res) {
    const { page = 1, pageSize = 10, user = '', type = '', status = '', startDate = '', endDate = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (user) { whereSql += ' AND u.NickName LIKE ?'; params.push(`%${user}%`); }
    if (type) { whereSql += ' AND r.RecommendationType = ?'; params.push(type); }
    if (status !== '') { whereSql += ' AND r.IsAccepted = ?'; params.push(status === '已采纳' ? 1 : 0); }
    if (startDate) { whereSql += ' AND DATE(r.RecommendationTime) >= ?'; params.push(startDate); }
    if (endDate) { whereSql += ' AND DATE(r.RecommendationTime) <= ?'; params.push(endDate); }

    // 图表1：推荐总体统计（总数、采纳数、采纳率）
    let statsSql = `SELECT COUNT(*) as total,
                           SUM(CASE WHEN IsAccepted = 1 THEN 1 ELSE 0 END) as adopted
                    FROM recommendation r
                    LEFT JOIN user u ON r.Rec_UserID = u.UserID
                    ${whereSql}`;
    // 图表2：肤色分布（联查 analysisresult.SkinTone）
    let skinSql = `SELECT a.SkinTone as skin, COUNT(*) as count
                   FROM recommendation r
                   LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID
                   WHERE a.SkinTone IS NOT NULL
                   GROUP BY a.SkinTone
                   ORDER BY count DESC`;

    let pageData = null, statsData = null, skinData = null, done = 0;
    const TOTAL = 3;
    function tryRespond() {
        if (++done < TOTAL) return;
        if (pageData === null || statsData === null || skinData === null) {
            res.json({ code: 5000, msg: '查询失败', data: null }); return;
        }
        res.json({ code: 0, msg: 'success', data: { ...pageData, stats: statsData, skinStats: skinData } });
    }

    let countSql = `SELECT COUNT(*) as total FROM recommendation r 
                    LEFT JOIN user u ON r.Rec_UserID = u.UserID 
                    LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
                    ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT r.RecommendationID as RecommendID, u.NickName as UserName,
                              a.SkinTone, a.FaceShape,
                              r.RecommendationType as RecommendType, r.RecommendationReason as RecommendReason,
                              r.IsAccepted, r.RecommendationTime as RecommendTime
                       FROM recommendation r 
                       LEFT JOIN user u ON r.Rec_UserID = u.UserID 
                       LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
                       ${whereSql} ORDER BY r.RecommendationTime DESC LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { pageData = null; tryRespond(); return; }
            const result = list.map(r => ({
                ...r,
                IsAdopted: r.IsAccepted === 1 ? '已采纳' : '未采纳'
            }));
            pageData = { list: result, total, page: +page, pageSize: +pageSize };
            tryRespond();
        });
    });

    // 统计卡片：总数、采纳数、采纳率
    DB.connect(statsSql, params, (err, rows) => {
        if (err) { statsData = null; tryRespond(); return; }
        const r = rows[0] || { total: 0, adopted: 0 };
        const total = Number(r.total) || 0;
        const adopted = Number(r.adopted) || 0;
        const rate = total > 0 ? Math.round((adopted / total) * 10000) / 100 : 0;
        statsData = { total, adopted, rate: rate + '%' };
        tryRespond();
    });

    // 肤色分布图表
    DB.connect(skinSql, [], (err, rows) => {
        if (err) { skinData = null; tryRespond(); return; }
        skinData = (rows || []).map(s => ({ skin: s.skin, count: Number(s.count) }));
        tryRespond();
    });
});
