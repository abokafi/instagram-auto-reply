let keywordsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  fetchStats();
  fetchRules();
  fetchLogs();
  fetchSettings();
  initRuleForm();
});

function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabTarget = item.getAttribute('data-tab');
      switchTab(tabTarget);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));

  const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  const targetSection = document.getElementById(tabId);

  if (targetNav) targetNav.classList.add('active');
  if (targetSection) targetSection.classList.add('active');

  if (tabId === 'tab-dashboard') {
    fetchStats();
    fetchLogs();
  } else if (tabId === 'tab-rules') {
    fetchRules();
  } else if (tabId === 'tab-settings') {
    fetchSettings();
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      const stats = data.stats;
      document.getElementById('stat-comments').textContent = stats.totalComments || 0;
      document.getElementById('stat-likes').textContent = stats.totalLikes || 0;
      document.getElementById('stat-replies').textContent = stats.totalPublicReplies || 0;
      document.getElementById('stat-dms').textContent = stats.totalDmsSent || 0;
      document.getElementById('stat-active-rules').textContent = stats.activeRulesCount || 0;

      renderKeywordsChart(stats.keywordUsage || {});
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

function renderKeywordsChart(keywordUsage) {
  const ctx = document.getElementById('keywordsChart');
  if (!ctx) return;

  const labels = Object.keys(keywordUsage);
  const values = Object.values(keywordUsage);

  if (keywordsChartInstance) {
    keywordsChartInstance.destroy();
  }

  keywordsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['سعر', 'شحن', 'تفاصيل', 'عروض'],
      datasets: [{
        label: 'عدد المرات التي استجاب فيها النظام',
        data: values.length ? values : [14, 8, 22, 12],
        backgroundColor: [
          'rgba(225, 48, 108, 0.7)',
          'rgba(131, 58, 180, 0.7)',
          'rgba(0, 242, 254, 0.7)',
          'rgba(253, 29, 29, 0.7)',
          'rgba(252, 176, 69, 0.7)'
        ],
        borderColor: '#ffffff',
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8b949e', font: { family: 'Readex Pro' } } }
      },
      scales: {
        x: {
          ticks: { color: '#8b949e', font: { family: 'Readex Pro' } },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          ticks: { color: '#8b949e', font: { family: 'Readex Pro' }, stepSize: 1 },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      }
    }
  });
}

async function fetchRules() {
  try {
    const res = await fetch('/api/rules');
    const data = await res.json();
    if (data.success) {
      renderRulesTable(data.rules || []);
    }
  } catch (err) {
    console.error('Error fetching rules:', err);
  }
}

function renderRulesTable(rules) {
  const tbody = document.getElementById('rules-tbody');
  if (!tbody) return;

  if (rules.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">لا توجد قواعد مضافة حتى الآن. اضغط إضافة قاعدة جديدة.</td></tr>`;
    return;
  }

  tbody.innerHTML = rules.map(rule => {
    const isWildcard = rule.keywords && (rule.keywords.includes('*') || rule.matchType === 'wildcard');
    const keywordsHtml = isWildcard
      ? `<span class="keyword-badge" style="background:var(--primary-gradient); color:#fff;">🌟 رد ثابت عام (*)</span>`
      : (rule.keywords || []).map(kw => `<span class="keyword-badge">${kw}</span>`).join(' ');

    const postScopeHtml = rule.targetPostId 
      ? `<br><small style="color:var(--accent-cyan); font-weight:600;">🎬 منشور: ${rule.targetPostId}</small>`
      : `<br><small style="color:var(--text-muted);">🌐 كافة المنشورات</small>`;

    let actionBadge = '';
    const act = rule.actionType || 'all';
    if (act === 'all') actionBadge = '<span class="badge badge-success">🚀 رد كامل</span>';
    else if (act === 'like_only') actionBadge = '<span class="badge badge-warning">❤️ إعجاب فقط</span>';
    else if (act === 'comment_only') actionBadge = '<span class="badge badge-success">💬 رد عام فقط</span>';
    else if (act === 'dm_only') actionBadge = '<span class="badge badge-success">📩 رسالة DM فقط</span>';

    const publicRepliesPreview = (rule.publicReplies && rule.publicReplies.length) 
      ? rule.publicReplies[0].substring(0, 30) + (rule.publicReplies[0].length > 30 ? '...' : '')
      : 'لا يوجد';
    
    const dmText = rule.dmReply ? (rule.dmReply.text || rule.dmReply) : '';
    const dmPreview = dmText ? (dmText.substring(0, 30) + (dmText.length > 30 ? '...' : '')) : 'لا يوجد';

    return `
      <tr>
        <td>
          <label class="switch">
            <input type="checkbox" ${rule.active ? 'checked' : ''} onchange="toggleRuleActive('${rule.id}', this.checked)">
            <span class="slider"></span>
          </label>
        </td>
        <td><b>${rule.name}</b>${postScopeHtml}</td>
        <td>${keywordsHtml}</td>
        <td>${actionBadge}</td>
        <td>${rule.autoLike ? '<span class="badge badge-success">❤️ مفعل</span>' : '<span class="badge badge-warning">معطل</span>'}</td>
        <td>${publicRepliesPreview}</td>
        <td>${dmPreview}</td>
        <td>
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="editRule('${rule.id}')">✏️ تعديل</button>
          <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteRule('${rule.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleRuleActive(ruleId, activeStatus) {
  try {
    await fetch(`/api/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: activeStatus })
    });
    fetchRules();
    fetchStats();
  } catch (err) {
    console.error('Error toggling rule:', err);
  }
}

