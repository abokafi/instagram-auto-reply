document.addEventListener('DOMContentLoaded', () => {
  initInitialComments();
});

function initInitialComments() {
  const container = document.getElementById('sim-comments-list');
  if (!container) return;

  container.innerHTML = `
    <div class="comment-item">
      <div>
        <b>sarah_style</b> كم سعر الفستان وحجم المقاسات؟
      </div>
      <span class="like-btn-heart liked">❤️</span>
    </div>
    <div class="comment-item comment-reply-item">
      <div>
        <b>my_brand_store</b> <span style="color:#00f2fe;">@sarah_style</span> أهلاً بك! 🌸 تم إرسال التفاصيل بالخاص 📩
      </div>
    </div>
  `;
}

function changeSimulatedPost(postId) {
  const label = document.getElementById('sim-post-type-label');
  const img = document.getElementById('sim-post-img');
  const caption = document.getElementById('sim-post-caption');
  const comments = document.getElementById('sim-comments-list');
  const dmMessages = document.getElementById('sim-dm-messages');

  comments.innerHTML = '';
  dmMessages.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin-top:80px; font-size:0.9rem;">اكتب تعليقاً في هذا المنشور التجريبي لتجربة الرد المخصص له! 🚀</div>`;

  if (postId === 'reel_101') {
    if (label) label.textContent = '🎬 ريلز عروض الخصم (Reel #101)';
    if (img) img.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80';
    if (caption) caption.innerHTML = '<b>my_brand_store</b> 🎬 فيديو ريلز العروض! اترك تعليقاً بكلمة (عروض) أو (خصم) للحصول على كوبون 30% 🎁!';
  } else {
    if (label) label.textContent = 'منشور عام (General Post)';
    if (img) img.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    if (caption) caption.innerHTML = '<b>my_brand_store</b> العرض الخاص لفترة محدودة ✨ اترك تعليقاً بسعر أو تفاصيل ليصلك الخصم فوراً 🎁!';
    initInitialComments();
  }
}

async function runSimulation() {
  const usernameInput = document.getElementById('sim-input-username');
  const textInput = document.getElementById('sim-input-text');
  const postSelector = document.getElementById('sim-post-selector');

  const username = usernameInput ? (usernameInput.value.trim() || 'user_demo') : 'user_demo';
  const commentText = textInput ? textInput.value.trim() : '';
  const postId = postSelector ? postSelector.value : null;

  if (!commentText) {
    alert('الرجاء كتابة نص التعليق أولاً (مثلاً: بكم أو عروض أو رائع)');
    return;
  }

  const container = document.getElementById('sim-comments-list');
  const dmMessages = document.getElementById('sim-dm-messages');
  const dmStatus = document.getElementById('sim-dm-status');

  const commentId = 'comment_' + Date.now();

  const userCommentEl = document.createElement('div');
  userCommentEl.className = 'comment-item';
  userCommentEl.id = commentId;
  userCommentEl.innerHTML = `
    <div>
      <b>@${username}</b> ${escapeHtml(commentText)}
    </div>
    <span class="like-btn-heart" id="heart-${commentId}">🤍</span>
  `;
  container.appendChild(userCommentEl);
  container.scrollTop = container.scrollHeight;

  textInput.value = '';

  try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, commentText, postId })
    });
    const data = await res.json();

    if (!data.success || !data.result) {
      console.error('Simulation error:', data);
      return;
    }

    const resData = data.result;

    setTimeout(() => {
      // 1. Auto-Like
      if (resData.autoLikeStatus === 'success') {
        const heartEl = document.getElementById(`heart-${commentId}`);
        if (heartEl) {
          heartEl.textContent = '❤️';
          heartEl.classList.add('liked');
        }
      }

      // 2. Public Reply
      if (resData.publicReplyText) {
        const replyEl = document.createElement('div');
        replyEl.className = 'comment-item comment-reply-item';
        replyEl.innerHTML = `
          <div>
            <b>my_brand_store</b> <span style="color:#00f2fe;">@${username}</span> ${escapeHtml(resData.publicReplyText)}
          </div>
        `;
        container.appendChild(replyEl);
        container.scrollTop = container.scrollHeight;
      }

      // 3. Private DM
      if (resData.dmReplyContent && (resData.dmReplyContent.text || typeof resData.dmReplyContent === 'string')) {
        if (dmMessages.querySelector('div[style*="text-align:center"]')) {
          dmMessages.innerHTML = '';
        }

        const dmObj = resData.dmReplyContent;
        const dmText = typeof dmObj === 'string' ? dmObj : (dmObj.text || '');
        const buttonText = typeof dmObj === 'object' ? dmObj.buttonText : null;
        const buttonUrl = typeof dmObj === 'object' ? dmObj.buttonUrl : null;

        const dmBubble = document.createElement('div');
        dmBubble.className = 'message-bubble message-received';

        let buttonHtml = '';
        if (buttonText && buttonUrl) {
          buttonHtml = `<a href="${buttonUrl}" target="_blank" class="message-btn">${escapeHtml(buttonText)}</a>`;
        }

        dmBubble.innerHTML = `
          <div style="font-size:0.75rem; color:var(--primary-pink); font-weight:600; margin-bottom:4px;">
            📩 رسالة خاصة تلقائية (${resData.ruleName || 'Private DM'})
          </div>
          <div>${escapeHtml(dmText).replace(/\n/g, '<br>')}</div>
          ${buttonHtml}
          <div style="font-size:0.7rem; color:var(--text-muted); text-align:left; margin-top:6px;">الآن</div>
        `;

        dmMessages.appendChild(dmBubble);
        dmMessages.scrollTop = dmMessages.scrollHeight;

        if (dmStatus) {
          dmStatus.textContent = `🟢 تم إرسال رسالة خاصة فورية إلى @${username}`;
          dmStatus.style.color = 'var(--success)';
        }
      } else {
        if (dmStatus) {
          dmStatus.textContent = `ℹ️ تم تنفيذ (${resData.ruleName || 'الإجراء المحدد'}) بدون إرسال DM`;
          dmStatus.style.color = 'var(--warning)';
        }
      }

      if (typeof fetchStats === 'function') fetchStats();
      if (typeof fetchLogs === 'function') fetchLogs();

    }, 600);

  } catch (err) {
    console.error('Error running simulation:', err);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
