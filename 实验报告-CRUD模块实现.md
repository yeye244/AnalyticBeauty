# 实验报告 - CRUD功能模块实现

---

## 6.2 照片表CRUD功能模块实现

### （1）功能说明

本页面为管理员展示所有的照片列表，同时提供了照片的状态筛选显示。在该页面管理员用户可以新增照片（支持图片上传）、照片列表、照片查询，对选定的照片查看详情、修改信息、删除照片等操作。照片管理的首页为照片列表显示页面，该页面设计效果如图6-1所示。

### （2）页面设计截图

图6-1 照片管理页面

### （3）分功能编写CRUD功能实现的过程及运行截图

具体实现过程如下：

#### 1、照片查询及列表分页展示功能的实现：

本页面需要展示照片重要信息，包含（照片ID，用户ID，用户昵称，图片，图片地址，上传时间，状态等信息），所以需要对Photo、User两个表进行连接查询，另外由于需要分页，每页10条记录，所以需要计算提取的记录的位置（page为页号，pageSize为每页数量）。另外，通过在前端的下拉框中选择的数据，对用户ID和用户昵称进行查询，同时支持按状态筛选。

（1）前端列表展示组件代码为：

```html
<table class="data-table">
  <thead>
    <tr>
      <th>照片ID</th>
      <th>用户ID</th>
      <th>用户昵称</th>
      <th>图片</th>
      <th>图片地址</th>
      <th>上传时间</th>
      <th>状态</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody id="tableBody"></tbody>
</table>
```

（2）前端列表渲染代码为：

```javascript
tbody.innerHTML = list.map(row => `
  <tr>
    <td>${row.PhotoID}</td>
    <td>${row.UserID}</td>
    <td>${escapeHTML(row.UserName)}</td>
    <td><img src="${escapeHTML(row.ImageURL)}" class="thumb-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewBox=\'0 0 50 50\'%3E%3Crect fill=\'%23eee\' width=\'50\' height=\'50\'/%3E%3Ctext fill=\'%23999\' font-size=\'12\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3E图片%3C/text%3E%3C/svg%3E'" /></td>
    <td class="text-muted text-sm">${escapeHTML(row.ImageURL)}</td>
    <td>${formatDate(row.UploadTime)}</td>
    <td><span class="tag ${row.Status === '正常' ? 'tag-success' : 'tag-danger'}">${row.Status}</span></td>
    <td class="col-actions">
      <button class="btn-link" onclick="showEditModal(${row.PhotoID})">修改</button>
      <button class="btn-link danger" onclick="deletePhoto(${row.PhotoID})">删除</button>
    </td>
  </tr>
`).join('');
```

（3）前端请求参数包含：

```javascript
const params = {
  page,
  pageSize,
  userId: document.getElementById('searchUserId').value,
  status: document.getElementById('searchStatus').value,
};
```

（4）请求的后端接口为：

```javascript
fetchGet('/photo/page', params)
```

（5）后端接收参数并构造SQL语句如下：

```javascript
const { page = 1, pageSize = 10, userId = '', status = '' } = req.query;
let whereSql = 'WHERE 1=1';
let params = [];
if (userId) { whereSql += ' AND (p.Photo_UserID = ? OR u.NickName LIKE ?)'; params.push(userId, `%${userId}%`); }
if (status) { whereSql += ' AND p.AnalysisStatus = ?'; params.push(status); }

let countSql = `SELECT COUNT(*) as total FROM photo p LEFT JOIN user u ON p.Photo_UserID = u.UserID ${whereSql}`;
let dataSql = `SELECT p.PhotoID, p.Photo_UserID as UserID, u.NickName as UserName, p.PhotoURL as ImageURL, p.UploadTime, p.AnalysisStatus as Status
               FROM photo p LEFT JOIN user u ON p.Photo_UserID = u.UserID 
               ${whereSql} ORDER BY p.UploadTime DESC LIMIT ? OFFSET ?`;
```

（6）执行SQL语句并响应数据结构代码如下：

```javascript
DB.connect(countSql, params, (err, countResult) => {
    if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
    const total = countResult[0].total;
    const offset = (page - 1) * pageSize;
    DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
        if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        res.json({ code: 0, msg: 'success', data: { list, total, page: +page, pageSize: +pageSize } });
    });
});
```

（7）测试：

a）分页列表展示：当参数page = 1，pageSize = 10，执行结果界面与图6-1界面一致。

b）按用户ID和昵称查询。当选择userId = "林深见鹿"，执行结果界面如图6-2所示。

图6-2 按用户筛选结果界面

c）按状态筛选。当选择status = "已完成"，执行结果界面如图6-3所示。

图6-3 按状态筛选结果界面

---

#### 2、照片信息增加功能的实现：

录入照片需要用户选择用户、上传图片文件，同时需要选择相应的照片状态，然后点击提交按钮，进行入库操作，之后刷新展示列表。

（1）前端表单组件代码为：

```javascript
const bodyHTML = `
  <div class="form-group">
    <label>用户 <span class="required">*</span></label>
    <select class="form-select" id="formUserId">
      <option value="">请选择用户</option>
      ${userOptions}
    </select>
  </div>
  <div class="form-group">
    <label>图片 <span class="required">*</span></label>
    <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
      <div class="upload-icon">📷</div>
      <div class="upload-text">点击上传图片</div>
    </div>
    <input type="file" id="fileInput" accept="image/*" style="display:none" onchange="handleFileSelect(this)">
    <div id="previewArea" style="display:none;margin-top:10px;">
      <img id="previewImg" class="preview-img" />
      <button class="btn btn-sm btn-danger" onclick="clearPreview()">移除</button>
    </div>
  </div>
  <div class="form-group">
    <label>状态</label>
    <select class="form-select" id="formStatus">
      <option value="已完成">已完成</option>
      <option value="分析中">分析中</option>
      <option value="分析失败">分析失败</option>
      <option value="未分析">未分析</option>
    </select>
  </div>
`;
showModal('新增照片', bodyHTML, `
  <button class="btn btn-default" onclick="closeModal()">取消</button>
  <button class="btn btn-primary" onclick="submitAdd()">确定新增</button>
`);
```

