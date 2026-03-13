// 状态管理
const state = {
  serverUrl: 'http://121.41.230.120:3000',
  user: null,
  messages: [],
  petIcon: '🐱',
  lastMsgId: null
};

// DOM元素
const elements = {
  // 面板
  overlayPanel: document.getElementById('overlayPanel'),
  loginForm: document.getElementById('loginForm'),
  settingsForm: document.getElementById('settingsForm'),
  panelTitle: document.getElementById('panelTitle'),
  
  // 历史面板
  historyPanel: document.getElementById('historyPanel'),
  historyList: document.getElementById('historyList'),
  closeHistoryBtn: document.getElementById('closeHistoryBtn'),
  
  // 表单输入
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  serverUrlInput: document.getElementById('serverUrlInput'),
  petSelect: document.getElementById('petSelect'),
  
  // 按钮
  loginBtn: document.getElementById('loginBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  closePanelBtn: document.getElementById('closePanelBtn'),
  backBtn: document.getElementById('backBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  
  // 宠物相关
  pet: document.getElementById('pet'),
  bubble: document.getElementById('bubble'),
  bubbleContent: document.getElementById('bubbleContent'),
  inputBubble: document.getElementById('inputBubble'),
  petInput: document.getElementById('petInput')
};

let pollInterval = null;
let bubbleTimeout = null;

// 初始化
function init() {
  bindEvents();
  loadSavedData();
  
  // 鼠标穿透控制逻辑
  setupMouseEvents();
  // 窗口拖拽逻辑 (CSS drag 恢复后，只需要处理鼠标穿透)
  // setupDrag(); 
  
  // 如果已登录，直接进入桌宠模式
  if (state.user) {
    showPetMode();
  } else {
    showPanel('login');
  }
}

// 设置鼠标穿透逻辑 (基于 mousemove)
function setupMouseEvents() {
  window.addEventListener('mousemove', (e) => {
    // 判断鼠标下方的元素是否是 document.documentElement (即透明背景)
    const isTransparent = e.target === document.documentElement || e.target === document.body || e.target.classList.contains('pet-container');
    
    if (isTransparent) {
      // 鼠标在透明区域，设置穿透
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
    } else {
      // 鼠标在交互元素上，取消穿透
      window.electronAPI.setIgnoreMouseEvents(false);
    }
  });
  
  // 初始状态
  window.electronAPI.setIgnoreMouseEvents(false);
}

// 绑定事件
function bindEvents() {
  // 面板控制
  elements.closePanelBtn.addEventListener('click', () => {
      // 如果已登录，关闭面板显示宠物；否则关闭窗口
      if (state.user) {
          elements.overlayPanel.classList.add('hidden');
      } else {
          window.electronAPI.hideWindow();
      }
  });
  
  elements.closeHistoryBtn.addEventListener('click', () => {
    elements.historyPanel.classList.add('hidden');
  });

  elements.settingsBtn.addEventListener('click', () => {
    elements.serverUrlInput.value = state.serverUrl;
    elements.petSelect.value = state.petIcon;
    showPanel('settings');
  });

  elements.backBtn.addEventListener('click', () => showPanel('login'));

  // 登录
  elements.loginBtn.addEventListener('click', handleLogin);
  elements.password.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  // 设置保存
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.logoutBtn.addEventListener('click', logout);

  // 宠物交互
  // 左键点击：打开/关闭输入框
  elements.pet.addEventListener('click', (e) => {
    // 阻止冒泡防止触发其他事件
    e.stopPropagation();
    toggleInput();
  });
  
  // 右键点击：打开历史记录
  elements.pet.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleHistory();
  });

  elements.petInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // 失去焦点隐藏输入框（可选，暂时不加，防止误触）
  // elements.petInput.addEventListener('blur', () => hideInput());
  
  // 监听来自托盘的打开设置指令
  if (window.electronAPI.onOpenSettings) {
    window.electronAPI.onOpenSettings(() => {
      // 填充当前设置
      elements.serverUrlInput.value = state.serverUrl;
      elements.petSelect.value = state.petIcon;
      
      // 显示设置面板
      // 先隐藏其他可能打开的面板
      elements.inputBubble.classList.add('hidden');
      elements.historyPanel.classList.add('hidden');
      elements.bubble.classList.add('hidden');
      
      showPanel('settings');
    });
  }
}

