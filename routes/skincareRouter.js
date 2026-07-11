const express = require("express");
const skincareRouter = express.Router();
const DB = require("./../db/config");

module.exports = skincareRouter;

// 护肤产品 CRUD
skincareRouter.get("/skincare/page", function (req, res) {
    const { page = 1, pageSize = 10, brand = '', priceMin = '', priceMax = '', skinType = '', effect = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (brand) { whereSql += ' AND p.Brand LIKE ?'; params.push(`%${brand}%`); }
    if (priceMin !== '') { whereSql += ' AND p.Price >= ?'; params.push(+priceMin); }
    if (priceMax !== '') { whereSql += ' AND p.Price <= ?'; params.push(+priceMax); }
    if (skinType) { whereSql += ' AND p.ProductID IN (SELECT ProductID FROM skincareskintype WHERE SkinType = ?)'; params.push(skinType); }

    let countSql = `SELECT COUNT(*) as total FROM skincareproduct p ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT p.ProductID, p.ProductName, p.Brand, p.Category as Effect, p.Price, p.ProductImageURL
                       FROM skincareproduct p ${whereSql} ORDER BY p.ProductID LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => ({ ...r, SkinType: '所有肤质' }));
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});

skincareRouter.post("/skincare/add", function (req, res) {
    const { ProductName, Brand, Price, Effect = '补水', SkinType = '所有肤质' } = req.body;
    if (!ProductName || !Brand || !Price) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'INSERT INTO skincareproduct (ProductName, Brand, Category, Price) VALUES (?, ?, ?, ?)';
    DB.connect(sql, [ProductName, Brand, Effect, +Price], (err, result) => {
        if (err) { res.json({ code: 5000, msg: '新增失败', data: null }); return; }
        res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
    });
});

skincareRouter.post("/skincare/update", function (req, res) {
    const { ProductID, ProductName, Brand, Price, Effect } = req.body;
    if (!ProductID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'UPDATE skincareproduct SET ProductName = ?, Brand = ?, Category = ?, Price = ? WHERE ProductID = ?';
    DB.connect(sql, [ProductName, Brand, Effect, +Price, +ProductID], (err) => {
        if (err) { res.json({ code: 5000, msg: '修改失败', data: null }); return; }
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

skincareRouter.post("/skincare/delete", function (req, res) {
    const { ProductID } = req.body;
    if (!ProductID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'DELETE FROM skincareproduct WHERE ProductID = ?';
    DB.connect(sql, [+ProductID], (err) => {
        if (err) { res.json({ code: 5000, msg: '删除失败', data: null }); return; }
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});

// 复杂查询3：套装详情查询 ProductBundle + BundleItem + SkincareProduct + SkinType
skincareRouter.get("/bundle/detail", function (req, res) {
    const { name = '', skinType = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (name) { whereSql += ' AND b.BundleName LIKE ?'; params.push(`%${name}%`); }

    let bundleSql = `SELECT b.BundleID, b.BundleName, b.OriginalPrice, b.BundlePrice as TotalPrice
                     FROM productbundle b ${whereSql} ORDER BY b.BundleID`;
    DB.connect(bundleSql, params, (err, bundles) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        if (!bundles.length) { res.json({ code: 0, msg: 'success', data: [] }); return; }

        let itemSql = `SELECT bi.BundleID, p.ProductID, p.ProductName, p.Brand, p.Category as Effect, p.Price, bi.ProductCount as Quantity
                       FROM bundleitem bi LEFT JOIN skincareproduct p ON bi.ProductID = p.ProductID
                       WHERE bi.BundleID IN (?)`;
        DB.connect(itemSql, [bundles.map(b => b.BundleID)], (err2, items) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = bundles.map(b => ({
                ...b,
                SkinType: '所有肤质',
                Description: b.BundleName + '完整方案',
                Items: items.filter(i => i.BundleID === b.BundleID)
            }));
            const filtered = skinType ? result.filter(b => b.SkinType === skinType || b.SkinType === '所有肤质') : result;
            res.json({ code: 0, msg: 'success', data: filtered });
        });
    });
});
