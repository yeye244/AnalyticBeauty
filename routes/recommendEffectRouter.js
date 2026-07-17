const express = require("express");
const recommendEffectRouter = express.Router();
const DB = require("./../db/config");

module.exports = recommendEffectRouter;

recommendEffectRouter.get("/recommend/effect", function (req, res) {
    const { type = '', startDate = '', endDate = '' } = req.query;
    
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (type) { whereSql += ' AND RecommendationType = ?'; params.push(type); }
    if (startDate) { whereSql += ' AND DATE(RecommendationTime) >= ?'; params.push(startDate); }
    if (endDate) { whereSql += ' AND DATE(RecommendationTime) <= ?'; params.push(endDate); }

    let statsSql = `SELECT 
                       RecommendationType as Type,
                       COUNT(*) as Total,
                       SUM(CASE WHEN IsAccepted = 1 THEN 1 ELSE 0 END) as Accepted,
                       SUM(CASE WHEN IsAccepted = 0 THEN 1 ELSE 0 END) as Rejected,
                       ROUND(SUM(CASE WHEN IsAccepted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as AcceptRate
                   FROM recommendation 
                   ${whereSql}
                   GROUP BY RecommendationType
                   ORDER BY Total DESC`;
    DB.connect(statsSql, params, (err, stats) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        stats.forEach(s => {
            s.Total = parseInt(s.Total);
            s.Accepted = parseInt(s.Accepted);
            s.Rejected = parseInt(s.Rejected);
            s.AcceptRate = parseFloat(s.AcceptRate);
        });

        let trendSql = `SELECT 
                           DATE(RecommendationTime) as Date,
                           COUNT(*) as Total,
                           SUM(CASE WHEN IsAccepted = 1 THEN 1 ELSE 0 END) as Accepted
                       FROM recommendation 
                       ${whereSql}
                       GROUP BY DATE(RecommendationTime)
                       ORDER BY Date DESC
                       LIMIT 30`;
        DB.connect(trendSql, params, (err2, trend) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            trend.forEach(t => {
                t.Total = parseInt(t.Total);
                t.Accepted = parseInt(t.Accepted);
                if (t.Date) {
                    const d = new Date(t.Date);
                    t.Date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                }
            });

            let userSql = `SELECT 
                              u.NickName as UserName,
                              COUNT(*) as TotalRecommend,
                              SUM(CASE WHEN IsAccepted = 1 THEN 1 ELSE 0 END) as Accepted
                          FROM recommendation r LEFT JOIN user u ON r.Rec_UserID = u.UserID
                          ${whereSql}
                          GROUP BY r.Rec_UserID, u.NickName
                          ORDER BY TotalRecommend DESC
                          LIMIT 20`;
            DB.connect(userSql, params, (err3, userStats) => {
                if (err3) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
                userStats.forEach(u => {
                    u.TotalRecommend = parseInt(u.TotalRecommend);
                    u.Accepted = parseInt(u.Accepted);
                });

                res.json({
                    code: 0,
                    msg: 'success',
                    data: {
                        stats,
                        trend: trend.reverse(),
                        userStats
                    }
                });
            });
        });
    });
});