// 加载数据
function loadSavedData() {
  state.serverUrl = localStorage.getItem('serverUrl') || state.serverUrl;
  state.petIcon = localStorage.getItem('petIcon') || '🐱';
  
  const savedEmail = localStorage.getItem('email');
  if (savedEmail) elements.email.value = savedEmail;

  elements.pet.textContent = state.petIcon;
}

// 显示面板
function showPanel(type) {
  elements.overlayPanel.classList.remove('hidden');
  elements.historyPanel.classList.add('hidden'); // 互斥
  
  if (type === 'login') {
    elements.loginForm.classList.remove('hidden');
    elements.settingsForm.classList.add('hidden');
    elements.panelTitle.textContent = '连接';
  } else {
    elements.loginForm.classList.add('hidden');
    elements.settingsForm.classList.remove('hidden');
    elements.panelTitle.textContent = '设置';
  }
}

// 进入桌宠模式
function showPetMode() {
  elements.overlayPanel.classList.add('hidden');
  elements.pet.classList.remove('hidden');
  startPolling();
}

// 保存设置
function saveSettings() {
  const newUrl = elements.serverUrlInput.value.trim();
  const newPet = elements.petSelect.value;
  
  if (!newUrl) return alert('请输入服务器地址');
  
  state.serverUrl = newUrl;
  state.petIcon = newPet;
  
  localStorage.setItem('serverUrl', newUrl);
  localStorage.setItem('petIcon', newPet);
  
  elements.pet.textContent = newPet;
  
  showPanel('login');
}

// 登录
async function handleLogin() {
  const email = elements.email.value.trim();
  const password = elements.password.value.trim();
  
  if (!email || !password) return;
  
  elements.loginBtn.textContent = '连接中...';
  elements.loginBtn.disabled = true;
  
  try {
    const baseUrl = state.serverUrl.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/api/v1/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '连接失败');
    
    // 权限检查
    const role = data.user.role || '';
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'REVIEWER', 'FUND_ADMIN', 'AWARD_ADMIN', 'JOURNAL_ADMIN', 'CONFERENCE_ADMIN'];

    if (!allowedRoles.includes(role)) {
      throw new Error('权限不足');
    }
    
    state.user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || data.user.email
    };
    
    localStorage.setItem('email', email);
    showPetMode();
    
    // 登录成功后先拉取一次消息，避免弹出旧消息
    await loadMessages(true);
    
  } catch (e) {
    alert(e.message);
  } finally {
    elements.loginBtn.textContent = '连接';
    elements.loginBtn.disabled = false;
  }
}

