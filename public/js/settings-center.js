/**
 * 设置中心前端交互逻辑
 * 与 spider/js/设置中心.js 后端API进行通信
 */

// 全局变量
const API_BASE = '/api/设置中心';
let qrcodeTimer = null;
let scanCheckTimer = null;
let countdownTimer = null;
let chatHistory = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 设置中心页面DOM加载完成');
    console.log('📄 当前页面状态:', document.readyState);
    initializeEventListeners();
    loadInitialStatus();
});

// 添加备用初始化机制，确保在各种情况下都能正常工作
if (document.readyState === 'loading') {
    console.log('⏳ DOM正在加载中，等待DOMContentLoaded事件');
} else {
    console.log('🚀 DOM已经加载完成，立即初始化');
    initializeEventListeners();
    loadInitialStatus();
}

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 快速选择按钮
    document.querySelectorAll('.quick-select-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const value = this.dataset.value;
            const target = this.dataset.target;
            
            if (target === 'novel') {
                document.getElementById('novelUrl').value = value;
            } else {
                document.getElementById('videoUrl').value = value;
            }
        });
    });

    // 推送功能
    document.getElementById('pushVideoBtn')?.addEventListener('click', pushVideo);
    document.getElementById('pushNovelBtn')?.addEventListener('click', pushNovel);
    document.getElementById('searchBtn')?.addEventListener('click', performSearch);

    // AI对话功能
    document.getElementById('sendChatBtn')?.addEventListener('click', sendChatMessage);
    document.getElementById('clearChatBtn')?.addEventListener('click', clearChatHistory);
    document.getElementById('chatInput')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Cookie设置按钮
    setupCookieEventListeners();

    // 系统配置按钮
    setupSystemConfigListeners();

    // 扫码功能
    setupScanListeners();

    // 其他功能
    document.getElementById('refreshBtn')?.addEventListener('click', () => location.reload());
    document.getElementById('exportBtn')?.addEventListener('click', exportConfig);
}

/**
 * 设置Cookie相关事件监听器
 */
function setupCookieEventListeners() {
    // 夸克Cookie
    document.getElementById('setQuarkCookieBtn')?.addEventListener('click', () => setCookie('quark_cookie', 'quarkAuthCode', 'quarkCookie'));
    document.getElementById('getQuarkCookieBtn')?.addEventListener('click', () => getCookie('get_quark_cookie', '夸克Cookie'));
    
    // UC Cookie
    document.getElementById('setUcCookieBtn')?.addEventListener('click', () => setCookie('uc_cookie', 'ucAuthCode', 'ucCookie'));
    document.getElementById('getUcCookieBtn')?.addEventListener('click', () => getCookie('get_uc_cookie', 'UC Cookie'));
    
    // 阿里Token
    document.getElementById('setAliTokenBtn')?.addEventListener('click', () => setCookie('ali_token', 'aliAuthCode', 'aliToken'));
    document.getElementById('getAliTokenBtn')?.addEventListener('click', () => getCookie('get_ali_token', '阿里Token'));
    
    // 哔哩Cookie
    document.getElementById('setBiliCookieBtn')?.addEventListener('click', () => setCookie('bili_cookie', 'biliAuthCode', 'biliCookie'));
    document.getElementById('getBiliCookieBtn')?.addEventListener('click', () => getCookie('get_bili_cookie', '哔哩Cookie'));
    
    // 天翼云盘
    document.getElementById('setCloudAccountBtn')?.addEventListener('click', () => setCookie('cloud_account', 'cloudAuthCode', 'cloudAccount'));
    document.getElementById('setCloudPasswordBtn')?.addEventListener('click', () => setCookie('cloud_password', 'cloudAuthCode', 'cloudPassword'));
    document.getElementById('getCloudAccountBtn')?.addEventListener('click', () => getCookie('get_cloud_account', '天翼账号'));
    document.getElementById('getCloudPasswordBtn')?.addEventListener('click', () => getCookie('get_cloud_password', '天翼密码'));
}

/**
 * 设置系统配置事件监听器
 */
