/**
 * 美丽推荐平台后台管理系统 - 通用工具库
 */

// ==================== 侧边栏菜单配置 ====================
const MENU_CONFIG = [
  { group: '概览', items: [
    { key: 'dashboard', title: '工作台', icon: '🏠', href: 'index.html' },
  ]},
  { group: '业务管理', items: [
    { key: 'user', title: '用户管理', icon: '👤', href: 'user.html' },
    { key: 'photo', title: '照片管理', icon: '📷', href: 'photo.html', badge: 'CRUD' },
    { key: 'analysis-group', title: 'AI分析管理', icon: '📊', children: [
      { key: 'analysis', title: '分析结果查询', href: 'analysis.html', badge: '复杂查询' },
      { key: 'style-rank', title: '风格匹配排行', href: 'style-rank.html', badge: '复杂查询' },
    ]},
    { key: 'recommend-group', title: '推荐管理', icon: '💡', children: [
      { key: 'recommend', title: '推荐记录管理', href: 'recommend.html', badge: 'CRUD' },
      { key: 'recommend-detail', title: '推荐详情查询', href: 'recommend-detail.html', badge: '复杂查询' },
    ]},
    { key: 'skincare-group', title: '护肤品管理', icon: '🧴', children: [
      { key: 'skincare', title: '产品信息管理', href: 'skincare.html', badge: 'CRUD' },
      { key: 'bundle-detail', title: '套装详情查询', href: 'bundle-detail.html', badge: '复杂查询' },
    ]},
    { key: 'style', title: '风格管理', icon: '🎨', href: 'style.html', badge: 'CRUD' },
  ]},
  { group: '系统管理', items: [
    { key: 'admin-group', title: '系统管理', icon: '⚙️', children: [
      { key: 'admin', title: '管理员管理', href: 'admin.html', badge: 'CRUD' },
      { key: 'log', title: '操作日志统计', href: 'log.html', badge: '复杂查询' },
    ]},
    { key: 'exercise', title: '运动管理', icon: '🏃', href: 'exercise.html' },
  ]},
];

// ==================== 侧边栏渲染 ====================
function renderSidebar(activeKey) {
  let html = `
    <div class="sidebar-logo">
      <div class="logo-box">美</div>
      <span class="logo-text">美丽推荐平台</span>
    </div>
  `;
  MENU_CONFIG.forEach(group => {
    html += `<div class="menu-group">`;
    html += `<div class="menu-group-title">${group.group}</div>`;
    group.items.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(c => c.key === activeKey);
        html += `
          <div class="menu-item ${hasActiveChild ? 'expanded' : ''}" onclick="toggleSubMenu(this)">
            <span class="menu-icon">${item.icon}</span>
            <span>${item.title}</span>
            <span class="menu-arrow">▶</span>
          </div>
          <div class="menu-sub ${hasActiveChild ? 'open' : ''}">
        `;
        item.children.forEach(child => {
          html += `
            <a class="menu-item ${child.key === activeKey ? 'active' : ''}" href="${child.href}">
              <span>${child.title}</span>
              ${child.badge ? `<span class="tag tag-primary" style="font-size:10px;padding:1px 6px;margin-left:auto;">${child.badge}</span>` : ''}
            </a>
          `;
        });
        html += `</div>`;
      } else {
        html += `
          <a class="menu-item ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
            <span class="menu-icon">${item.icon}</span>
            <span>${item.title}</span>
            ${item.badge ? `<span class="tag tag-primary" style="font-size:10px;padding:1px 6px;margin-left:auto;">${item.badge}</span>` : ''}
          </a>
        `;
      }
    });
    html += `</div>`;
  });
  return html;
}

function toggleSubMenu(el) {
  el.classList.toggle('expanded');
  const sub = el.nextElementSibling;
  if (sub && sub.classList.contains('menu-sub')) {
    sub.classList.toggle('open');
  }
}

// ==================== 顶部栏渲染 ====================
function renderHeader(crumbs) {
  let crumbHtml = '';
  crumbs.forEach((c, i) => {
    if (i > 0) crumbHtml += `<span class="separator">/</span>`;
    crumbHtml += `<span class="crumb ${i === crumbs.length - 1 ? 'current' : ''}">${c}</span>`;
  });
  const username = sessionStorage.getItem('adminName') || '管理员';
  const initial = username.charAt(0).toUpperCase();
  return `
    <div class="breadcrumb">${crumbHtml}</div>
    <div class="header-right">
      <div class="header-user">
        <div class="avatar">${initial}</div>
        <span class="username">${username}</span>
      </div>
      <span class="logout-btn" onclick="logout()">退出</span>
    </div>
  `;
}

