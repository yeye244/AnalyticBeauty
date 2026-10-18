/**
 * 美丽推荐平台后台管理系统 - 通用工具库
 */

// ==================== 图标库（内联 SVG，线性风格） ====================
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4.5 18.5 10 13l3 3 3.5-3.5 3 3"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  activity: '<path d="M3 12h4l2.5-7 4 14 2.5-7H21"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M21 7h-5v5"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V18h8v-3.3A7 7 0 0 0 12 2z"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  package: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 21v-8"/>',
  box: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.7 0 2.5-1.2 1.6-2.5-.8-1.2 0-2.5 1.4-2.5H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="12" cy="7.5" r="1.1"/><circle cx="16.5" cy="11" r="1.1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10.2 4.4a2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7 2 2 0 1 1 0 4 1.6 1.6 0 0 0-1.4 1z"/>',
  shield: '<path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3z"/><path d="m9.5 12 1.8 1.8L15 10"/>',
  log: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.3h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16.5v-5"/><path d="M12 7.7h.01"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L4.2 9.7l5.8-.8L12 3.6z"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

// ==================== 侧边栏菜单配置 ====================
const MENU_CONFIG = [
  { group: '概览', items: [
    { key: 'dashboard', title: '工作台', icon: 'home', href: 'index.html' },
  ]},
  { group: '业务管理', items: [
    { key: 'user', title: '用户管理', icon: 'user', href: 'user.html' },
    { key: 'photo', title: '照片管理', icon: 'photo', href: 'photo.html' },
    { key: 'analysis-group', title: 'AI分析管理', icon: 'chart', children: [
      { key: 'analysis', title: '分析结果查询', href: 'analysis.html' },
      { key: 'style-rank', title: '风格匹配排行', href: 'style-rank.html' },
    ]},
    { key: 'recommend-group', title: '推荐管理', icon: 'bulb', children: [
      { key: 'recommend', title: '推荐记录管理', href: 'recommend.html' },
      { key: 'recommend-detail', title: '推荐详情查询', href: 'recommend-detail.html' },
      { key: 'recommend-effect', title: '推荐效果分析', href: 'recommend-effect.html' },
    ]},
    { key: 'skincare-group', title: '护肤品管理', icon: 'droplet', children: [
      { key: 'skincare', title: '产品信息管理', href: 'skincare.html' },
      { key: 'bundle', title: '套装管理', href: 'bundle.html' },
      { key: 'bundle-detail', title: '套装详情查询', href: 'bundle-detail.html' },
    ]},
    { key: 'style', title: '风格管理', icon: 'palette', href: 'style.html' },
  ]},
  { group: '系统管理', items: [
    { key: 'admin-group', title: '系统管理', icon: 'settings', children: [
      { key: 'admin', title: '管理员管理', href: 'admin.html' },
      { key: 'log', title: '操作日志统计', href: 'log.html' },
    ]},
  ]},
];

// ==================== 侧边栏渲染 ====================
function renderSidebar(activeKey) {
  let html = `
    <div class="sidebar-logo">
      <img class="brand-logo" src="assets/images/logo-refined.png" alt="">
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
            <span class="menu-icon">${icon(item.icon)}</span>
            <span class="menu-text">${item.title}</span>
            <span class="menu-arrow">▶</span>
          </div>
          <div class="menu-sub ${hasActiveChild ? 'open' : ''}">
        `;
        item.children.forEach(child => {
          html += `
            <a class="menu-item ${child.key === activeKey ? 'active' : ''}" href="${child.href}">
              <span class="menu-text">${child.title}</span>
              ${child.badge ? `<span class="tag tag-primary" style="font-size:10px;padding:1px 6px;margin-left:auto;">${child.badge}</span>` : ''}
            </a>
          `;
        });
        html += `</div>`;
      } else {
        html += `
          <a class="menu-item ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
            <span class="menu-icon">${icon(item.icon)}</span>
            <span class="menu-text">${item.title}</span>
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
    <button class="menu-toggle" type="button" onclick="toggleSidebar()" aria-label="菜单">${icon('menu')}</button>
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

// ==================== 侧边栏开关（移动端） ====================
function toggleSidebar(force) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const next = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', next);
  const mask = document.querySelector('.sidebar-mask');
  if (mask) mask.classList.toggle('show', next);
}

function initSidebarToggle() {
  if (!document.querySelector('.sidebar-mask')) {
    const mask = document.createElement('div');
    mask.className = 'sidebar-mask';
    mask.onclick = () => toggleSidebar(false);
    document.body.appendChild(mask);
  }
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
  initSidebarToggle();
}

// ==================== API 请求封装 ====================
async function fetchAPI(url, options = {}) {
  try {
    const defaultOpts = {
      headers: { 'Content-Type': 'application/json' },
    };
    const opts = { ...defaultOpts, ...options };
    const adminId = sessionStorage.getItem('adminId');
    
    if (opts.body && typeof opts.body === 'object') {
      opts.body = JSON.stringify({ ...opts.body, adminId });
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
  const icons = { success: 'check', error: 'close', warning: 'alert', info: 'info' };
  toast.innerHTML = `<span>${icon(icons[type] || 'info')}</span><span>${msg}</span>`;
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
      <div class="confirm-icon">${icon('alert')}</div>
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
    html += i < score ? icon('star') : `<span class="star-empty">${icon('star')}</span>`;
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