function setWildcardKeyword() {
  document.getElementById('rule-keywords').value = '*';
}

function openRuleModal() {
  document.getElementById('rule-form').reset();
  document.getElementById('rule-id').value = '';
  document.getElementById('rule-custom-post-id').style.display = 'none';
  document.getElementById('modal-title').textContent = 'إضافة قاعدة رد آلي جديدة';
  document.getElementById('rule-modal').classList.add('active');
}

function closeRuleModal() {
  document.getElementById('rule-modal').classList.remove('active');
}

async function editRule(ruleId) {
  try {
    const res = await fetch('/api/rules');
    const data = await res.json();
    const rule = (data.rules || []).find(r => r.id === ruleId);
    if (!rule) return;

    document.getElementById('rule-id').value = rule.id;
    document.getElementById('rule-name').value = rule.name;
    document.getElementById('rule-keywords').value = (rule.keywords || []).join(', ');
    document.getElementById('rule-action-type').value = rule.actionType || 'all';
    document.getElementById('rule-autolike').checked = !!rule.autoLike;
    document.getElementById('rule-public-replies').value = (rule.publicReplies || []).join('\n');
    document.getElementById('rule-dm-text').value = rule.dmReply ? (rule.dmReply.text || rule.dmReply) : '';
    document.getElementById('rule-dm-button-text').value = rule.dmReply ? (rule.dmReply.buttonText || '') : '';
    document.getElementById('rule-dm-button-url').value = rule.dmReply ? (rule.dmReply.buttonUrl || '') : '';

    const targetPostSelect = document.getElementById('rule-target-post-id');
    const customPostInput = document.getElementById('rule-custom-post-id');
    if (rule.targetPostId) {
      if (rule.targetPostId === 'reel_101') {
        targetPostSelect.value = 'reel_101';
        customPostInput.style.display = 'none';
      } else {
        targetPostSelect.value = 'custom';
        customPostInput.style.display = 'block';
        customPostInput.value = rule.targetPostId;
      }
    } else {
      targetPostSelect.value = '';
      customPostInput.style.display = 'none';
    }

    document.getElementById('modal-title').textContent = 'تعديل القاعدة';
    document.getElementById('rule-modal').classList.add('active');
  } catch (err) {
    console.error('Error opening edit rule:', err);
  }
}

async function deleteRule(ruleId) {
  if (!confirm('هل أنت تأكد من رغبتك في حذف هذه القاعدة؟')) return;
  try {
    await fetch(`/api/rules/${ruleId}`, { method: 'DELETE' });
    fetchRules();
    fetchStats();
  } catch (err) {
    console.error('Error deleting rule:', err);
  }
}