// ==================== 登录检查 ====================
function checkLogin() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  if (confirm('确定要退出登录吗？')) {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
}

// ==================== 页面初始化 ====================
function initPage(activeKey, crumbs) {
  if (!checkLogin()) return;
  document.querySelector('.sidebar').innerHTML = renderSidebar(activeKey);
  document.querySelector('.header').innerHTML = renderHeader(crumbs);
}

// ==================== API 请求封装 ====================
async function fetchAPI(url, options = {}) {
  try {
    const defaultOpts = {
      headers: { 'Content-Type': 'application/json' },
    };
    const opts = { ...defaultOpts, ...options };
    if (opts.body && typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, opts);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API请求失败:', err);
    showToast('网络请求失败，请检查服务是否启动', 'error');
    return { code: -1, msg: '网络请求失败', data: null };
  }
}

// GET 请求快捷方法
async function fetchGet(url, params = {}) {
  const query = new URLSearchParams(params).toString();
  const fullUrl = query ? `${url}?${query}` : url;
  return fetchAPI(fullUrl, { method: 'GET' });
}

// POST 请求快捷方法
async function fetchPost(url, body = {}) {
  return fetchAPI(url, { method: 'POST', body });
}

// ==================== Toast 提示 ====================
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==================== 模态框 ====================
function showModal(title, bodyHTML, footerHTML = '') {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>
  `;
  overlay.classList.add('show');
}

function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.classList.remove('show');
}

// 确认对话框
function confirmDialog(message, onConfirm) {
  showModal('确认操作', `
    <div style="text-align:center;padding:10px 0;">
      <div style="font-size:36px;color:var(--warning);margin-bottom:12px;">⚠</div>
      <p style="font-size:14px;color:var(--text-2);">${message}</p>
    </div>
  `, `
    <button class="btn btn-default" onclick="closeModal()">取消</button>
    <button class="btn btn-danger" id="confirmBtn">确定</button>
  `);
  document.getElementById('confirmBtn').onclick = () => {
    closeModal();
    onConfirm();
  };
}

// ==================== 分页渲染 ====================
function renderPagination(container, total, current, pageSize, callback) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  if (totalPages <= 1) {
    container.innerHTML = `<span class="page-info">共 ${total} 条记录</span>`;
    return;
  }
  let html = `<span class="page-info">共 ${total} 条记录，第 ${current}/${totalPages} 页</span>`;
  html += `<button class="page-btn" ${current <= 1 ? 'disabled' : ''} onclick="goToPage(${current - 1})">上一页</button>`;
  
  let start = Math.max(1, current - 2);
  let end = Math.min(totalPages, current + 2);
  if (start > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += `<span class="page-btn" style="border:none;background:none;">...</span>`;
  }
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (end < totalPages) {
    if (end < totalPages - 1) html += `<span class="page-btn" style="border:none;background:none;">...</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }
  html += `<button class="page-btn" ${current >= totalPages ? 'disabled' : ''} onclick="goToPage(${current + 1})">下一页</button>`;
  
  container.innerHTML = html;
  container._pageCallback = callback;
}

function goToPage(page) {
  const containers = document.querySelectorAll('.pagination');
  containers.forEach(c => {
    if (c._pageCallback) c._pageCallback(page);
  });
}

// ==================== 工具函数 ====================
function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function formatDateShort(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}`;
}

function renderRating(score, max = 5) {
  if (score == null) return '<span class="text-muted">未评分</span>';
  let html = '<span class="rating">';
  for (let i = 0; i < max; i++) {
    html += i < score ? '★' : '<span class="star-empty">★</span>';
  }
  html += ` <span class="text-muted text-sm">${score}分</span></span>`;
  return html;
}

function escapeHTML(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// 生成表格空数据行
function emptyRow(colspan, text = '暂无数据') {
  return `<tr class="empty-row"><td colspan="${colspan}">${text}</td></tr>`;
}

// 生成页面布局骨架
function pageLayout(activeKey, crumbs, contentHTML) {
  return `
    <div class="admin-layout">
      <aside class="sidebar"></aside>
      <div class="main-wrapper">
        <header class="header"></header>
        <main class="content">${contentHTML}</main>
      </div>
    </div>
  `;
}
