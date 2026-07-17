const express = require("express");
const bundleRouter = express.Router();
const DB = require("./../db/config");

module.exports = bundleRouter;

bundleRouter.get("/bundle/page", function (req, res) {
    const { page = 1, pageSize = 10, name = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (name) { whereSql += ' AND b.BundleName LIKE ?'; params.push(`%${name}%`); }

    let countSql = `SELECT COUNT(*) as total FROM productbundle b ${whereSql}`;
    DB.connect(countSql, params, (err, countResult) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        const total = countResult[0].total;
        const offset = (page - 1) * pageSize;
        let dataSql = `SELECT b.BundleID, b.BundleName, b.OriginalPrice, b.BundlePrice as TotalPrice, b.Discount,
                              COALESCE(SUM(bi.ProductCount), 0) as ProductCount
                       FROM productbundle b LEFT JOIN bundleitem bi ON b.BundleID = bi.BundleID
                       ${whereSql} GROUP BY b.BundleID, b.BundleName, b.OriginalPrice, b.BundlePrice, b.Discount
                       ORDER BY b.BundleID LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => {
                const discountVal = parseFloat(r.Discount) || 0;
                const discountLabel = discountVal > 0 ? parseFloat((100 - discountVal) / 10).toFixed(1).replace(/\.0$/, '') + '折' : '无折扣';
                return { ...r, DiscountLabel: discountLabel };
            });
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});

bundleRouter.post("/bundle/add", function (req, res) {
    const { BundleName, OriginalPrice, BundlePrice, Discount, Items = [], adminId } = req.body;
    if (!BundleName || !BundlePrice) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }

    let sql = 'INSERT INTO productbundle (BundleName, OriginalPrice, BundlePrice, Discount) VALUES (?, ?, ?, ?)';
    DB.connect(sql, [BundleName, +OriginalPrice || null, +BundlePrice, +Discount || 0], (err, result) => {
        if (err) { 
            DB.log(adminId || 0, '新增', 'productbundle', `新增套装失败: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '新增失败', data: null }); 
            return; 
        }
        const bundleId = result.insertId;
        if (Items && Items.length > 0) {
            const insertSql = 'INSERT INTO bundleitem (BundleID, ProductID, ProductCount) VALUES ?';
            const values = Items.map(item => [bundleId, item.ProductID, item.Quantity || 1]);
            DB.connect(insertSql, [values], (err2) => {
                if (err2) { 
                    DB.log(adminId || 0, '新增', 'productbundle', `新增套装产品失败，ID: ${bundleId}: ${err2.message}`, '失败');
                }
            });
        }
        DB.log(adminId || 0, '新增', 'productbundle', `新增套装，ID: ${bundleId}，名称: ${BundleName}`, '成功');
        res.json({ code: 0, msg: '新增成功', data: { id: bundleId } });
    });
});

bundleRouter.post("/bundle/update", function (req, res) {
    const { BundleID, BundleName, OriginalPrice, BundlePrice, Discount, Items = [], adminId } = req.body;
    if (!BundleID || !BundleName) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }

    let sql = 'UPDATE productbundle SET BundleName = ?, OriginalPrice = ?, BundlePrice = ?, Discount = ? WHERE BundleID = ?';
    DB.connect(sql, [BundleName, +OriginalPrice || null, +BundlePrice, +Discount || 0, +BundleID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '修改', 'productbundle', `修改套装失败，ID: ${BundleID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '修改失败', data: null }); 
            return; 
        }
        DB.connect('DELETE FROM bundleitem WHERE BundleID = ?', [+BundleID], (err2) => {
            if (!err2 && Items && Items.length > 0) {
                const insertSql = 'INSERT INTO bundleitem (BundleID, ProductID, ProductCount) VALUES ?';
                const values = Items.map(item => [+BundleID, item.ProductID, item.Quantity || 1]);
                DB.connect(insertSql, [values], () => {});
            }
        });
        DB.log(adminId || 0, '修改', 'productbundle', `修改套装，ID: ${BundleID}`, '成功');
        res.json({ code: 0, msg: '修改成功', data: null });
    });
});

bundleRouter.post("/bundle/delete", function (req, res) {
    const { BundleID, adminId } = req.body;
    if (!BundleID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    
    DB.connect('DELETE FROM bundleitem WHERE BundleID = ?', [+BundleID], () => {});
    let sql = 'DELETE FROM productbundle WHERE BundleID = ?';
    DB.connect(sql, [+BundleID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '删除', 'productbundle', `删除套装失败，ID: ${BundleID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '删除', 'productbundle', `删除套装，ID: ${BundleID}`, '成功');
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});

bundleRouter.get("/bundle/items", function (req, res) {
    const { bundleId } = req.query;
    if (!bundleId) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    
    let sql = `SELECT bi.BundleID, bi.ProductID, p.ProductName, p.Brand, p.Category as Effect, p.Price, bi.ProductCount as Quantity
               FROM bundleitem bi LEFT JOIN skincareproduct p ON bi.ProductID = p.ProductID
               WHERE bi.BundleID = ? ORDER BY bi.ProductID`;
    DB.connect(sql, [+bundleId], (err, data) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        res.json({ code: 0, msg: 'success', data });
    });
});

bundleRouter.get("/bundle/products", function (req, res) {
    let sql = 'SELECT ProductID, ProductName, Brand, Price FROM skincareproduct ORDER BY ProductID';
    DB.connect(sql, [], (err, data) => {
        if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        res.json({ code: 0, msg: 'success', data });
    });
});