function initRuleForm() {
  const form = document.getElementById('rule-form');
  if (!form) return;

  const targetSelect = document.getElementById('rule-target-post-id');
  const customInput = document.getElementById('rule-custom-post-id');
  targetSelect.addEventListener('change', () => {
    if (targetSelect.value === 'custom') {
      customInput.style.display = 'block';
    } else {
      customInput.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ruleId = document.getElementById('rule-id').value;
    const name = document.getElementById('rule-name').value;
    const rawKeywords = document.getElementById('rule-keywords').value;
    const actionType = document.getElementById('rule-action-type').value;
    const autoLike = document.getElementById('rule-autolike').checked;
    const rawPublicReplies = document.getElementById('rule-public-replies').value;
    const dmText = document.getElementById('rule-dm-text').value;
    const buttonText = document.getElementById('rule-dm-button-text').value;
    const buttonUrl = document.getElementById('rule-dm-button-url').value;

    let targetPostId = targetSelect.value;
    if (targetPostId === 'custom') {
      targetPostId = customInput.value.trim();
    }

    const keywords = rawKeywords.split(',').map(k => k.trim()).filter(Boolean);
    const publicReplies = rawPublicReplies.split('\n').map(r => r.trim()).filter(Boolean);

    const payload = {
      id: ruleId || undefined,
      name,
      keywords,
      matchType: keywords.includes('*') ? 'wildcard' : 'contains',
      targetPostId,
      actionType,
      autoLike,
      publicReplies,
      dmReply: {
        text: dmText,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null
      },
      active: true
    };

    try {
      const url = ruleId ? `/api/rules/${ruleId}` : '/api/rules';
      const method = ruleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        closeRuleModal();
        fetchRules();
        fetchStats();
      } else {
        alert('حدث خطأ: ' + (data.error || 'فشل حفظ القاعدة'));
      }
    } catch (err) {
      console.error('Error saving rule:', err);
    }
  });
}

async function fetchLogs() {
  try {
    const res = await fetch('/api/logs?limit=20');
    const data = await res.json();
    if (data.success) {
      renderLogsTable(data.logs || []);
    }
  } catch (err) {
    console.error('Error fetching logs:', err);
  }
}

function renderLogsTable(logs) {
  const tbody = document.getElementById('logs-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">لا توجد أنشطة مسجلة حتى الآن.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const dateStr = new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    const likeBadge = log.autoLikeStatus === 'success' 
      ? '<span class="badge badge-success">❤️ نعم</span>' 
      : '<span class="badge badge-warning">تخطي</span>';

    const pubBadge = log.publicReplyStatus === 'success'
      ? `<span class="badge badge-success">✅ تم الرد</span>`
      : `<span class="badge badge-danger">تخطي</span>`;

    const dmBadge = log.dmStatus === 'success'
      ? `<span class="badge badge-success">📩 تم الإرسال</span>`
      : `<span class="badge badge-warning">تخطي</span>`;

    return `
      <tr>
        <td><b>@${log.username}</b> ${log.simulated ? '<small style="color:var(--accent-cyan);">(محاكي)</small>' : ''}</td>
        <td>${log.commentText}</td>
        <td><span class="keyword-badge">${log.ruleMatched}</span></td>
        <td>${likeBadge}</td>
        <td>${pubBadge}</td>
        <td>${dmBadge}</td>
        <td><small style="color:var(--text-muted);">${dateStr}</small></td>
      </tr>
    `;
  }).join('');
}

async function fetchSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById('setting-ig-id').value = s.instagramAccountId || '17841413935836206';
      document.getElementById('setting-page-token').value = s.pageAccessToken || '';
      document.getElementById('setting-verify-token').value = s.webhookVerifyToken || 'my_custom_secret_verify_token_123';
      document.getElementById('setting-autolike').checked = s.autoLikeEnabled !== false;
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }
}

async function saveSettings() {
  const payload = {
    instagramAccountId: document.getElementById('setting-ig-id').value.trim(),
    pageAccessToken: document.getElementById('setting-page-token').value.trim(),
    webhookVerifyToken: document.getElementById('setting-verify-token').value.trim(),
    autoLikeEnabled: document.getElementById('setting-autolike').checked
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert('تم حفظ الإعدادات بنجاح!');
    }
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