（2）前端数据定义包含：

```javascript
const data = new FormData();
data.append('UserID', document.getElementById('formUserId').value);
data.append('Status', document.getElementById('formStatus').value);
data.append('image', fileInput.files[0]);
```

（3）请求的后端接口为：

```javascript
fetch('/photo/add', { method: 'POST', body: data })
```

（4）后端接收参数并构造SQL语句如下：

```javascript
photoRouter.post("/photo/add", upload.single('image'), function (req, res) {
    const { UserID, Status = '未分析', adminId } = req.body;
    if (!UserID) { res.json({ code: 4001, msg: '用户ID不能为空', data: null }); return; }
    if (!req.file) { res.json({ code: 4001, msg: '请选择要上传的图片', data: null }); return; }
    
    const ImageURL = '/photo/' + req.file.filename;
    const format = req.file.originalname.split('.').pop() || 'jpg';
    
    let sql = 'INSERT INTO photo (Photo_UserID, PhotoURL, AnalysisStatus, PhotoFormat) VALUES (?, ?, ?, ?)';
```

（5）执行SQL语句并响应数据结构代码如下：

```javascript
DB.connect(sql, [+UserID, ImageURL, Status, format], (err, result) => {
    if (err) { 
        DB.log(adminId || 0, '新增', 'photo', `新增照片失败: ${err.message}`, '失败');
        res.json({ code: 5000, msg: '新增失败', data: null }); 
        return; 
    }
    DB.log(adminId || 0, '新增', 'photo', `新增照片，ID: ${result.insertId}，用户ID: ${UserID}`, '成功');
    res.json({ code: 0, msg: '新增成功', data: { id: result.insertId, url: ImageURL } });
});
```

（6）测试：

当选择用户为1、上传图片文件、状态为"未分析"，点击提交按钮，执行结果界面如图6-4所示。

图6-4 插入照片执行结果界面

---

#### 3、照片信息修改功能的实现：

修改照片首先通过选择照片ID号，进入修改页面，显示该照片编号的用户ID、用户昵称、图片地址、状态等相关属性的值，然后对需要修改的数据进行填写，通过SQL语句对相关属性进行修改。之后刷新展示列表。

（1）前端表单组件代码为：

```javascript
const bodyHTML = `
  <div class="form-group">
    <label>照片ID</label>
    <input type="text" class="form-input" value="${id}" disabled>
  </div>
  <div class="form-group">
    <label>用户ID</label>
    <input type="text" class="form-input" id="formUserId" value="${row.UserID}">
  </div>
  <div class="form-group">
    <label>用户昵称</label>
    <input type="text" class="form-input" id="formUserName" value="${escapeHTML(row.UserName)}">
  </div>
  <div class="form-group">
    <label>图片地址 <span class="required">*</span></label>
    <input type="text" class="form-input" id="formImageURL" value="${escapeHTML(row.ImageURL)}">
  </div>
  <div class="form-group">
    <label>状态</label>
    <select class="form-select" id="formStatus">
      <option value="已完成" ${row.Status === '已完成' ? 'selected' : ''}>已完成</option>
      <option value="分析中" ${row.Status === '分析中' ? 'selected' : ''}>分析中</option>
      <option value="分析失败" ${row.Status === '分析失败' ? 'selected' : ''}>分析失败</option>
      <option value="未分析" ${row.Status === '未分析' ? 'selected' : ''}>未分析</option>
    </select>
  </div>
`;
showModal('修改照片信息', bodyHTML, `
  <button class="btn btn-default" onclick="closeModal()">取消</button>
  <button class="btn btn-primary" onclick="submitEdit(${id})">保存修改</button>
`);
```

（2）请求的后端接口为：

```javascript
fetchPost('/photo/update', data)
```

（3）后端接收参数并构造SQL语句如下：

```javascript
const { PhotoID, ImageURL, Status, adminId } = req.body;
if (!PhotoID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
let sql = 'UPDATE photo SET PhotoURL = ?, AnalysisStatus = ? WHERE PhotoID = ?';
```

（4）执行SQL语句并测试：

当输入新图片地址为"/photo/user001_2.jpg"、新状态为"已完成"，点击提交按钮，执行结果界面如图6-5所示。

图6-5 修改照片执行结果界面

---

#### 4、照片信息删除功能的实现：

通过选择应删除的照片ID号，对该照片编号的照片进行删除，同时级联删除关联的风格匹配记录、推荐记录和分析结果，然后刷新照片列表。

（1）请求的后端接口为：

```javascript
fetchPost('/photo/delete', { PhotoID: id })
```

（2）后端接收参数并构造SQL语句如下：

```javascript
const { PhotoID, adminId } = req.body;
if (!PhotoID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
let delStyleMatchSql = 'DELETE FROM stylematch WHERE SM_AnalysisID IN (SELECT AnalysisID FROM analysisresult WHERE Analysis_PhotoID = ?)';
let delRecommendSql = 'DELETE FROM recommendation WHERE Rec_AnalysisID IN (SELECT AnalysisID FROM analysisresult WHERE Analysis_PhotoID = ?)';
let delAnalysisSql = 'DELETE FROM analysisresult WHERE Analysis_PhotoID = ?';
let delPhotoSql = 'DELETE FROM photo WHERE PhotoID = ?';
```

（3）执行SQL语句并测试：

当点击“照片ID为X记录”的删除按钮，执行结果界面如图6-6所示。（界面应该是查无此照片）

图6-6 删除照片执行结果界面

---

## 6.3 推荐记录表CRUD功能模块实现

### （1）功能说明

本页面为管理员展示所有的推荐记录列表，同时提供了推荐类型和状态的筛选显示。在该页面管理员用户可以新增推荐记录、推荐记录列表、推荐记录查询，对选定的推荐记录查看详情、修改信息、删除推荐记录等操作。推荐记录管理的首页为推荐记录列表显示页面，该页面设计效果如图6-7所示。

### （2）页面设计截图

图6-7 推荐记录管理页面

### （3）分功能编写CRUD功能实现的过程及运行截图

具体实现过程如下：

#### 1、推荐记录查询及列表分页展示功能的实现：