function setupSystemConfigListeners() {
    document.getElementById('setHideAdultBtn')?.addEventListener('click', setHideAdultConfig);
    document.getElementById('setProxyBtn')?.addEventListener('click', setProxyConfig);
    document.getElementById('setSourceBtn')?.addEventListener('click', setSourceConfig);
    document.getElementById('setAIBtn')?.addEventListener('click', setAIConfig);
    document.getElementById('setDebugBtn')?.addEventListener('click', setDebugConfig);
    document.getElementById('setLinkBtn')?.addEventListener('click', setLinkConfig);
    document.getElementById('updateLinkBtn')?.addEventListener('click', updateLinkData);
    document.getElementById('viewLinkBtn')?.addEventListener('click', viewLinkData);
    document.getElementById('setVideoParseBtn')?.addEventListener('click', setVideoParseConfig);
}

/**
 * 设置扫码相关事件监听器
 */
function setupScanListeners() {
    document.getElementById('quarkScanBtn')?.addEventListener('click', () => startScan('夸克扫码', '夸克网盘'));
    document.getElementById('ucScanBtn')?.addEventListener('click', () => startScan('UC扫码', 'UC网盘'));
    document.getElementById('aliScanBtn')?.addEventListener('click', () => startScan('阿里扫码', '阿里云盘'));
    document.getElementById('biliScanBtn')?.addEventListener('click', () => startScan('哔哩扫码', '哔哩哔哩'));
}

/**
 * API请求封装
 */
async function apiRequest(action, value = null) {
    const url = new URL(`${window.location.origin}${API_BASE}`);
    url.searchParams.append('ac', 'action');
    url.searchParams.append('action', action);
    
    if (value) {
        url.searchParams.append('value', JSON.stringify(value));
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    
    // 尝试解析JSON，如果失败则返回原始文本
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

/**
 * 推送视频功能
 */
async function pushVideo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    if (!videoUrl) {
        showToast('warning', '请输入视频地址');
        return;
    }

    showLoading('pushVideoBtn');
    try {
        const response = await apiRequest('推送视频播放', { push: videoUrl });
        handleActionResponse(response);
    } catch (error) {
        showToast('error', '推送失败: ' + error.message);
    } finally {
        hideLoading('pushVideoBtn');
    }
}

/**
 * 推送小说功能
 */
async function pushNovel() {
    const novelUrl = document.getElementById('novelUrl').value.trim();
    if (!novelUrl) {
        showToast('warning', '请输入小说链接');
        return;
    }

    showLoading('pushNovelBtn');
    try {
        const response = await apiRequest('推送番茄小说', { push: novelUrl });
        handleActionResponse(response);
    } catch (error) {
        showToast('error', '推送失败: ' + error.message);
    } finally {
        hideLoading('pushNovelBtn');
    }
}

/**
 * 执行源内搜索
 */
async function performSearch() {
    const keyword = document.getElementById('searchKeyword').value.trim();
    const source = document.getElementById('searchSource').value;
    
    if (!keyword) {
        showToast('warning', '请输入搜索关键词');
        return;
    }

    showLoading('searchBtn');
    try {
        const response = await apiRequest('源内搜索', { wd: source });
        handleActionResponse(response);
    } catch (error) {
        showToast('error', '搜索失败: ' + error.message);
    } finally {
        hideLoading('searchBtn');
    }
}

/**
 * 发送AI对话消息
 */
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) {
        showToast('warning', '请输入消息内容');
        return;
    }

    // 添加用户消息到聊天记录
    addChatMessage('user', message);
    input.value = '';

    showLoading('sendChatBtn');
    try {
        const response = await apiRequest('连续对话', { talk: message });
        
        if (typeof response === 'string') {
            // 解析响应中的消息内容
            const parts = response.split('\n');
            const aiResponse = parts.find(part => part.includes('AI:') || part.includes('讯飞星火:') || part.includes('deepSeek:') || part.includes('Kimi:'));
            if (aiResponse) {
                const aiMessage = aiResponse.split(':').slice(1).join(':').trim();
                addChatMessage('ai', aiMessage);
            }
        } else if (response.action) {
            handleActionResponse(response);
        }
    } catch (error) {
        showToast('error', 'AI对话失败: ' + error.message);
    } finally {
        hideLoading('sendChatBtn');
    }
}

/**
 * 添加聊天消息到界面
 */
