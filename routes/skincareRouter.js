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
        let dataSql = `SELECT p.ProductID, p.ProductName, p.Brand, p.Category as MainEffect, p.Price, p.ProductImageURL,
                              GROUP_CONCAT(DISTINCT s.SkinType) as SkinTypes,
                              GROUP_CONCAT(DISTINCT e.EffectTag) as Effects
                       FROM skincareproduct p 
                       LEFT JOIN skincareskintype s ON p.ProductID = s.ProductID
                       LEFT JOIN skincareeffecttag e ON p.ProductID = e.ProductID
                       ${whereSql} GROUP BY p.ProductID, p.ProductName, p.Brand, p.Category, p.Price, p.ProductImageURL
                       ORDER BY p.ProductID LIMIT ? OFFSET ?`;
        DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
            if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
            const result = list.map(r => ({ 
                ...r, 
                SkinType: r.SkinTypes || '所有肤质',
                Effect: r.Effects || r.MainEffect || '补水'
            }));
            res.json({ code: 0, msg: 'success', data: { list: result, total, page: +page, pageSize: +pageSize } });
        });
    });
});

skincareRouter.post("/skincare/add", function (req, res) {
    const { ProductName, Brand, Price, Effects = [], SkinTypes = [], adminId } = req.body;
    if (!ProductName || !Brand || !Price) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    const mainEffect = Array.isArray(Effects) && Effects.length > 0 ? Effects[0] : '补水';
    let sql = 'INSERT INTO skincareproduct (ProductName, Brand, Category, Price) VALUES (?, ?, ?, ?)';
    DB.connect(sql, [ProductName, Brand, mainEffect, +Price], (err, result) => {
        if (err) { 
            DB.log(adminId || 0, '新增', 'skincareproduct', `新增产品失败: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '新增失败', data: null }); 
            return; 
        }
        const productId = result.insertId;
        const saveRelations = () => {
            const effects = Array.isArray(Effects) ? Effects : [];
            const skinTypes = Array.isArray(SkinTypes) ? SkinTypes : [];
            let completed = 0;
            const total = (effects.length > 0 ? 1 : 0) + (skinTypes.length > 0 ? 1 : 0);
            const done = () => {
                completed++;
                if (completed >= total) {
                    DB.log(adminId || 0, '新增', 'skincareproduct', `新增产品，ID: ${productId}，名称: ${ProductName}`, '成功');
                    res.json({ code: 0, msg: '新增成功', data: { id: productId } });
                }
            };
            if (effects.length > 0) {
                const insertEffectSql = 'INSERT INTO skincareeffecttag (ProductID, EffectTag) VALUES ?';
                const effectValues = effects.map(e => [productId, e]);
                DB.connect(insertEffectSql, [effectValues], (err2) => {
                    if (err2) DB.log(adminId || 0, '新增', 'skincareeffecttag', `新增功效关联失败，产品ID: ${productId}: ${err2.message}`, '失败');
                    done();
                });
            } else done();
            if (skinTypes.length > 0) {
                const insertSkinSql = 'INSERT INTO skincareskintype (ProductID, SkinType) VALUES ?';
                const skinValues = skinTypes.map(st => [productId, st]);
                DB.connect(insertSkinSql, [skinValues], (err2) => {
                    if (err2) DB.log(adminId || 0, '新增', 'skincareskintype', `新增肤质关联失败，产品ID: ${productId}: ${err2.message}`, '失败');
                    done();
                });
            } else done();
        };
        saveRelations();
    });
});

skincareRouter.post("/skincare/update", function (req, res) {
    const { ProductID, ProductName, Brand, Price, Effects = [], SkinTypes = [], adminId } = req.body;
    if (!ProductID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    const mainEffect = Array.isArray(Effects) && Effects.length > 0 ? Effects[0] : '补水';
    let sql = 'UPDATE skincareproduct SET ProductName = ?, Brand = ?, Category = ?, Price = ? WHERE ProductID = ?';
    DB.connect(sql, [ProductName, Brand, mainEffect, +Price, +ProductID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '修改', 'skincareproduct', `修改产品失败，ID: ${ProductID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '修改失败', data: null }); 
            return; 
        }
        const saveRelations = () => {
            const effects = Array.isArray(Effects) ? Effects : [];
            const skinTypes = Array.isArray(SkinTypes) ? SkinTypes : [];
            let completed = 0;
            const total = (effects.length > 0 ? 1 : 0) + (skinTypes.length > 0 ? 1 : 0);
            const done = () => {
                completed++;
                if (completed >= total) {
                    DB.log(adminId || 0, '修改', 'skincareproduct', `修改产品，ID: ${ProductID}`, '成功');
                    res.json({ code: 0, msg: '修改成功', data: null });
                }
            };
            DB.connect('DELETE FROM skincareeffecttag WHERE ProductID = ?', [+ProductID], (err2) => {
                if (err2) DB.log(adminId || 0, '修改', 'skincareeffecttag', `删除旧功效关联失败，产品ID: ${ProductID}: ${err2.message}`, '失败');
                if (effects.length > 0) {
                    const insertEffectSql = 'INSERT INTO skincareeffecttag (ProductID, EffectTag) VALUES ?';
                    const effectValues = effects.map(e => [+ProductID, e]);
                    DB.connect(insertEffectSql, [effectValues], (err3) => {
                        if (err3) DB.log(adminId || 0, '修改', 'skincareeffecttag', `新增功效关联失败，产品ID: ${ProductID}: ${err3.message}`, '失败');
                        done();
                    });
                } else done();
            });
            DB.connect('DELETE FROM skincareskintype WHERE ProductID = ?', [+ProductID], (err2) => {
                if (err2) DB.log(adminId || 0, '修改', 'skincareskintype', `删除旧肤质关联失败，产品ID: ${ProductID}: ${err2.message}`, '失败');
                if (skinTypes.length > 0) {
                    const insertSkinSql = 'INSERT INTO skincareskintype (ProductID, SkinType) VALUES ?';
                    const skinValues = skinTypes.map(st => [+ProductID, st]);
                    DB.connect(insertSkinSql, [skinValues], (err3) => {
                        if (err3) DB.log(adminId || 0, '修改', 'skincareskintype', `新增肤质关联失败，产品ID: ${ProductID}: ${err3.message}`, '失败');
                        done();
                    });
                } else done();
            });
        };
        saveRelations();
    });
});