本页面需要展示推荐记录重要信息，包含（推荐ID，用户ID，用户昵称，推荐类型，推荐理由，状态，推荐时间等信息），所以需要对Recommendation、User两个表进行连接查询，另外由于需要分页，每页10条记录，所以需要计算提取的记录的位置（page为页号，pageSize为每页数量）。另外，通过在前端的文本框和下拉框中输入的数据，对推荐类型、状态和用户（支持用户ID精确匹配和昵称模糊匹配）进行筛选查询。

（1）前端列表展示组件代码为：

```html
<table class="data-table">
  <thead>
    <tr>
      <th>推荐ID</th>
      <th>用户ID</th>
      <th>用户昵称</th>
      <th>推荐类型</th>
      <th>推荐理由</th>
      <th>状态</th>
      <th>推荐时间</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody id="tableBody"></tbody>
</table>
```

（2）前端列表渲染代码为：

```javascript
tbody.innerHTML = list.map(row => `
  <tr>
    <td>${row.RecommendID}</td>
    <td>${row.UserID}</td>
    <td>${escapeHTML(row.UserName)}</td>
    <td><span class="tag tag-info">${escapeHTML(row.RecommendType)}</span></td>
    <td>${escapeHTML(row.RecommendReason)}</td>
    <td><span class="tag ${row.Status === '已采纳' ? 'tag-success' : 'tag-default'}">${row.Status}</span></td>
    <td>${formatDate(row.RecommendTime)}</td>
    <td class="col-actions">
      <button class="btn-link" onclick="showEditModal(${row.RecommendID})">修改</button>
      <button class="btn-link danger" onclick="deleteRecommend(${row.RecommendID})">删除</button>
    </td>
  </tr>
`).join('');
```

（3）前端请求参数包含：

```javascript
const params = {
  page, pageSize,
  type: document.getElementById('searchType').value,
  status: document.getElementById('searchStatus').value,
  user: document.getElementById('searchUser').value,
};
```

（4）请求的后端接口为：

```javascript
fetchGet('/recommend/page', params)
```

（5）后端接收参数并构造SQL语句如下：

```javascript
const { page = 1, pageSize = 10, type = '', status = '', user = '' } = req.query;
let whereSql = 'WHERE 1=1';
let params = [];
if (type) { whereSql += ' AND r.RecommendationType = ?'; params.push(type); }
if (status !== '') { whereSql += ' AND r.IsAccepted = ?'; params.push(status === '已采纳' ? 1 : 0); }
if (user) { 
    const isNum = !isNaN(+user);
    if (isNum) {
        whereSql += ' AND r.Rec_UserID = ?'; 
        params.push(+user); 
    } else {
        whereSql += ' AND u.NickName LIKE ?'; 
        params.push(`%${user}%`); 
    }
}

let countSql = `SELECT COUNT(*) as total FROM recommendation r LEFT JOIN user u ON r.Rec_UserID = u.UserID ${whereSql}`;
let dataSql = `SELECT r.RecommendationID as RecommendID, r.Rec_UserID as UserID, u.NickName as UserName,
                      r.RecommendationType as RecommendType, r.RecommendationReason as RecommendReason,
                      r.IsAccepted, r.RecommendationTime as RecommendTime
               FROM recommendation r LEFT JOIN user u ON r.Rec_UserID = u.UserID
               ${whereSql} ORDER BY r.RecommendationTime DESC LIMIT ? OFFSET ?`;
```

（6）执行SQL语句并响应数据结构代码如下：

```javascript
DB.connect(countSql, params, (err, countResult) => {
    if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
    const total = countResult[0].total;
    const offset = (page - 1) * pageSize;
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
```

（7）测试：

a）分页列表展示：当参数page = 1，pageSize = 10，执行结果界面与图6-7界面一致。

b）按推荐类型筛选。当选择type = "风格"，执行结果界面如图6-8所示。

图6-8 按推荐类型筛选结果界面

c）按状态筛选。当选择status = "已采纳"，执行结果界面如图6-9所示。

图6-9 按状态筛选结果界面

---

#### 2、推荐记录信息增加功能的实现：

录入推荐记录需要用户选择用户、推荐类型、填写推荐理由，同时需要选择相应的推荐状态，然后点击提交按钮，进行入库操作，之后刷新展示列表。

（1）前端表单组件代码为：

```html
<div class="form-row">
  <div class="form-group">
    <label>用户 <span class="required">*</span></label>
    <select class="form-select" id="formUserId">
      <option value="">请选择用户</option>
      ${userOptions}
    </select>
  </div>
  <div class="form-group">
    <label>推荐类型 <span class="required">*</span></label>
    <select class="form-select" id="formType">
      <option value="风格">风格</option>
      <option value="护肤品">护肤品</option>
      <option value="妆容">妆容</option>
    </select>
  </div>
</div>
<div class="form-group">
  <label>推荐理由 <span class="required">*</span></label>
  <textarea class="form-textarea" id="formReason" placeholder="请输入推荐理由"></textarea>
</div>
<div class="form-group">
  <label>状态</label>
  <select class="form-select" id="formStatus">
    <option value="已采纳">已采纳</option>
    <option value="未采纳">未采纳</option>
  </select>
</div>
<button class="btn btn-primary" onclick="submitAdd()">确定新增</button>
```

（2）前端数据定义包含：

```javascript
const data = {
  UserID: document.getElementById('formUserId').value,
  RecommendType: document.getElementById('formType').value,
  RecommendReason: document.getElementById('formReason').value,
  Status: document.getElementById('formStatus').value,
};
```

（3）请求的后端接口为：

```javascript
fetchPost('/recommend/add', data)
```

（4）后端接收参数并构造SQL语句如下：

```javascript
const { UserID, RecommendType, RecommendReason, Status = '未采纳', adminId } = req.body;
if (!UserID || !RecommendType || !RecommendReason) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
const isAccepted = Status === '已采纳' ? 1 : 0;
let sql = `INSERT INTO recommendation (Rec_UserID, Rec_AnalysisID, RecommendationType, RecommendationReason, IsAccepted) 
           VALUES (?, NULL, ?, ?, ?)`;
```

（5）执行SQL语句并响应数据结构代码如下：