function addChatMessage(type, content) {
    const container = document.getElementById('chatContainer');
    
    // 如果是第一条消息，清空占位文本
    if (container.innerHTML.includes('开始新的对话')) {
        container.innerHTML = '';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-${type}`;
    
    if (type === 'user') {
        messageDiv.innerHTML = `<strong>你:</strong> ${content}`;
    } else {
        messageDiv.innerHTML = `<strong>AI:</strong> ${content}`;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    // 保存到历史记录
    chatHistory.push({ type, content, timestamp: Date.now() });
}

/**
 * 清空聊天历史
 */
async function clearChatHistory() {
    try {
        await apiRequest('连续对话', { talk: '清空AI对话记录' });
        document.getElementById('chatContainer').innerHTML = '<div class="text-muted text-center">开始新的对话...</div>';
        chatHistory = [];
        showToast('success', '对话记录已清空');
    } catch (error) {
        showToast('error', '清空失败: ' + error.message);
    }
}

/**
 * 设置Cookie
 */
async function setCookie(type, authCodeId, cookieId) {
    const authCode = document.getElementById(authCodeId)?.value.trim();
    const cookie = document.getElementById(cookieId)?.value.trim();

    if (!authCode || !cookie) {
        showToast('warning', '请填写授权码和Cookie/Token');
        return;
    }

    try {
        const response = await apiRequest(type, {
            auth_code: authCode,
            cookie: cookie
        });
        
        if (typeof response === 'string') {
            showToast('success', response);
            // 清空输入框
            document.getElementById(authCodeId).value = '';
            document.getElementById(cookieId).value = '';
        } else {
            handleActionResponse(response);
        }
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 获取Cookie
 */
async function getCookie(action, title) {
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) {
        return;
    }

    try {
        const response = await apiRequest(action, { auth_code: authCode });
        
        if (typeof response === 'string') {
            showToast('info', response);
        } else if (response.action) {
            // 显示配置值
            showConfigModal(title, response.action.value);
        }
    } catch (error) {
        showToast('error', '获取失败: ' + error.message);
    }
}

/**
 * 开始扫码登录
 */
async function startScan(scanType, platform) {
    try {
        const response = await apiRequest(scanType, {});
        
        if (response.action) {
            showQRCodeModal(platform, response.action);
        } else if (typeof response === 'string') {
            showToast('error', response);
        }
    } catch (error) {
        showToast('error', '扫码失败: ' + error.message);
    }
}

/**
 * 显示二维码模态框
 */
function showQRCodeModal(title, actionData) {
    const modal = new bootstrap.Modal(document.getElementById('qrcodeModal'));
    document.getElementById('qrcodeTitle').textContent = title + '扫码登录';
    document.getElementById('qrcodeMessage').textContent = actionData.msg || '请使用对应APP扫码登录';
    
    // 生成二维码
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    qrcodeContainer.innerHTML = '<div class="spinner-border text-primary"><span class="visually-hidden">生成二维码中...</span></div>';
    
    if (actionData.qrcode) {
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(actionData.qrcode, { width: 300 }, (error, canvas) => {
                if (error) {
                    qrcodeContainer.innerHTML = '<div class="text-danger">二维码生成失败</div>';
                } else {
                    qrcodeContainer.innerHTML = '';
                    qrcodeContainer.appendChild(canvas);
                }
            });
        } else {
            // 如果QRCode库未加载，显示链接
            qrcodeContainer.innerHTML = `<a href="${actionData.qrcode}" target="_blank" class="btn btn-primary">点击打开扫码页面</a>`;
        }
    }

    modal.show();
    
    // 开始倒计时和状态检查
    if (actionData.timeout) {
        startCountdown(actionData.timeout, actionData.initAction, actionData.initValue);
    }
}

/**
 * 开始倒计时
 */
function startCountdown(timeout, checkAction, checkValue) {
    let timeLeft = timeout || 120;
    const countdownElement = document.getElementById('countdown');
    const progressElement = document.getElementById('qrcodeProgress');
    
    countdownTimer = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;
        
        const progress = ((timeout - timeLeft) / timeout) * 100;
        progressElement.style.width = progress + '%';
        
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            bootstrap.Modal.getInstance(document.getElementById('qrcodeModal')).hide();
            showToast('warning', '扫码超时，请重新尝试');
        }
    }, 1000);
    
    // 开始状态检查
    if (checkAction && checkValue) {
        startScanCheck(checkAction, checkValue);
    }
}

/**
 * 开始扫码状态检查
 */
async function startScanCheck(action, value) {
    let checkCount = 0;
    const maxChecks = 15;
    
    scanCheckTimer = setInterval(async () => {
        checkCount++;
        
        try {
            const result = await apiRequest(action, value);
            
            if (typeof result === 'string') {
                if (result.includes('成功') || result.includes('完成')) {
                    clearInterval(scanCheckTimer);
                    clearInterval(countdownTimer);
                    bootstrap.Modal.getInstance(document.getElementById('qrcodeModal')).hide();
                    showToast('success', result);
                } else if (result.includes('过期') || result.includes('取消')) {
                    clearInterval(scanCheckTimer);
                    clearInterval(countdownTimer);
                    bootstrap.Modal.getInstance(document.getElementById('qrcodeModal')).hide();
                    showToast('warning', result);
                }
            }
            
            if (checkCount >= maxChecks) {
                clearInterval(scanCheckTimer);
            }
        } catch (error) {
            console.error('扫码状态检查失败:', error);
        }
    }, 2000);
}

/**
 * 设置系统配置
 */
async function setHideAdultConfig() {
    const value = document.getElementById('hideAdult').value;
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const response = await apiRequest('hide_adult', {
            auth_code: authCode,
            cookie: value
        });
        showToast('success', typeof response === 'string' ? response : '设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 设置代理配置
 */
async function setProxyConfig() {
    const thread = document.getElementById('threadCount').value;
    const mode = document.getElementById('proxyMode').value;
    const type = document.getElementById('proxyType').value;
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const promises = [];
        if (thread) promises.push(apiRequest('thread', { auth_code: authCode, cookie: thread }));
        if (mode) promises.push(apiRequest('play_proxy_mode', { auth_code: authCode, cookie: mode }));
        if (type) promises.push(apiRequest('play_local_proxy_type', { auth_code: authCode, cookie: type }));

        await Promise.all(promises);
        showToast('success', '代理配置设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 设置源管理配置
 */
async function setSourceConfig() {
    const dr2 = document.getElementById('enableDr2').checked ? '1' : '0';
    const py = document.getElementById('enablePy').checked ? '1' : '0';
    const cat = document.getElementById('enableCat').checked ? '1' : '0';
    const oldConfig = document.getElementById('enableOldConfig').checked ? '1' : '0';
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const promises = [
            apiRequest('enable_dr2', { auth_code: authCode, cookie: dr2 }),
            apiRequest('enable_py', { auth_code: authCode, cookie: py }),
            apiRequest('enable_cat', { auth_code: authCode, cookie: cat }),
            apiRequest('enable_old_config', { auth_code: authCode, cookie: oldConfig })
        ];

        await Promise.all(promises);
        showToast('success', '源管理配置设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 设置AI配置
 */
async function setAIConfig() {
    const currentAI = document.getElementById('currentAI').value;
    const sparkKey = document.getElementById('sparkAuthKey').value;
    const deepseekKey = document.getElementById('deepseekApiKey').value;
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const promises = [];
        if (currentAI) promises.push(apiRequest('now_ai', { auth_code: authCode, cookie: currentAI }));
        if (sparkKey) promises.push(apiRequest('spark_ai_authKey', { auth_code: authCode, cookie: sparkKey }));
        if (deepseekKey) promises.push(apiRequest('deepseek_apiKey', { auth_code: authCode, cookie: deepseekKey }));

        await Promise.all(promises);
        showToast('success', 'AI配置设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 设置调试配置
 */
async function setDebugConfig() {
    const showCurl = document.getElementById('showCurl').checked ? '1' : '0';
    const showReq = document.getElementById('showReq').checked ? '1' : '0';
    const allowForward = document.getElementById('allowForward').checked ? '1' : '0';
    const enableRuleName = document.getElementById('enableRuleName').checked ? '1' : '0';
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const promises = [
            apiRequest('show_curl', { auth_code: authCode, cookie: showCurl }),
            apiRequest('show_req', { auth_code: authCode, cookie: showReq }),
            apiRequest('allow_forward', { auth_code: authCode, cookie: allowForward }),
            apiRequest('enable_rule_name', { auth_code: authCode, cookie: enableRuleName })
        ];

        await Promise.all(promises);
        showToast('success', '调试配置设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 设置链接配置
 */
async function setLinkConfig() {
    const linkUrl = document.getElementById('linkUrl').value;
    const enableData = document.getElementById('enableLinkData').checked ? '1' : '0';
    const enablePush = document.getElementById('enableLinkPush').checked ? '1' : '0';
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const promises = [];
        if (linkUrl) promises.push(apiRequest('link_url', { auth_code: authCode, cookie: linkUrl }));
        promises.push(apiRequest('enable_link_data', { auth_code: authCode, cookie: enableData }));
        promises.push(apiRequest('enable_link_push', { auth_code: authCode, cookie: enablePush }));

        await Promise.all(promises);
        showToast('success', '链接配置设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 更新挂载数据
 */
async function updateLinkData() {
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const response = await apiRequest('link_data', { auth_code: authCode });
        showToast('success', typeof response === 'string' ? response : '数据更新成功');
    } catch (error) {
        showToast('error', '更新失败: ' + error.message);
    }
}

/**
 * 查看挂载数据
 */
async function viewLinkData() {
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const response = await apiRequest('get_link_data', { auth_code: authCode });
        if (response.action) {
            showConfigModal('挂载数据', response.action.msg || response.action.value);
        } else {
            showToast('info', typeof response === 'string' ? response : '无数据');
        }
    } catch (error) {
        showToast('error', '查看失败: ' + error.message);
    }
}

/**
 * 设置视频解析配置
 */
async function setVideoParseConfig() {
    const quality = document.getElementById('mgQuality').value;
    const authCode = prompt('请输入入库授权码:');
    if (!authCode) return;

    try {
        const response = await apiRequest('mg_hz', { auth_code: authCode, cookie: quality });
        showToast('success', typeof response === 'string' ? response : '视频解析配置设置成功');
    } catch (error) {
        showToast('error', '设置失败: ' + error.message);
    }
}

/**
 * 处理Action响应
 */
function handleActionResponse(response) {
    if (typeof response === 'string') {
        showToast('success', response);
    } else if (response.action) {
        const action = response.action;
        
        // 根据action类型处理
        if (action.actionId === '__detail__') {
            showToast('info', response.toast || '正在跳转...');
        } else if (action.actionId === '__keep__') {
            if (action.msg) {
                addChatMessage('ai', action.msg);
            }
            if (response.toast) {
                showToast('info', response.toast);
            }
        } else if (action.actionId === '__self_search__') {
            showToast('info', response.toast || '正在搜索...');
        }
    }
    
    if (response.toast) {
        showToast('info', response.toast);
    }
}

/**
 * 显示配置查看模态框
 */
function showConfigModal(title, content) {
    const modal = new bootstrap.Modal(document.getElementById('configModal'));
    document.getElementById('configTitle').textContent = title;
    document.getElementById('configValue').value = content;
    
    // 设置复制按钮功能
    document.getElementById('copyConfigBtn').onclick = function() {
        navigator.clipboard.writeText(content).then(() => {
            showToast('success', '已复制到剪贴板');
        });
    };
    
    modal.show();
}

/**
 * 导出配置
 */
function exportConfig() {
    showToast('info', '配置导出功能开发中...');
}

/**
 * 显示提示消息
 */
function showToast(type, message) {
    const toast = document.getElementById(type + 'Toast');
    const messageElement = document.getElementById(type + 'Message');
    
    if (toast && messageElement) {
        messageElement.textContent = message;
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

/**
 * 显示加载状态
 */
function showLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        const spinner = btn.querySelector('.loading-spinner');
        btn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
    }
}

/**
 * 隐藏加载状态
 */
function hideLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        const spinner = btn.querySelector('.loading-spinner');
        btn.disabled = false;
        if (spinner) spinner.style.display = 'none';
    }
}

/**
 * 加载初始状态
 */
function loadInitialStatus() {
    // 检查各种服务状态
    checkServiceStatus();
}

/**
 * 检查服务状态
 */
function checkServiceStatus() {
    // 这里可以实现实际的状态检查逻辑
    // 暂时使用模拟状态
    updateStatusIndicator('quarkStatus', 'warning');
    updateStatusIndicator('ucStatus', 'error');
    updateStatusIndicator('aliStatus', 'success');
    updateStatusIndicator('biliStatus', 'warning');
    updateStatusIndicator('cloudStatus', 'error');
}

/**
 * 更新状态指示器
 */
function updateStatusIndicator(elementId, status) {
    const indicator = document.getElementById(elementId);
    if (indicator) {
        indicator.className = `status-indicator status-${status}`;
    }
}

// 页面卸载时清理定时器
window.addEventListener('beforeunload', function() {
    if (qrcodeTimer) clearTimeout(qrcodeTimer);
    if (scanCheckTimer) clearInterval(scanCheckTimer);
    if (countdownTimer) clearInterval(countdownTimer);
});