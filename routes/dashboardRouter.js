const express = require("express");
const dashboardRouter = express.Router();
const DB = require("./../db/config");

module.exports = dashboardRouter;

// 仪表盘统计：用户数、照片数、分析数、推荐数、采纳率
dashboardRouter.get("/dashboard/stats", function (req, res) {
    // 一条 SQL 聚合所有统计，避免多层回调嵌套
    // 注意：user 是 MySQL 关键字，必须用反引号
    let sql = `SELECT
        (SELECT COUNT(*) FROM \`user\`) AS userCount,
        (SELECT COUNT(*) FROM \`photo\`) AS photoCount,
        (SELECT COUNT(*) FROM \`analysisresult\`) AS analysisCount,
        (SELECT COUNT(*) FROM \`recommendation\`) AS recommendationCount,
        (SELECT COUNT(*) FROM \`recommendation\` WHERE IsAccepted = 1) AS adoptedCount`;

    DB.connect(sql, [], (err, rows) => {
        if (err) {
            res.json({ code: 5000, msg: '统计查询失败', data: null });
            return;
        }
        const r = rows[0] || {};
        const recommendationCount = Number(r.recommendationCount) || 0;
        const adoptedCount = Number(r.adoptedCount) || 0;
        const adoptionRate = recommendationCount > 0
            ? Math.round((adoptedCount / recommendationCount) * 10000) / 10000
            : 0;

        res.json({
            code: 0,
            msg: 'success',
            data: {
                userCount: Number(r.userCount) || 0,
                photoCount: Number(r.photoCount) || 0,
                analysisCount: Number(r.analysisCount) || 0,
                recommendationCount,
                adoptedCount,
                adoptionRate
            }
        });
    });
});