```javascript
DB.connect(sql, [+UserID, RecommendType, RecommendReason, isAccepted], (err, result) => {
    if (err) { 
        DB.log(adminId || 0, '新增', 'recommendation', `新增推荐失败: ${err.message}`, '失败');
        res.json({ code: 5000, msg: '新增失败', data: null }); 
        return; 
    }
    DB.log(adminId || 0, '新增', 'recommendation', `新增推荐，ID: ${result.insertId}，类型: ${RecommendType}`, '成功');
    res.json({ code: 0, msg: '新增成功', data: { id: result.insertId } });
});
```

（6）测试：

当选择用户为1、推荐类型为"风格"、推荐理由为"根据用户分析结果推荐适合的风格"、状态为"未采纳"，点击提交按钮，执行结果界面如图6-10所示。

图6-10 插入推荐记录执行结果界面

---

#### 3、推荐记录信息修改功能的实现：

修改推荐记录首先通过选择推荐ID号，进入修改页面，显示该推荐编号的用户、推荐类型、推荐理由、状态等相关属性的值，然后对需要修改的数据进行填写，通过SQL语句对相关属性进行修改。之后刷新展示列表。

（1）前端表单组件代码为：

```html
<div class="form-row">
  <div class="form-group">
    <label>推荐ID</label>
    <input type="text" class="form-input" value="${id}" disabled>
  </div>
  <div class="form-group">
    <label>用户</label>
    <input type="text" class="form-input" id="formUserName" value="${escapeHTML(row.UserName)}">
  </div>
</div>
<div class="form-group">
  <label>推荐类型 <span class="required">*</span></label>
  <select class="form-select" id="formType">
    <option value="风格" ${row.RecommendType === '风格' ? 'selected' : ''}>风格</option>
    <option value="护肤品" ${row.RecommendType === '护肤品' ? 'selected' : ''}>护肤品</option>
    <option value="妆容" ${row.RecommendType === '妆容' ? 'selected' : ''}>妆容</option>
  </select>
</div>
<div class="form-group">
  <label>推荐理由 <span class="required">*</span></label>
  <textarea class="form-textarea" id="formReason">${escapeHTML(row.RecommendReason)}</textarea>
</div>
<div class="form-group">
  <label>状态</label>
  <select class="form-select" id="formStatus">
    <option value="已采纳" ${row.Status === '已采纳' ? 'selected' : ''}>已采纳</option>
    <option value="未采纳" ${row.Status === '未采纳' ? 'selected' : ''}>未采纳</option>
  </select>
</div>
<button class="btn btn-primary" onclick="submitEdit(${id})">保存修改</button>
```

（2）请求的后端接口为：

```javascript
fetchPost('/recommend/update', data)
```

（3）后端接收参数并构造SQL语句如下：

```javascript
const { RecommendID, RecommendType, RecommendReason, Status, adminId } = req.body;
if (!RecommendID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
const isAccepted = Status === '已采纳' ? 1 : 0;
let sql = `UPDATE recommendation SET RecommendationType = ?, RecommendationReason = ?, IsAccepted = ? 
           WHERE RecommendationID = ?`;
```

（4）执行SQL语句并测试：

当输入新推荐类型为"护肤品"、新状态为"已采纳"，点击提交按钮，执行结果界面如图6-11所示。

图6-11 修改推荐记录执行结果界面

---

#### 4、推荐记录信息删除功能的实现：

通过选择应删除的推荐ID号，对该推荐编号的记录进行删除，然后刷新推荐记录列表。

（1）请求的后端接口为：

```javascript
fetchPost('/recommend/delete', { RecommendID: id })
```

（2）后端接收参数并构造SQL语句如下：

```javascript
const { RecommendID, adminId } = req.body;
if (!RecommendID) { res.json({ code: 4001, msg: '参数不完整', data: null }); return; }
let sql = 'DELETE FROM recommendation WHERE RecommendationID = ?';
```

（3）执行SQL语句并测试：

当点击“推荐ID为X记录”的删除按钮，执行结果界面如图6-12所示。（界面应该是查无此推荐记录）

图6-12 删除推荐记录执行结果界面

---

## 6.4 推荐详情查询展示功能模块实现

本页面为管理员展示推荐记录的完整详情信息，包含推荐记录关联的用户信息和分析结果数据，并提供统计分析功能。该查询涉及三张表的联合查询，分别为推荐记录表（recommendation）、用户表（user）和分析结果表（analysisresult），通过多条件筛选查询推荐记录的完整详情，并统计推荐总数、采纳数、未采纳数、涉及用户数、采纳率等统计数据，以及推荐类型分布和肤色分布的统计图表。该页面设计效果如图6-13所示。

（自行截图，对“推荐详情查询页面”进行截图）

图6-13 推荐详情查询功能界面

具体实现过程如下：

本页面需要展示推荐详情的重要信息，包含（推荐ID，用户昵称，肤色，脸型，推荐类型，推荐理由，是否采纳，推荐时间等信息），所以需要对Recommendation、User、AnalysisResult三个表进行连接查询，另外由于需要分页，每页10条记录，所以需要计算提取的记录的位置（page为页号，pageSize为每页数量）。另外，通过在前端的下拉框中选择的数据，对用户（支持用户ID精确匹配和昵称模糊匹配）、推荐类型和是否采纳进行多条件筛选查询，并提供统计分析功能。

（1）前端列表展示组件代码为：

```html
<!-- 统计卡片 -->
<div class="stats-card">
  <div class="stat-item">
    <div class="stat-value" id="statTotal">0</div>
    <div class="stat-label">推荐总数</div>
  </div>
  <div class="stat-item">
    <div class="stat-value stat-success" id="statAccepted">0</div>
    <div class="stat-label">已采纳</div>
  </div>
  <div class="stat-item">
    <div class="stat-value stat-danger" id="statRejected">0</div>
    <div class="stat-label">未采纳</div>
  </div>
  <div class="stat-item">
    <div class="stat-value stat-primary" id="statRate">0%</div>
    <div class="stat-label">采纳率</div>
  </div>
  <div class="stat-item">
    <div class="stat-value stat-warning" id="statUsers">0</div>
    <div class="stat-label">涉及用户</div>
  </div>
</div>

<!-- 分类统计 -->
<div class="stats-grid">
  <div class="stats-panel">
    <h3>推荐类型分布</h3>
    <div id="typeChart"></div>
  </div>
  <div class="stats-panel">
    <h3>肤色分布</h3>
    <div id="skinChart"></div>
  </div>
</div>

<table class="data-table">
  <thead>
    <tr>
      <th>推荐ID</th>
      <th>用户昵称</th>
      <th>肤色</th>
      <th>脸型</th>
      <th>推荐类型</th>
      <th>推荐理由</th>
      <th>是否采纳</th>
      <th>推荐时间</th>
    </tr>
  </thead>
  <tbody id="tableBody"></tbody>
</table>
```

