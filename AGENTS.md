# Agent 文档：AnalyticBeauty 项目助手

## 1. 目的

本文档描述了一个用于 `AnalyticBeauty` 项目的 AI 代理（agent），用于指导开发、维护、调试和扩展此美容数据分析 Web 应用。

代理应当理解项目结构、业务场景、常用改造点，并按照以下规则提供建议和改动。

## 2. 项目概述

`AnalyticBeauty` 是一个基于 Node.js/Express 的 Web 应用，提供如下核心功能：

- 用户身份与系统页面管理
- 照片上传与管理
- 风格推荐与排行榜
- 护肤/分析/推荐/风格模块展示
- 后端路由逻辑在 `routes/` 目录中
- 静态页面与前端资源在 `public/` 目录中

主要文件：

- `app.js` - 应用入口，静态资源服务，路由注册
- `package.json` - 依赖信息与启动脚本
- `public/` - 页面模板、静态资源、前端脚本、CSS
- `routes/` - 各业务模块路由定义
- `config/` - 上传等配置
- `db/` - 数据库配置

## 3. 代理目标

代理应执行以下任务：

- 帮助阅读与理解现有功能
- 生成或改进用户界面与路由逻辑
- 修复前后端交互错误
- 优化文件路径、静态资源、表单提交流程
- 建议或实施安全与性能改进
- 根据用户需求给出最少改动的解决方案

## 4. 代理使用方式

### 4.1 询问方式

用户可以直接提出问题或需求，例如：

- “帮我修复照片上传页面的问题”
- “请给我补充推荐页面的后端路由”
- “帮我重构 `routes/photoRouter.js`”
- “请在 `public/photo.html` 增加图片预览功能”

### 4.2 响应要求

代理需要：

- 先阅读相关文件，确认项目上下文
- 精确说明修改内容与修改位置
- 优先使用现有代码风格
- 提供可直接应用的补丁或完整文件

## 5. 交互规范

代理在提供修改建议时，应包含：

- 变更文件名
- 变更内容概要
- 若有风险，明确说明
- 尽量不改变与需求无关的代码

示例回复格式：

- 修改 `public/photo.html`：增加表单 `enctype="multipart/form-data"`
- 修改 `routes/photoRouter.js`：补充 `multer` 上传逻辑
- 说明测试方式：启动 `node app.js` 后访问 `http://127.0.0.1:8080/photo.html`

## 6. 常见任务清单

### 6.1 前端页面改进

- 修复表单提交设置
- 添加页面间跳转链接
- 补充前端输入校验
- 修正路径引用错误

### 6.2 后端路由与数据处理

- 找到并修复 Express 路由错误
- 修复文件上传与 `multer` 逻辑
- 优化数据库查询与参数接收
- 增加日志打印与错误处理

### 6.3 配置与运行

- 确保 `npm install` 后可运行
- 启动方式：`node app.js`
- 访问地址：`http://127.0.0.1:8080`

## 7. 页面映射与文件分析

### 7.1 photo.html - 照片管理

- 前端文件：`public/photo.html`
  - 搜索、分页、表格渲染逻辑
  - `showAddModal()` / `submitAdd()` 实现图片上传和新增照片
  - `showEditModal()` / `submitEdit()` / `deletePhoto()` 实现修改和删除
  - `loadUserList()` 通过 `/user/list` 填充用户下拉
- 公共前端：`public/js/common.js`
  - `fetchGet()` / `fetchPost()` 封装 API 请求
  - `showModal()` / `closeModal()` / `renderPagination()` 等通用 UI
- 后端路由：`routes/photoRouter.js`
  - `GET /photo/page` 查询照片列表
  - `POST /photo/add` 接收 `FormData` 图片上传
  - `POST /photo/update` 修改图片 URL 与分析状态
  - `POST /photo/delete` 删除照片及关联分析/推荐数据
- 重要备注：`photo.html` 的上传按钮依赖 `FormData`，而后端路由使用 `multer` 处理 `image` 字段。

### 7.2 recommend.html - 推荐记录管理

- 前端文件：`public/recommend.html`
  - 查询过滤：推荐类型、状态、用户
  - 新增/修改/删除推荐记录的模态框和提交逻辑
  - `loadUserList()` 通过 `/user/list` 填充用户选择
- 后端路由：`routes/recommendRouter.js`
  - `GET /recommend/page` 查询推荐列表
  - `POST /recommend/add` 新增推荐记录
  - `POST /recommend/update` 修改推荐记录
  - `POST /recommend/delete` 删除推荐记录
