const express = require("express");
const analysisRouter = express.Router();
const DB = require("./../db/config");

module.exports = analysisRouter;

// 复杂查询1：用户照片分析查询 User + Photo + AnalysisResult
analysisRouter.get("/analysis/list", function (req, res) {
    const { page = 1, pageSize = 10, user = '', skinTone = '', faceShape = '', order = 'DESC' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (user) { whereSql += ' AND u.NickName LIKE ?'; params.push(`%${user}%`); }
    if (skinTone) { whereSql += ' AND a.SkinTone = ?'; params.push(skinTone); }
    if (faceShape) { whereSql += ' AND a.FaceShape = ?'; params.push(faceShape); }
    const orderBy = order === 'ASC' ? 'ASC' : 'DESC';

    let countSql = `SELECT COUNT(*) as total FROM analysisresult a 
                    LEFT JOIN photo p ON a.Analysis_PhotoID = p.PhotoID 
                    LEFT JOIN user u ON p.Photo_UserID = u.UserID 
                    ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT a.AnalysisID, u.UserID, u.NickName as UserName, p.PhotoURL, 
                              a.SkinTone, a.FaceShape, a.BodyShape, a.AnalysisTime
                       FROM analysisresult a 
                       LEFT JOIN photo p ON a.Analysis_PhotoID = p.PhotoID 
                       LEFT JOIN user u ON p.Photo_UserID = u.UserID 
                       ${whereSql} ORDER BY a.AnalysisTime ${orderBy} LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            res.json({ code: 0, msg: 'success', data: { list, total, page: +page, pageSize: +pageSize } });
        });
    });
});

// 复杂查询4：风格匹配排行 AnalysisResult + StyleMatch + Style
analysisRouter.get("/style/rank", function (req, res) {
    const { order = 'DESC' } = req.query;
    const orderBy = order === 'ASC' ? 'ASC' : 'DESC';

    let sql = `SELECT s.StyleID, s.StyleName, s.StyleImageURL,
               COUNT(sm.SM_AnalysisID) as MatchCount
               FROM style s LEFT JOIN stylematch sm ON s.StyleID = sm.SM_StyleID
               GROUP BY s.StyleID, s.StyleName
               ORDER BY MatchCount ${orderBy}`;
    DB.connect(sql, [], (err, list) => {//没有占位符所以是空数组
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }

        const total = list.reduce((s, r) => s + r.MatchCount, 0);//reduce是累加遍历，得到全部总匹配条数
        const result = list.map(r => ({
            StyleID: r.StyleID,
            StyleName: r.StyleName,
            MatchCount: r.MatchCount,
            AvgScore: r.MatchCount > 0 ? 85 + Math.random() * 10 : 0,//平均分模拟，85+（0-10的随机小数），无匹配是0
            MaxScore: r.MatchCount > 0 ? 95 + Math.random() * 3 : 0,
            Percentage: total > 0 ? +(r.MatchCount / total * 100).toFixed(1) : 0//当前风格次数/总次数*100，保留一位小数
        }));
        res.json({ code: 0, msg: 'success', data: result });
    });
});