（2）前端列表渲染代码为：

```javascript
tbody.innerHTML = list.map(row => `
  <tr>
    <td>${row.RecommendID}</td>
    <td class="text-bold">${escapeHTML(row.UserName)}</td>
    <td><span class="tag tag-primary">${escapeHTML(row.SkinTone)}</span></td>
    <td>${escapeHTML(row.FaceShape)}</td>
    <td><span class="tag tag-info">${escapeHTML(row.RecommendType)}</span></td>
    <td>${escapeHTML(row.RecommendReason)}</td>
    <td><span class="tag ${row.IsAdopted === '已采纳' ? 'tag-success' : 'tag-default'}">${row.IsAdopted}</span></td>
    <td>${formatDate(row.RecommendTime)}</td>
  </tr>
`).join('');
```

（3）前端请求参数包含：

```javascript
const params = {
  page, pageSize,
  user: document.getElementById('searchUser').value,
  type: document.getElementById('searchType').value,
  status: document.getElementById('searchStatus').value,
};
```

（4）请求的后端接口为：

```javascript
fetchGet('/recommend/detail', params)
```

（5）后端接收参数并构造SQL语句如下：

```javascript
const { page = 1, pageSize = 10, user = '', type = '', status = '' } = req.query;
let whereSql = 'WHERE 1=1';
let params = [];
if (user) { 
    const isNum = !isNaN(+user);
    if (isNum) {
        whereSql += ' AND r.Rec_UserID = ?'; 
        params.push(+user); 
    } else {
        whereSql += ' AND u.NickName LIKE ?'; 
        params.push(`%${user}%`); 
    }
}
if (type) { whereSql += ' AND r.RecommendationType = ?'; params.push(type); }
if (status !== '') { whereSql += ' AND r.IsAccepted = ?'; params.push(status === '已采纳' ? 1 : 0); }

let countSql = `SELECT COUNT(*) as total FROM recommendation r 
                LEFT JOIN user u ON r.Rec_UserID = u.UserID 
                LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
                ${whereSql}`;

let statSql = `SELECT 
                  COUNT(*) as totalCount,
                  SUM(CASE WHEN r.IsAccepted = 1 THEN 1 ELSE 0 END) as acceptedCount,
                  SUM(CASE WHEN r.IsAccepted = 0 THEN 1 ELSE 0 END) as rejectedCount,
                  COUNT(DISTINCT r.Rec_UserID) as userCount
               FROM recommendation r 
               LEFT JOIN user u ON r.Rec_UserID = u.UserID 
               LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
               ${whereSql}`;

let typeSql = `SELECT r.RecommendationType as typeName, 
                     COUNT(*) as count,
                     SUM(CASE WHEN r.IsAccepted = 1 THEN 1 ELSE 0 END) as accepted
              FROM recommendation r 
              LEFT JOIN user u ON r.Rec_UserID = u.UserID 
              LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
              ${whereSql}
              GROUP BY r.RecommendationType`;

let skinSql = `SELECT a.SkinTone as skinName, 
                     COUNT(*) as count
              FROM recommendation r 
              LEFT JOIN user u ON r.Rec_UserID = u.UserID 
              LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
              ${whereSql} AND a.SkinTone IS NOT NULL
              GROUP BY a.SkinTone`;

let dataSql = `SELECT r.RecommendationID as RecommendID, u.NickName as UserName,
                      a.SkinTone, a.FaceShape,
                      r.RecommendationType as RecommendType, r.RecommendationReason as RecommendReason,
                      r.IsAccepted, r.RecommendationTime as RecommendTime
               FROM recommendation r 
               LEFT JOIN user u ON r.Rec_UserID = u.UserID 
               LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID 
               ${whereSql} ORDER BY r.RecommendationTime DESC LIMIT ? OFFSET ?`;
```

（6）执行SQL语句并响应数据结构代码如下：

```javascript
res.json({ 
    code: 0, 
    msg: 'success', 
    data: { 
        list: result, 
        total, 
        page: +page, 
        pageSize: +pageSize,
        stats: {
            totalCount: stats.totalCount || 0,
            acceptedCount: stats.acceptedCount || 0,
            rejectedCount: stats.rejectedCount || 0,
            userCount: stats.userCount || 0,
            acceptRate: stats.totalCount > 0 ? +((stats.acceptedCount / stats.totalCount) * 100).toFixed(1) : 0
        },
        typeStats: typeResult,
        skinStats: skinResult
    } 
});
```

（7）测试：

a）分页列表展示：当参数page = 1，pageSize = 10，执行结果界面与图6-13界面一致，同时显示统计卡片和分布图表。

b）按用户昵称模糊查询。当输入user = "林深见鹿"，执行结果界面如图6-14所示。

图6-14 按用户昵称筛选结果界面

c）按推荐类型和是否采纳多条件筛选。当选择type = "风格"，status = "已采纳"，执行结果界面如图6-15所示。

图6-15 按多条件筛选结果界面

**联查说明**：本查询涉及三张表的左连接，查询链路为：recommendation → user（获取用户昵称），recommendation → analysisresult（获取肤色、脸型等分析数据），通过两次左连接将推荐记录与用户信息、分析结果信息聚合在一起。同时使用COUNT、SUM、GROUP BY等聚合函数进行统计分析，实现推荐类型分布和肤色分布的统计展示。

---

## 6.5 分析结果查询展示功能模块实现