// 轮询消息
function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(() => loadMessages(false), 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// 加载消息
async function loadMessages(isFirstLoad) {
  if (!state.user) return;
  
  try {
    const baseUrl = state.serverUrl.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/api/v1/mobile/chat?userId=${state.user.id}`);
    
    if (res.ok) {
      const messages = await res.json();
      
      // 简单比对消息是否变化（基于最后一条消息ID和消息总数）
      // 注意：这种比对在删除消息场景下可能不准，但对于只追加的聊天够用了
      const newLastId = messages.length > 0 ? messages[messages.length - 1].id : null;
      const oldLastId = state.messages.length > 0 ? state.messages[state.messages.length - 1].id : null;
      
      const hasChanged = messages.length !== state.messages.length || newLastId !== oldLastId;
      
      if (hasChanged) {
        state.messages = messages; // 更新本地消息列表
        
        // 如果历史面板打开，刷新历史消息
        if (!elements.historyPanel.classList.contains('hidden')) {
          renderHistory();
        }
      }
      
      if (messages.length === 0) return;
      
      const latestMsg = messages[messages.length - 1];
      
      // 如果是第一次加载，只记录 ID 不显示
      if (isFirstLoad) {
        state.lastMsgId = latestMsg.id;
        return;
      }
      
      // 如果有新消息
      if (state.lastMsgId !== latestMsg.id) {
        state.lastMsgId = latestMsg.id;
        
        // 只有别人的消息才显示气泡（或者是自己的消息也可以显示，看需求）
        // 这里设定：所有新消息都显示，这样自己发送的也能确认发出去了
        showBubble(latestMsg);
      }
    }
  } catch (e) {
    console.error('Polling error', e);
  }
}

// 显示气泡
function showBubble(msg) {
  // 如果输入框开着，就不弹气泡干扰了？或者弹在上面？
  // 简单起见，如果输入框开着，暂时不弹，或者强制弹
  if (!elements.inputBubble.classList.contains('hidden')) return;

  const content = msg.content;
  const name = msg.sender?.name || '未知';
  const isSelf = msg.senderId === state.user.id;
  
  // 宠物跳动
  elements.pet.classList.add('anim-bounce');
  setTimeout(() => elements.pet.classList.remove('anim-bounce'), 1000);
  
  // 设置内容
  elements.bubbleContent.innerHTML = `<strong>${isSelf ? '我' : name}:</strong> ${escapeHtml(content)}`;
  elements.bubble.classList.remove('hidden');
  
  // 5秒后消失
  if (bubbleTimeout) clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(() => {
    elements.bubble.classList.add('hidden');
  }, 5000);
}

// 切换输入框
function toggleInput() {
  // 隐藏消息气泡
  elements.bubble.classList.add('hidden');
  elements.historyPanel.classList.add('hidden');
  
  if (elements.inputBubble.classList.contains('hidden')) {
    elements.inputBubble.classList.remove('hidden');
    elements.petInput.focus();
  } else {
    elements.inputBubble.classList.add('hidden');
  }
}

// 切换历史记录
function toggleHistory() {
  if (elements.historyPanel.classList.contains('hidden')) {
    elements.historyPanel.classList.remove('hidden');
    elements.inputBubble.classList.add('hidden');
    renderHistory(true); // 传入 true 表示这是刚打开，可以滚动到底部
  } else {
    elements.historyPanel.classList.add('hidden');
  }
}

// 渲染历史消息
function renderHistory(scrollToBottom = false) {
  if (!state.messages || state.messages.length === 0) {
    elements.historyList.innerHTML = '<div style="text-align:center;color:#999;padding:20px;font-size:12px;">暂无消息</div>';
    return;
  }
  
  // 记录当前滚动位置
  const previousScrollTop = elements.historyList.scrollTop;
  const previousScrollHeight = elements.historyList.scrollHeight;
  
  elements.historyList.innerHTML = '';
  state.messages.forEach(msg => {
    const isSelf = msg.senderId === state.user?.id;
    const name = msg.sender?.name || '未知';
    const initials = name.slice(0, 2).toUpperCase();
    const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const div = document.createElement('div');
    div.className = `msg ${isSelf ? 'self' : ''}`;
    div.innerHTML = `
      <div class="msg-avatar">${initials}</div>
      <div class="msg-content">
        <div class="msg-info">
          <span class="msg-name">${name}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-bubble">${escapeHtml(msg.content)}</div>
      </div>
    `;
    elements.historyList.appendChild(div);
  });
  
  // 滚动处理
  if (scrollToBottom) {
    // 首次打开或用户要求时，滚到底部
    elements.historyList.scrollTop = elements.historyList.scrollHeight;
  } else {
    // 保持原来的位置
    // 如果之前是在最底部，更新后可能希望继续在最底部？
    // 但用户明确要求“不要自动滚动到最新消息”，所以我们严格保持 scrollTop
    // 注意：如果之前是0（顶部），重绘后还是0。如果之前滚了一点，重绘后保持。
    elements.historyList.scrollTop = previousScrollTop;
  }
}

// 发送消息
async function sendMessage() {
  const content = elements.petInput.value.trim();
  if (!content) return;
  
  elements.petInput.value = '';
  elements.inputBubble.classList.add('hidden'); // 发送后关闭
  
  // 乐观UI：立即显示自己的气泡
  showBubble({
    content: content,
    senderId: state.user.id,
    sender: { name: state.user.name }
  });
  
  try {
    const baseUrl = state.serverUrl.replace(/\/$/, '');
    await fetch(`${baseUrl}/api/v1/mobile/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: state.user.id,
        content: content
      })
    });
    // 发送成功后，轮询会更新 ID，防止重复显示
    // loadMessages(false) 会在几秒后执行
  } catch (e) {
    showBubble({ content: '发送失败: ' + e.message, sender: { name: '系统' } });
  }
}

function logout() {
  state.user = null;
  stopPolling();
  localStorage.removeItem('email'); // 可选：是否记住邮箱
  showPanel('login');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