skincareRouter.post("/skincare/delete", function (req, res) {
    const { ProductID, adminId } = req.body;
    if (!ProductID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
    let sql = 'DELETE FROM skincareproduct WHERE ProductID = ?';
    DB.connect(sql, [+ProductID], (err) => {
        if (err) { 
            DB.log(adminId || 0, '删除', 'skincareproduct', `删除产品失败，ID: ${ProductID}: ${err.message}`, '失败');
            res.json({ code: 5000, msg: '删除失败', data: null }); 
            return; 
        }
        DB.log(adminId || 0, '删除', 'skincareproduct', `删除产品，ID: ${ProductID}`, '成功');
        res.json({ code: 0, msg: '删除成功', data: null });
    });
});

// 复杂查询3：套装详情查询 ProductBundle + BundleItem + SkincareProduct + SkinType
skincareRouter.get("/bundle/detail", function (req, res) {
    const { name = '', product = '', skinType = '' } = req.query;
    let whereSql = 'WHERE 1=1';
    let params = [];
    if (name) { whereSql += ' AND b.BundleName LIKE ?'; params.push(`%${name}%`); }
    if (product) { whereSql += ' AND EXISTS (SELECT 1 FROM bundleitem bi JOIN skincareproduct p ON bi.ProductID = p.ProductID WHERE bi.BundleID = b.BundleID AND p.ProductName LIKE ?)'; params.push(`%${product}%`); }

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

            let skinSql = `SELECT bi.BundleID, GROUP_CONCAT(DISTINCT s.SkinType) as SkinTypes
                           FROM bundleitem bi LEFT JOIN skincareskintype s ON bi.ProductID = s.ProductID
                           WHERE bi.BundleID IN (?)
                           GROUP BY bi.BundleID`;
            DB.connect(skinSql, [bundles.map(b => b.BundleID)], (err3, skinMap) => {
                if (err3) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
                const skinDict = {};
                (skinMap || []).forEach(s => { skinDict[s.BundleID] = s.SkinTypes; });

                const result = bundles.map(b => ({
                    ...b,
                    SkinType: skinDict[b.BundleID] || '所有肤质',
                    Description: b.BundleName + '完整方案',
                    Items: items.filter(i => i.BundleID === b.BundleID)
                }));
                const filtered = skinType ? result.filter(b => b.SkinType === skinType || b.SkinType === '所有肤质') : result;
                res.json({ code: 0, msg: 'success', data: filtered });
            });
        });
    });
});