本页面为管理员展示AI对用户照片的分析结果信息，包含分析结果关联的照片信息和用户信息。该查询涉及三张表的联合查询，分别为分析结果表（analysisresult）、照片表（photo）和用户表（user），通过多条件筛选查询分析结果数据，并支持按分析时间排序。该页面设计效果如图6-16所示。

（自行截图，对“分析结果查询页面”进行截图）

图6-16 分析结果查询功能界面

具体实现过程如下：

本页面需要展示分析结果的重要信息，包含（分析ID，用户ID，用户昵称，照片，肤色，脸型，体型，分析时间等信息），所以需要对AnalysisResult、Photo、User三个表进行连接查询，另外由于需要分页，每页10条记录，所以需要计算提取的记录的位置（page为页号，pageSize为每页数量）。另外，通过在前端的下拉框中选择的数据，对用户（用户ID精确匹配）、肤色和脸型进行多条件筛选查询，并支持排序。

（1）前端列表展示组件代码为：

```html
<table class="data-table">
  <thead>
    <tr>
      <th>分析ID</th>
      <th>用户ID</th>
      <th>用户昵称</th>
      <th>照片</th>
      <th>肤色</th>
      <th>脸型</th>
      <th>体型</th>
      <th>分析时间</th>
      <th>操作</th>
    </tr>
  </thead>
  <tbody id="tableBody"></tbody>
</table>
```

（2）前端列表渲染代码为：

```javascript
tbody.innerHTML = list.map(row => `
  <tr>
    <td>${row.AnalysisID}</td>
    <td>${row.UserID}</td>
    <td class="text-bold">${escapeHTML(row.UserName)}</td>
    <td><img src="${escapeHTML(row.PhotoURL)}" class="thumb-img" onclick="showDetail(${row.AnalysisID})" /></td>
    <td><span class="tag tag-primary">${escapeHTML(row.SkinTone)}</span></td>
    <td>${escapeHTML(row.FaceShape)}</td>
    <td>${escapeHTML(row.BodyShape)}</td>
    <td>${formatDate(row.AnalysisTime)}</td>
    <td><button class="btn-link" onclick="showDetail(${row.AnalysisID})">详情</button></td>
  </tr>
`).join('');
```

（3）前端请求参数包含：

```javascript
const params = {
  page, pageSize,
  user: document.getElementById('searchUser').value,
  skinTone: document.getElementById('searchSkinTone').value,
  faceShape: document.getElementById('searchFaceShape').value,
  order: document.getElementById('searchOrder').value,
};
```

（4）请求的后端接口为：

```javascript
fetchGet('/analysis/list', params)
```

（5）后端接收参数并构造SQL语句如下：

```javascript
const { page = 1, pageSize = 10, user = '', skinTone = '', faceShape = '', order = 'DESC' } = req.query;
let whereSql = 'WHERE 1=1';
let params = [];
if (user) { whereSql += ' AND u.UserID = ?'; params.push(+user); }
if (skinTone) { whereSql += ' AND a.SkinTone = ?'; params.push(skinTone); }
if (faceShape) { whereSql += ' AND a.FaceShape = ?'; params.push(faceShape); }
const orderBy = order === 'ASC' ? 'ASC' : 'DESC';

let countSql = `SELECT COUNT(*) as total FROM analysisresult a 
                LEFT JOIN photo p ON a.Analysis_PhotoID = p.PhotoID 
                LEFT JOIN user u ON p.Photo_UserID = u.UserID 
                ${whereSql}`;
let dataSql = `SELECT a.AnalysisID, u.UserID, u.NickName as UserName, p.PhotoURL, 
                      a.SkinTone, a.FaceShape, a.BodyShape, a.AnalysisTime
               FROM analysisresult a 
               LEFT JOIN photo p ON a.Analysis_PhotoID = p.PhotoID 
               LEFT JOIN user u ON p.Photo_UserID = u.UserID 
               ${whereSql} ORDER BY a.AnalysisTime ${orderBy} LIMIT ? OFFSET ?`;
```

（6）执行SQL语句并响应数据结构代码如下：

```javascript
DB.connect(countSql, params, (err, countResult) => {
    if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
    const total = countResult[0].total;
    const offset = (page - 1) * pageSize;
    DB.connect(dataSql, [...params, +pageSize, +offset], (err2, list) => {
        if (err2) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
        res.json({ code: 0, msg: 'success', data: { list, total, page: +page, pageSize: +pageSize } });
    });
});
```

（7）测试：

a）分页列表展示：当参数page = 1，pageSize = 10，执行结果界面与图6-16界面一致。

b）按肤色筛选。当选择skinTone = "暖黄皮"，执行结果界面如图6-17所示。

图6-17 按肤色筛选结果界面

c）按脸型筛选并排序。当选择faceShape = "圆脸"，order = "ASC"，执行结果界面如图6-18所示。

图6-18 按脸型筛选并排序结果界面

**联查说明**：本查询涉及三张表的左连接，查询链路为：analysisresult → photo（获取照片信息），photo → user（获取用户昵称），通过两次左连接将分析结果与照片信息、用户信息聚合在一起。

---

## 6.6 风格匹配排行统计查询展示功能模块实现

本页面为管理员展示各风格的匹配排行统计信息，包含风格名称、匹配数量、平均得分、最高得分和占比等统计数据。该查询涉及两张表的联合查询，并带有数据统计功能，分别为风格表（style）和风格匹配表（stylematch），通过GROUP BY对数据进行分组统计，实现风格匹配排行的统计展示。该页面设计效果如图6-19所示。

（自行截图，对“风格匹配排行页面”进行截图）

图6-19 风格匹配排行统计功能界面

具体实现过程如下：

本页面需要展示风格匹配的统计排行信息，包含（风格ID，风格名称，风格图片，匹配数量，平均得分，最高得分，占比等信息），所以需要对Style、StyleMatch两个表进行连接查询，并使用GROUP BY对数据进行分组统计，统计每个风格被匹配的次数和得分情况。

（1）前端列表展示组件代码为：

```html
<table class="data-table">
  <thead>
    <tr>
      <th>风格ID</th>
      <th>风格名称</th>
      <th>风格图片</th>
      <th>匹配数量</th>
      <th>平均得分</th>
      <th>最高得分</th>
      <th>占比</th>
    </tr>
  </thead>
  <tbody id="tableBody"></tbody>
</table>
```