- 关联页面：`public/recommend-detail.html` 使用 `GET /recommend/detail` 读取推荐详情数据

### 7.3 recommend-detail.html - 推荐详情查询

- 前端文件：`public/recommend-detail.html`
  - 查询用户、推荐类型、采纳状态
  - 调用 `GET /recommend/detail` 获取含分析结果的推荐详情
- 后端路由：`routes/recommendRouter.js`
  - `GET /recommend/detail` 合并 `recommendation`、`user`、`analysisresult` 查询结果

### 7.4 user.html - 用户管理

- 前端文件：`public/user.html`
  - 查询用户列表、分页、表格渲染
  - 新增/修改/删除用户的模态框逻辑
  - 注意：页面内 `submitAdd()` / `submitEdit()` / `deleteUser()` 调用 `/user/add`、`/user/update`、`/user/delete`
- 后端路由：`routes/userRouter.js`
  - 已实现：`GET /user/list`、`GET /user/login`、`GET /user/page`
  - 未实现：`POST /user/add`、`POST /user/update`、`POST /user/delete`
- 重要备注：当前 `user.html` 部分操作依赖尚未实现的后端接口，可能需要补写该路由或前端改为模拟数据。

### 7.5 style.html - 风格标签管理

- 前端文件：`public/style.html`
  - 风格列表查询与搜索
  - 新增/修改/删除风格模态框和提交逻辑
- 后端路由：`routes/styleRouter.js`
  - `GET /style/list` 查询风格列表
  - `POST /style/add` 新增风格
  - `POST /style/update` 修改风格
  - `POST /style/delete` 删除风格

### 7.6 analysis.html - AI分析结果查询

- 前端文件：`public/analysis.html`
  - 查询用户、肤色、脸型、排序方式
  - 调用 `GET /analysis/list` 获取分析结果
- 后端路由：`routes/analysisRouter.js`
  - `GET /analysis/list` 合并 `analysisresult`、`photo`、`user` 数据

### 7.7 style-rank.html - 风格匹配排行

- 前端文件：`public/style-rank.html`
  - 渲染排行图和表格
  - 调用 `GET /style/rank`
- 后端路由：`routes/analysisRouter.js`
  - `GET /style/rank` 查询 `style`、`stylematch` 并返回排行统计

### 7.8 skincare.html - 护肤产品管理

- 前端文件：`public/skincare.html`
  - 查询品牌、价格区间、肤质、功效
  - 新增/修改/删除护肤产品
- 后端路由：`routes/skincareRouter.js`
  - `GET /skincare/page` 查询产品列表
  - `POST /skincare/add` 新增产品
  - `POST /skincare/update` 修改产品
  - `POST /skincare/delete` 删除产品

### 7.9 bundle-detail.html - 护肤套装详情查询

- 前端文件：`public/bundle-detail.html`
  - 查询套装名称与肤质
  - 渲染套装及内含产品明细
- 后端路由：`routes/skincareRouter.js`
  - `GET /bundle/detail` 查询套装及对应产品项

### 7.10 admin.html - 管理员管理

- 前端文件：`public/admin.html`
  - 查询管理员账号、角色
  - 新增、修改、重置密码、删除管理员
- 后端路由：`routes/systemRouter.js`
  - `GET /admin/page` 查询管理员列表
  - `POST /admin/add` 新增管理员
  - `POST /admin/update` 修改管理员 / 重置密码
  - `POST /admin/delete` 删除管理员

### 7.11 log.html - 操作日志统计

- 前端文件：`public/log.html`
  - 查询日志记录、分页显示
  - 调用 `GET /log/page` 和 `GET /log/stats`
- 后端路由：`routes/systemRouter.js`
  - `GET /log/page` 查询日志分页
  - `GET /log/stats` 查询日志统计数据

### 7.12 login.html - 登录页

- 前端文件：`public/login.html`
  - 管理员登录表单
  - 使用 `GET /user/login` 或 `POST /user/login` 登录
- 后端路由：`routes/userRouter.js`
  - `GET /user/login` 管理员登录
  - `POST /user/login` 管理员登录

## 8. 附加说明

- 代理应熟悉 `commonjs` 模块体系
- 代理应理解静态资源由 `express.static(__dirname + "/public")` 提供
- 代理应避免引入与现有依赖不兼容的新模块，除非用户明确允许

---

> 备注：本文件为项目内代理使用说明，可作为后续开发时与 AI 助手协作的参考。