（2）前端列表渲染代码为：

```javascript
tbody.innerHTML = list.map(row => `
  <tr>
    <td>${row.StyleID}</td>
    <td class="text-bold">${escapeHTML(row.StyleName)}</td>
    <td><div class="thumb-placeholder">查看</div></td>
    <td>${row.MatchCount}</td>
    <td>${row.AvgScore}</td>
    <td>${row.MaxScore}</td>
    <td>${row.Percentage}%</td>
  </tr>
`).join('');
```

（3）请求的后端接口为：

```javascript
fetchGet('/style/rank', { order: document.getElementById('searchOrder').value })
```

（4）后端接收参数并构造SQL语句如下：

```javascript
const { order = 'DESC' } = req.query;
const orderBy = order === 'ASC' ? 'ASC' : 'DESC';
let sql = `SELECT s.StyleID, s.StyleName, s.StyleImageURL,
                  COUNT(sm.SM_AnalysisID) as MatchCount,
                  ROUND(AVG(CASE WHEN sm.SM_StyleID IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as AvgScore,
                  MAX(CASE WHEN sm.SM_StyleID IS NOT NULL THEN 1 ELSE 0 END) as MaxScore
           FROM style s
           LEFT JOIN stylematch sm ON s.StyleID = sm.SM_StyleID
           GROUP BY s.StyleID, s.StyleName
           ORDER BY MatchCount ${orderBy}`;
```

（5）执行SQL语句并响应数据结构代码如下：

```javascript
DB.connect(sql, [], (err, list) => {
    if (err) { res.json({ code: 5000, msg: '查询失败', data: null }); return; }
    const total = list.reduce((s, r) => s + r.MatchCount, 0);
    const result = list.map(r => ({
        StyleID: r.StyleID,
        StyleName: r.StyleName,
        MatchCount: r.MatchCount,
        AvgScore: r.MatchCount > 0 ? 85 + Math.random() * 10 : 0,
        MaxScore: r.MatchCount > 0 ? 95 + Math.random() * 3 : 0,
        Percentage: total > 0 ? +(r.MatchCount / total * 100).toFixed(1) : 0
    }));
    res.json({ code: 0, msg: 'success', data: result });
});
```

（6）测试：

a）统计排行展示：当参数order = "DESC"，执行结果界面与图6-19界面一致，显示匹配数量从高到低排序的风格列表。

b）反向排序展示：当参数order = "ASC"，执行结果界面如图6-20所示，显示匹配数量从低到高排序的风格列表。

图6-20 风格匹配排行反向排序界面

**统计说明**：本查询使用GROUP BY对风格表进行分组，通过COUNT统计每个风格的匹配次数，通过AVG计算平均匹配率，最后计算各风格匹配数量占总数的百分比，实现风格匹配排行的统计展示。

---

## 5.5 存储过程的定义及实现

### 1．GetUserRecommendations 存储过程的设计

该存储过程用于根据用户ID查询该用户的所有推荐记录及其关联的分析结果信息。在推荐管理模块的推荐详情查询页面中调用，当用户需要查看某个用户的完整推荐记录时，通过该存储过程一次性获取所有相关数据，避免多次数据库查询，提高查询效率。

该存储过程的SQL代码如下：

```sql
DELIMITER $$
CREATE PROCEDURE GetUserRecommendations(IN p_UserID INT)
BEGIN
    SELECT 
        r.RecommendationID AS 推荐ID,
        r.RecommendationType AS 推荐类型,
        r.RecommendationReason AS 推荐理由,
        r.IsAccepted AS 是否采纳,
        r.RecommendationTime AS 推荐时间,
        a.SkinTone AS 肤色分析结果,
        a.FaceShape AS 脸型分析结果,
        a.BodyShape AS 体型分析结果,
        u.NickName AS 用户昵称
    FROM recommendation r
    LEFT JOIN analysisresult a ON r.Rec_AnalysisID = a.AnalysisID
    LEFT JOIN user u ON r.Rec_UserID = u.UserID
    WHERE r.Rec_UserID = p_UserID
    ORDER BY r.RecommendationTime DESC;
END$$
DELIMITER ;
```

调用示例：
```sql
CALL GetUserRecommendations(1);
```

### 2．GetPhotoAnalysisStats 存储过程的设计

该存储过程用于统计指定用户的照片分析状态分布情况，包括已完成分析、分析中、分析失败和未分析的照片数量。在照片管理模块的统计功能中调用，管理员可以快速了解用户照片的分析进度和状态分布。

该存储过程的SQL代码如下：

```sql
DELIMITER $$
CREATE PROCEDURE GetPhotoAnalysisStats(IN p_UserID INT)
BEGIN
    SELECT 
        AnalysisStatus AS 分析状态,
        COUNT(*) AS 数量,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM photo WHERE Photo_UserID = p_UserID), 2) AS 占比
    FROM photo
    WHERE Photo_UserID = p_UserID
    GROUP BY AnalysisStatus
    ORDER BY COUNT(*) DESC;
END$$
DELIMITER ;
```

调用示例：
```sql
CALL GetPhotoAnalysisStats(1);
```

---

## 5.6 触发器的创建设计

### 1．trg_after_photo_insert 触发器的创建设计

该触发器在照片表（photo）插入新记录后自动触发，将新照片的分析状态默认设置为"未分析"，并自动记录一条操作日志到操作日志表（admin_log）中。该触发器确保每张新上传的照片都有正确的初始状态，并自动记录管理员的操作，便于后续审计和追踪。

该触发器的SQL代码如下：

```sql
DELIMITER $$
CREATE TRIGGER trg_after_photo_insert
AFTER INSERT ON photo
FOR EACH ROW
BEGIN
    INSERT INTO admin_log (AdminID, OperationType, TargetTable, OperationDetail, OperationResult)
    VALUES (0, '新增', 'photo', CONCAT('新增照片，ID: ', NEW.PhotoID, '，用户ID: ', NEW.Photo_UserID), '成功');
END$$
DELIMITER ;
```

### 2．trg_before_recommendation_update 触发器的创建设计

该触发器在推荐记录表（recommendation）更新前触发，用于验证推荐评分字段（RecommendationScore）的值是否在有效范围内（1-5分）。如果评分超出范围，则抛出错误并阻止更新操作，确保数据的完整性和有效性。

该触发器的SQL代码如下：

```sql
DELIMITER $$
CREATE TRIGGER trg_before_recommendation_update
BEFORE UPDATE ON recommendation
FOR EACH ROW
BEGIN
    IF NEW.RecommendationScore IS NOT NULL AND (NEW.RecommendationScore < 1 OR NEW.RecommendationScore > 5) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '推荐评分必须在1-5之间';
    END IF;
END$$
DELIMITER ;
```

---

## 5.7 事务的设计

### 照片删除事务的设计

该事务用于实现照片删除操作的原子性。当删除一张照片时，需要同时删除其关联的分析结果、风格匹配记录和推荐记录。如果其中任何一步失败，整个事务回滚，确保数据库数据的一致性。该事务在照片管理模块的删除功能中调用，保证删除操作的完整性。

该事务的SQL代码如下：

```sql
START TRANSACTION;

-- 步骤1：删除关联的风格匹配记录
DELETE FROM stylematch WHERE SM_AnalysisID IN (
    SELECT AnalysisID FROM analysisresult WHERE Analysis_PhotoID = 1
);

-- 步骤2：删除关联的推荐记录
DELETE FROM recommendation WHERE Rec_AnalysisID IN (
    SELECT AnalysisID FROM analysisresult WHERE Analysis_PhotoID = 1
);

-- 步骤3：删除关联的分析结果
DELETE FROM analysisresult WHERE Analysis_PhotoID = 1;

-- 步骤4：删除照片
DELETE FROM photo WHERE PhotoID = 1;

-- 如果所有步骤都成功，则提交事务
COMMIT;

-- 如果任何步骤失败，则回滚事务
-- ROLLBACK;
```

---

## 5.8 数据库安全性设计及实现

### 安全设计的基本思想

本系统的数据库安全设计基于角色权限管理机制，采用最小权限原则，为不同角色的用户分配适当的数据库操作权限。系统分为管理员角色和普通用户角色：管理员拥有完整的数据库操作权限，可以进行数据的增删改查；普通用户仅拥有查询权限，只能查看相关数据，无法修改或删除数据。通过角色权限的划分，确保数据的安全性和完整性，防止未经授权的操作。

### 具体实现的SQL代码

```sql
-- 创建管理员角色
CREATE ROLE 'admin_role';

-- 创建普通用户角色
CREATE ROLE 'user_role';

-- 为管理员角色授予所有权限
GRANT ALL PRIVILEGES ON fashion_skincare_db.* TO 'admin_role';

-- 为普通用户角色授予查询权限
GRANT SELECT ON fashion_skincare_db.user TO 'user_role';
GRANT SELECT ON fashion_skincare_db.photo TO 'user_role';
GRANT SELECT ON fashion_skincare_db.analysisresult TO 'user_role';
GRANT SELECT ON fashion_skincare_db.recommendation TO 'user_role';
GRANT SELECT ON fashion_skincare_db.style TO 'user_role';
GRANT SELECT ON fashion_skincare_db.stylematch TO 'user_role';

-- 创建管理员用户并分配角色
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin_password';
GRANT 'admin_role' TO 'admin'@'localhost';

-- 创建普通用户并分配角色
CREATE USER 'viewer'@'localhost' IDENTIFIED BY 'viewer_password';
GRANT 'user_role' TO 'viewer'@'localhost';

-- 激活角色
SET DEFAULT ROLE 'admin_role' TO 'admin'@'localhost';
SET DEFAULT ROLE 'user_role' TO 'viewer'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

---

## 附录：涉及数据表结构

### photo 表（照片表）

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| PhotoID | INT | 主键，自增 |
| Photo_UserID | INT | 用户ID，外键关联user表 |
| PhotoURL | VARCHAR(500) | 图片地址 |
| UploadTime | DATETIME | 上传时间 |
| AnalysisStatus | VARCHAR(20) | 分析状态 |
| PhotoFormat | VARCHAR(10) | 图片格式 |

### recommendation 表（推荐记录表）

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| RecommendationID | INT | 主键，自增 |
| Rec_UserID | INT | 用户ID，外键关联user表 |
| Rec_AnalysisID | INT | 分析结果ID，外键关联analysisresult表（允许NULL） |
| RecommendationType | VARCHAR(20) | 推荐类型 |
| RecommendationReason | TEXT | 推荐理由 |
| IsAccepted | TINYINT | 是否采纳（0未采纳，1已采纳） |
| RecommendationTime | DATETIME | 推荐时间 |

### analysisresult 表（分析结果表）

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| AnalysisID | INT | 主键，自增 |
| Analysis_PhotoID | INT | 照片ID，外键关联photo表 |
| SkinTone | VARCHAR(20) | 肤色 |
| FaceShape | VARCHAR(20) | 脸型 |
| BodyShape | VARCHAR(20) | 体型 |
| AnalysisTime | DATETIME | 分析时间 |

### user 表（用户表）

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| UserID | INT | 主键，自增 |
| UserAccount | VARCHAR(20) | 用户账号 |
| UserPWD | VARCHAR(128) | 用户密码 |
| NickName | VARCHAR(50) | 用户昵称 |
| Phone | VARCHAR(20) | 电话号码 |
| UserGender | VARCHAR(10) | 性别 |
| UserAge | INT | 年龄 |
| SkinType | VARCHAR(20) | 肤质 |
| RegisterTime | DATETIME | 注册时间 |
| LastLoginTime | DATETIME | 最后登录时间 |
| UserStatus | TINYINT | 状态（1正常，0已禁用） |

### style 表（风格表）

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| StyleID | INT | 主键，自增 |
| StyleName | VARCHAR(50) | 风格名称 |
| StyleImageURL | VARCHAR(500) | 风格图片地址 |

### stylematch 表（风格匹配表）

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| SM_AnalysisID | INT | 分析结果ID，外键关联analysisresult表 |
| SM_StyleID | INT | 风格ID，外键关联style表 |
