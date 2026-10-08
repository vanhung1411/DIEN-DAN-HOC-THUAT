/**
 * EduHub Platform - Main App Controller & UI Binder (assets/js/app.js)
 * Tích hợp toàn bộ các mô-đun JS và điều khiển tương tác trực tiếp trên các trang HTML.
 */

// Lưu trạng thái lọc & sắp xếp cho Feed trang chủ
let currentFeedTab = 'all';
let currentFeedSort = 'newest';

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo Theme Sáng/Tối
  initTheme();

  // 1. Đồng bộ trạng thái Session & Header UI
  Auth.syncUI();

  // Khởi tạo Badge Thông báo
  if (window.Notifications) {
    Notifications.updateBadgeUI();
  }

  // 2. Tự động xác định trang hiện tại và kích hoạt render (Hỗ trợ cả Clean URL không đuôi .html)
  const rawPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase().replace('.html', '');

  if (rawPath === 'index' || rawPath === '') {
    initIndexPage();
  } else if (rawPath === 'post-detail') {
    initPostDetailPage();
  } else if (rawPath === 'documents') {
    initDocumentsPage();
  } else if (rawPath === 'document-detail') {
    initDocumentDetailPage();
  } else if (rawPath === 'friends') {
    initFriendsPage();
  } else if (rawPath === 'saved') {
    initSavedPage();
  } else if (rawPath === 'my-posts') {
    initMyPostsPage();
  } else if (rawPath === 'profile') {
    initProfilePage();
  } else if (rawPath === 'moderation' || rawPath === 'moderation-queue') {
    initModerationPage();
  }

  // 3. Đăng ký các Event Delegation toàn ứng dụng
  bindGlobalEvents();

  // 4. Phím tắt / để tìm kiếm nhanh
  bindKeyboardShortcuts();
});

// ==========================================
// THỰC THI THEME SÁNG / TỐI (DARK MODE)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('studyhub_theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('studyhub_theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
  Utils.showToast(`Đã chuyển sang chế độ ${isDark ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}`, 'info');
}

function updateThemeIcon() {
  document.querySelectorAll('.btn-theme-toggle, #btnThemeToggle').forEach(btn => {
    const icon = btn.querySelector('.material-symbols-outlined');
    const isDark = document.documentElement.classList.contains('dark');
    if (icon) icon.textContent = isDark ? 'dark_mode' : 'light_mode';
  });
}

// Phím tắt bàn phím tiện ích
function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const searchInput = document.querySelector('header input[name="q"], header input[placeholder*="Tìm"]');
      if (searchInput) {
        searchInput.focus();
        Utils.showToast('Nhập từ khóa để tìm kiếm...', 'info');
      }
    }
  });
}

// ==========================================
// 1. TRANG CHỦ & BẢNG TIN THẢO LUẬN (index.html)
// ==========================================
function initIndexPage() {
  // Lấy tham số tag/topic từ URL nếu có
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');

  renderFeed(currentFeedTab, currentFeedSort, tagParam);

  // 1.1 Xử lý Form đăng bài thảo luận nhanh
  const titleInput = document.getElementById('quickPostTitle');
  const contentInput = document.getElementById('quickPostContent');
  const mediaUrlInput = document.getElementById('quickPostMediaUrl');
  const codeSnippetInput = document.getElementById('quickPostCodeSnippet');
  const visibilitySelect = document.getElementById('quickPostVisibility');
  const submitBtn = document.getElementById('btnQuickPostSubmit');

  const mediaContainer = document.getElementById('mediaInputContainer');
  const codeContainer = document.getElementById('codeInputContainer');

  const btnToggleMedia = document.getElementById('btnToggleMediaInput');
  const btnToggleCode = document.getElementById('btnToggleCodeInput');
  const btnInsertLatex = document.getElementById('btnInsertLatex');

  // Toggle ảnh đính kèm
  if (btnToggleMedia && mediaContainer) {
    btnToggleMedia.addEventListener('click', () => {
      mediaContainer.classList.toggle('hidden');
      if (!mediaContainer.classList.contains('hidden') && mediaUrlInput) {
        mediaUrlInput.focus();
      }
    });
  }

  // Toggle code snippet
  if (btnToggleCode && codeContainer) {
    btnToggleCode.addEventListener('click', () => {
      codeContainer.classList.toggle('hidden');
      if (!codeContainer.classList.contains('hidden') && codeSnippetInput) {
        codeSnippetInput.focus();
      }
    });
  }

  // Chèn công thức LaTeX
  if (btnInsertLatex && contentInput) {
    btnInsertLatex.addEventListener('click', () => {
      const snippet = '\n$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$\n';
      const pos = contentInput.selectionStart || contentInput.value.length;
      contentInput.value = contentInput.value.substring(0, pos) + snippet + contentInput.value.substring(pos);
      contentInput.focus();
      Utils.showToast('Đã chèn khung công thức LaTeX!', 'info');
    });
  }

  // Gửi bài viết mới
  if (submitBtn && contentInput) {
    submitBtn.addEventListener('click', () => {
      const content = contentInput.value.trim();
      const title = titleInput ? titleInput.value.trim() : '';
      if (!content) {
        Utils.showToast('Vui lòng nhập nội dung bài thảo luận!', 'warning');
        return;
      }

      const visibility = visibilitySelect ? visibilitySelect.value : 'Public';
      const mediaUrl = mediaUrlInput ? mediaUrlInput.value.trim() : null;
      const codeSnippet = codeSnippetInput ? codeSnippetInput.value.trim() : null;

      const newPost = Posts.createPost({
        title: title || content.substring(0, 50),
        content: content,
        mediaUrl: mediaUrl,
        codeSnippet: codeSnippet,
        visibility: visibility
      });

      if (newPost) {
        contentInput.value = '';
        if (titleInput) titleInput.value = '';
        if (mediaUrlInput) mediaUrlInput.value = '';
        if (codeSnippetInput) codeSnippetInput.value = '';
        if (mediaContainer) mediaContainer.classList.add('hidden');
        if (codeContainer) codeContainer.classList.add('hidden');

        renderFeed(currentFeedTab, currentFeedSort);
      }
    });
  }

  // 1.2 Xử lý chuyển Tab lọc Feed (Tất cả, Đang quan tâm, Hữu ích, Bạn bè)
  document.querySelectorAll('.feed-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.feed-tab').forEach(t => {
        t.className = 'feed-tab px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg transition-all';
      });
      this.className = 'feed-tab px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm font-label-lg text-label-lg transition-all';

      currentFeedTab = this.dataset.tab || 'all';
      renderFeed(currentFeedTab, currentFeedSort);
    });
  });

  // 1.3 Xử lý dropdown Sắp xếp Feed
  const feedSortSelect = document.getElementById('feedSortSelect');
  if (feedSortSelect) {
    feedSortSelect.addEventListener('change', (e) => {
      currentFeedSort = e.target.value;
      renderFeed(currentFeedTab, currentFeedSort);
    });
  }
}

// ==========================================
// 1.5. TRANG CHI TIẾT BÀI VIẾT (post-detail.html)
// ==========================================
function initPostDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id') || 'post_501';

  const posts = StorageManager.get('posts', []);
  const post = posts.find(p => p.id === postId) || posts[0];

  if (post) {
    const article = document.getElementById('postDetailArticle');
    if (article) article.dataset.postId = post.id;

    const navTitle = document.getElementById('postDetailNavTitle');
    if (navTitle) navTitle.textContent = post.title;

    const categorySpan = document.getElementById('postDetailCategory');
    if (categorySpan) categorySpan.textContent = post.category || 'Công nghệ thông tin';

    const authorAvatar = document.getElementById('postDetailAuthorAvatar');
    if (authorAvatar) authorAvatar.src = post.authorAvatar;

    const authorName = document.getElementById('postDetailAuthorName');
    if (authorName) authorName.textContent = post.authorName;

    const meta = document.getElementById('postDetailMeta');
    if (meta) meta.textContent = `${post.authorRole || 'Sinh viên'} • ${Utils.timeAgo(post.createdAt)}`;

    const visibility = document.getElementById('postDetailVisibility');
    if (visibility) visibility.textContent = `🌐 ${post.visibility || 'Public'}`;

    const titleEl = document.getElementById('postDetailTitle');
    if (titleEl) titleEl.textContent = post.title;

    const contentEl = document.getElementById('postDetailContent');
    if (contentEl) contentEl.textContent = post.content;

    // Code snippet
    const codeContainer = document.getElementById('postDetailCodeContainer');
    const codeEl = document.getElementById('postDetailCode');
    if (post.codeSnippet && codeContainer && codeEl) {
      codeContainer.classList.remove('hidden');
      codeEl.textContent = post.codeSnippet;
    } else if (codeContainer) {
      codeContainer.classList.add('hidden');
    }

    // Media
    const mediaContainer = document.getElementById('postDetailMediaContainer');
    const mediaEl = document.getElementById('postDetailMedia');
    if (post.mediaUrl && mediaContainer && mediaEl) {
      mediaContainer.classList.remove('hidden');
      mediaEl.src = post.mediaUrl;
    } else if (mediaContainer) {
      mediaContainer.classList.add('hidden');
    }

    // Upvotes & Comments count
    const upvotesCount = document.getElementById('postDetailUpvotesCount');
    if (upvotesCount) upvotesCount.textContent = `👍 ${post.likes ? post.likes.length : 0} Upvotes`;

    const commentsCountEl = document.getElementById('postDetailCommentsCount');
    if (commentsCountEl) commentsCountEl.textContent = `💬 ${post.commentsCount || 0} Bình luận`;

    // Sidebar Author Info
    const sidebarAvatar = document.getElementById('sidebarAuthorAvatar');
    if (sidebarAvatar) sidebarAvatar.src = post.authorAvatar;

    const sidebarName = document.getElementById('sidebarAuthorName');
    if (sidebarName) sidebarName.textContent = post.authorName;
  }

  // Render comment list
  renderPostComments(post ? post.id : postId);

  // Bind Submit Comment button
  const btnSubmitComment = document.getElementById('btnSubmitComment');
  const commentInput = document.getElementById('postCommentContent');

  if (btnSubmitComment && commentInput) {
    btnSubmitComment.addEventListener('click', async (e) => {
      e.preventDefault();
      const content = commentInput.value.trim();
      if (!content) {
        Utils.showToast('Vui lòng nhập nội dung bình luận!', 'warning');
        return;
      }

      const targetPostId = post ? post.id : postId;
      const newComment = await Posts.addComment(targetPostId, content);
      if (newComment) {
        commentInput.value = '';
        renderPostComments(targetPostId);

        // Refresh comment count in DOM
        const updatedPosts = StorageManager.get('posts', []);
        const updatedPost = updatedPosts.find(p => p.id === targetPostId);
        const commentsCountEl = document.getElementById('postDetailCommentsCount');
        if (commentsCountEl && updatedPost) {
          commentsCountEl.textContent = `💬 ${updatedPost.commentsCount || 0} Bình luận`;
        }
      }
    });
  }
}

// Render danh sách bình luận (Comment Thread & Reply UI)
function renderPostComments(postId) {
  const container = document.getElementById('commentsContainer');
  if (!container) return;

  const allComments = StorageManager.get('comments', []);
  const postComments = allComments.filter(c => c.postId === postId || c.targetId === postId);

  if (postComments.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest p-8 rounded-xl text-center shadow-sm space-y-2 text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline">forum</span>
        <h4 class="font-title-md text-on-surface">Chưa có bình luận nào</h4>
        <p class="font-body-sm text-outline">Hãy là người đầu tiên đưa ra phản hồi học thuật cho bài viết này!</p>
      </div>
    `;
    return;
  }

  // Group top-level comments and child replies
  const parentComments = postComments.filter(c => !c.parentId);
  const repliesMap = {};
  postComments.filter(c => c.parentId).forEach(r => {
    if (!repliesMap[r.parentId]) repliesMap[r.parentId] = [];
    repliesMap[r.parentId].push(r);
  });

  let html = '';

  parentComments.forEach(comment => {
    const isMod = comment.authorRole === 'Moderator';
    const replies = repliesMap[comment.id] || [];

    let repliesHTML = '';
    replies.forEach(reply => {
      repliesHTML += `
        <div class="flex items-start gap-3 pt-3 border-t border-surface-container-low pl-4 border-l-2 border-primary/20">
          <img class="w-8 h-8 rounded-full object-cover shadow-sm bg-surface-container" src="${Utils.escapeHTML(reply.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')}" alt="Avatar"/>
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <strong class="font-title-sm text-on-surface text-[14px]">${Utils.escapeHTML(reply.authorName)}</strong>
                <span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px]">${Utils.escapeHTML(reply.authorRole || 'Sinh viên')}</span>
              </div>
              <span class="font-body-sm text-xs text-outline">${Utils.timeAgo(reply.createdAt)}</span>
            </div>
            <p class="font-body-md text-on-surface-variant text-[14px] leading-relaxed">${reply.content}</p>
          </div>
        </div>
      `;
    });

    html += `
      <div class="bg-surface-container-lowest p-5 rounded-xl shadow-sm space-y-3" data-comment-id="${comment.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img class="w-10 h-10 rounded-full object-cover shadow-sm bg-surface-container" src="${Utils.escapeHTML(comment.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')}" alt="Avatar"/>
            <div>
              <div class="flex items-center gap-2">
                <strong class="font-title-md text-on-surface">${Utils.escapeHTML(comment.authorName)}</strong>
                <span class="px-2 py-0.5 rounded-full ${isMod ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold' : 'bg-surface-container text-on-surface-variant'} font-label-sm">${Utils.escapeHTML(comment.authorRole || 'Sinh viên')}</span>
              </div>
              <span class="font-body-sm text-xs text-outline">${Utils.timeAgo(comment.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <p class="font-body-md text-on-surface-variant leading-relaxed pl-1">${comment.content}</p>
        
        <div class="flex items-center gap-4 pt-2 text-body-sm text-outline border-t border-surface-container-low">
          <button class="btn-reply-comment font-label-md text-primary hover:underline flex items-center gap-1 cursor-pointer" type="button" data-comment-id="${comment.id}">
            <span class="material-symbols-outlined text-[16px]">reply</span> Trả lời
          </button>
        </div>

        <!-- Inline Reply Input Box (Hidden by default) -->
        <div class="reply-box hidden pt-3 space-y-2" id="replyBox_${comment.id}">
          <textarea class="reply-input w-full p-2.5 bg-surface-container-low rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary font-body-md" rows="2" placeholder="Viết phản hồi cho ${Utils.escapeHTML(comment.authorName)}..."></textarea>
          <div class="flex justify-end gap-2">
            <button class="btn-cancel-reply px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-label-md cursor-pointer" type="button" data-comment-id="${comment.id}">Hủy</button>
            <button class="btn-send-reply px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-label-md shadow-sm cursor-pointer" type="button" data-comment-id="${comment.id}">Gửi phản hồi</button>
          </div>
        </div>

        ${repliesHTML ? `<div class="mt-3 space-y-3 pt-2">${repliesHTML}</div>` : ''}
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind Reply button toggle & send events
  container.querySelectorAll('.btn-reply-comment').forEach(btn => {
    btn.addEventListener('click', () => {
      const cId = btn.dataset.commentId;
      const box = document.getElementById(`replyBox_${cId}`);
      if (box) box.classList.toggle('hidden');
    });
  });

  container.querySelectorAll('.btn-cancel-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const cId = btn.dataset.commentId;
      const box = document.getElementById(`replyBox_${cId}`);
      if (box) box.classList.add('hidden');
    });
  });

  container.querySelectorAll('.btn-send-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const cId = btn.dataset.commentId;
      const box = document.getElementById(`replyBox_${cId}`);
      const textarea = box ? box.querySelector('.reply-input') : null;
      if (textarea) {
        const text = textarea.value.trim();
        if (!text) {
          Utils.showToast('Nội dung trả lời không được để trống!', 'warning');
          return;
        }

        Posts.addComment(postId, text, cId);
        renderPostComments(postId);
      }
    });
  });
}

// Vẽ lại Bảng tin bài viết
function renderFeed(filterTab = 'all', sortOption = 'newest', tagFilter = null) {
  let posts = Posts.getAll(filterTab, sortOption);

  if (tagFilter) {
    const cleanTag = tagFilter.toLowerCase().replace('#', '');
    posts = posts.filter(p => p.tags && p.tags.some(t => t.toLowerCase().includes(cleanTag)));
  }

  const feedContainer = document.querySelector('section.col-span-12.xl\\:col-span-8');
  if (!feedContainer) return;

  // Giữ lại 2 phần tử đầu (Hộp đăng bài và Tabs filter)
  const topBoxes = Array.from(feedContainer.children).slice(0, 2);
  feedContainer.innerHTML = '';
  topBoxes.forEach(box => feedContainer.appendChild(box));

  if (posts.length === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'bg-surface-container-lowest rounded-xl p-8 text-center text-on-surface-variant space-y-3 shadow-sm';
    emptyBox.innerHTML = `
      <span class="material-symbols-outlined text-5xl text-outline mb-1">inbox</span>
      <h3 class="font-title-lg text-on-surface">Chưa có bài thảo luận nào</h3>
      <p class="font-body-sm text-outline max-w-sm mx-auto">Không tìm thấy bài thảo luận phù hợp với bộ lọc hiện tại. Hãy thử chọn mục khác hoặc đăng bài thảo luận đầu tiên!</p>
    `;
    feedContainer.appendChild(emptyBox);
    return;
  }

  posts.forEach(post => {
    const article = document.createElement('article');
    article.className = 'bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow';
    article.dataset.postId = post.id;

    const likesCount = post.likes ? post.likes.length : 0;
    const isLiked = Auth.getCurrentUser() && post.likes && post.likes.includes(Auth.getCurrentUser().id);
    const isSaved = Posts.isPostSaved(post.id);

    let mediaHTML = '';
    if (post.mediaUrl) {
      mediaHTML = `
        <div class="relative rounded-xl overflow-hidden bg-surface-container max-h-[380px]">
          <img class="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300" alt="Post media" src="${Utils.escapeHTML(post.mediaUrl)}"/>
        </div>
      `;
    }

    let codeHTML = '';
    if (post.codeSnippet) {
      codeHTML = `
        <div class="rounded-xl overflow-hidden bg-inverse-surface text-inverse-on-surface p-4 text-[13px] font-mono leading-relaxed shadow-inner">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-inverse-on-surface/10 text-outline-variant font-label-sm text-label-sm">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-error"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim"></span>
              <span class="ml-2">Code Snippet</span>
            </span>
          </div>
          <pre class="overflow-x-auto"><code>${post.codeSnippet}</code></pre>
        </div>
      `;
    }

    let tagsHTML = '';
    if (post.tags && post.tags.length > 0) {
      tagsHTML = `
        <div class="flex items-center gap-2 flex-wrap pt-1">
          ${post.tags.map(t => `<a href="index.html?tag=${encodeURIComponent(t.replace('#', ''))}" class="px-2.5 py-1 rounded-md bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer">${Utils.escapeHTML(t)}</a>`).join('')}
        </div>
      `;
    }

    article.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <img class="w-11 h-11 rounded-full object-cover bg-surface-container-high" alt="${Utils.escapeHTML(post.authorName)}" src="${Utils.escapeHTML(post.authorAvatar)}"/>
          <div>
            <div class="flex items-center gap-2">
              <a href="profile.html" class="font-title-md text-title-md text-on-surface hover:text-primary cursor-pointer">${Utils.escapeHTML(post.authorName)}</a>
              <span class="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">${Utils.escapeHTML(post.visibility)}</span>
            </div>
            <div class="flex items-center gap-2 font-body-sm text-body-sm text-outline">
              <span>${Utils.escapeHTML(post.authorRole || 'Sinh viên')}</span>
              <span>•</span>
              <span>${Utils.timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div class="relative">
          <button class="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high btn-post-options" type="button" title="Tùy chọn">
            <span class="material-symbols-outlined text-[20px]">more_horiz</span>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <a href="post-detail.html?id=${post.id}" class="block">
          <h2 class="font-headline-sm text-headline-sm text-on-surface hover:text-primary transition-colors">${Utils.escapeHTML(post.title)}</h2>
        </a>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">${Utils.escapeHTML(post.content)}</p>
      </div>

      ${codeHTML}
      ${mediaHTML}
      ${tagsHTML}

      <div class="flex items-center justify-between pt-3 text-on-surface-variant font-label-lg text-label-lg border-t border-surface-container-low">
        <div class="flex items-center gap-2">
          <button class="btn-like flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container ${isLiked ? 'text-primary font-bold' : 'text-on-surface-variant'} transition-colors" type="button">
            <span class="material-symbols-outlined text-[20px]">${isLiked ? 'thumb_up' : 'thumb_up_off_alt'}</span>
            <span>${likesCount} Upvote</span>
          </button>
          <a href="post-detail.html?id=${post.id}" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
            <span class="material-symbols-outlined text-[20px]">chat_bubble</span>
            <span>${post.commentsCount || 0} Bình luận</span>
          </a>
        </div>
        <div class="flex items-center gap-1">
          <button class="btn-bookmark-post p-2 rounded-lg hover:bg-surface-container-high ${isSaved ? 'text-primary' : 'text-on-surface-variant'} transition-colors" title="${isSaved ? 'Đã lưu' : 'Lưu bài viết'}" type="button">
            <span class="material-symbols-outlined text-[20px]">${isSaved ? 'bookmark' : 'bookmark_border'}</span>
          </button>
          <button class="btn-share-post p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors" title="Chia sẻ bài viết" type="button">
            <span class="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button class="btn-report-post p-2 rounded-lg hover:bg-error-container text-outline hover:text-error transition-colors" title="Báo cáo vi phạm" type="button">
            <span class="material-symbols-outlined text-[20px]">flag</span>
          </button>
        </div>
      </div>
    `;

    feedContainer.appendChild(article);
  });
}

// ==========================================
// 2. THƯ VIỆN TÀI LIỆU (documents.html)
// ==========================================
function initDocumentsPage() {
  const uploadBtn = document.getElementById('btnOpenUpload');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      const modal = document.getElementById('uploadModal');
      if (modal) modal.classList.remove('hidden');
    });
  }
}

// ==========================================
// 2.5. CHI TIẾT TÀI LIỆU (document-detail.html)
// ==========================================
function initDocumentDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id') || 'doc_101';

  const docs = StorageManager.get('documents', []);
  const doc = docs.find(d => d.id === docId) || docs[0];

  if (!doc) return;

  // Hydrate Breadcrumb
  const breadcrumbSubject = document.getElementById('docBreadcrumbSubject');
  if (breadcrumbSubject) breadcrumbSubject.textContent = doc.subject || 'Công nghệ thông tin';

  const breadcrumbTitle = document.getElementById('docBreadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = doc.title;

  // Hydrate Badges & Date
  const subjectBadge = document.getElementById('docSubjectBadge');
  if (subjectBadge) subjectBadge.innerHTML = `<span class="material-symbols-outlined text-[14px]">school</span> ${doc.subject || 'CNTT'} • ${doc.code || 'CS102'}`;

  const formatBadge = document.getElementById('docFormatBadge');
  if (formatBadge) formatBadge.textContent = `📄 ${(doc.format || 'PDF').toUpperCase()} Document`;

  const createdAt = document.getElementById('docCreatedAt');
  if (createdAt) createdAt.innerHTML = `<span class="material-symbols-outlined text-[14px]">schedule</span> Đã tải lên ${Utils.timeAgo(doc.createdAt)}`;

  // Hydrate Title & Description
  const titleEl = document.getElementById('docDetailTitle');
  if (titleEl) titleEl.textContent = doc.title;

  const descEl = document.getElementById('docDetailDescription');
  if (descEl) descEl.textContent = doc.description;

  // Hydrate Metrics
  const downloadsCount = document.getElementById('docDownloadsCount');
  if (downloadsCount) downloadsCount.textContent = (doc.downloadsCount || 1240).toLocaleString();

  const savesCount = document.getElementById('docSavesCount');
  if (savesCount) savesCount.textContent = (doc.savesCount || 342).toLocaleString();

  const ratingScore = document.getElementById('docRatingScore');
  if (ratingScore) ratingScore.textContent = `${(doc.rating || 4.9).toFixed(1)} / 5.0`;

  const pageSize = document.getElementById('docPageSize');
  if (pageSize) pageSize.textContent = `${doc.pageCount || 128} Trang • ${doc.fileSize || '14.8MB'}`;

  // Hydrate Author Info
  const authorAvatar = document.getElementById('docAuthorAvatar');
  if (authorAvatar && doc.authorAvatar) authorAvatar.src = doc.authorAvatar;

  const authorName = document.getElementById('docAuthorName');
  if (authorName) authorName.textContent = doc.authorName || 'Trần Minh Quân';

  // Check Save status
  updateSaveDocButtonUI(doc.id);

  // Bind Action Buttons
  const btnDownload = document.getElementById('btnDownloadDoc');
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      Documents.incrementDownload(doc.id);
      const updatedDocs = StorageManager.get('documents', []);
      const updatedDoc = updatedDocs.find(d => d.id === doc.id);
      if (updatedDoc && downloadsCount) {
        downloadsCount.textContent = (updatedDoc.downloadsCount || 0).toLocaleString();
      }
    });
  }

  const btnSave = document.getElementById('btnSaveDoc');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const isSaved = Documents.toggleSave(doc.id);
      updateSaveDocButtonUI(doc.id);
      const updatedDocs = StorageManager.get('documents', []);
      const updatedDoc = updatedDocs.find(d => d.id === doc.id);
      if (updatedDoc && savesCount) {
        savesCount.textContent = (updatedDoc.savesCount || 0).toLocaleString();
      }
    });
  }

  const btnShare = document.getElementById('btnShareDoc');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).then(() => {
        Utils.showToast('Đã sao chép liên kết tài liệu!', 'success');
      }).catch(() => {
        Utils.showToast(`Liên kết: ${shareUrl}`, 'info');
      });
    });
  }

  const btnReport = document.getElementById('btnReportDoc');
  if (btnReport) {
    btnReport.addEventListener('click', () => {
      Moderation.openReportModal('document', doc.id, doc.title);
    });
  }

  // Interactive PDF Viewer Controls
  const zoomInBtn = document.getElementById('btnZoomIn');
  const zoomOutBtn = document.getElementById('btnZoomOut');
  const zoomLevel = document.getElementById('zoomLevel');
  const pdfSheet = document.getElementById('pdfPageSheet');
  let currentZoom = 100;

  if (zoomInBtn && zoomOutBtn && pdfSheet && zoomLevel) {
    zoomInBtn.addEventListener('click', () => {
      if (currentZoom < 150) {
        currentZoom += 15;
        pdfSheet.style.transform = `scale(${currentZoom / 100})`;
        zoomLevel.textContent = `${currentZoom}%`;
      }
    });

    zoomOutBtn.addEventListener('click', () => {
      if (currentZoom > 70) {
        currentZoom -= 15;
        pdfSheet.style.transform = `scale(${currentZoom / 100})`;
        zoomLevel.textContent = `${currentZoom}%`;
      }
    });
  }

  // Fullscreen button
  const fullscreenBtn = document.getElementById('btnFullscreen');
  const pdfCanvasContainer = document.getElementById('pdfCanvasContainer');
  if (fullscreenBtn && pdfCanvasContainer) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        pdfCanvasContainer.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });
  }

  // Submit Review Form
  const btnSubmitReview = document.getElementById('btnSubmitDocReview');
  const reviewTextarea = document.getElementById('docReviewContent');
  if (btnSubmitReview && reviewTextarea) {
    btnSubmitReview.addEventListener('click', () => {
      const text = reviewTextarea.value.trim();
      if (!text) {
        Utils.showToast('Vui lòng nhập nội dung đánh giá!', 'warning');
        return;
      }

      const currentUser = Auth.getCurrentUser();
      const reviewsStream = document.getElementById('docReviewsStream');
      if (reviewsStream) {
        const reviewBox = document.createElement('div');
        reviewBox.className = 'p-4 rounded-xl bg-surface-container-low/50 space-y-2 border border-primary/20 animate-fade-in';
        reviewBox.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <strong class="font-title-md text-on-surface text-sm">${Utils.escapeHTML(currentUser?.fullName || 'Sinh viên')}</strong>
              <span class="text-amber-500 text-xs">★★★★★</span>
            </div>
            <span class="font-body-sm text-xs text-outline">Vừa xong</span>
          </div>
          <p class="font-body-sm text-on-surface-variant text-sm">${Utils.escapeHTML(text)}</p>
        `;
        reviewsStream.prepend(reviewBox);
        reviewTextarea.value = '';
        Utils.showToast('Đã gửi đánh giá cho tài liệu!', 'success');
      }
    });
  }
}

function updateSaveDocButtonUI(docId) {
  const currentUser = Auth.getCurrentUser();
  const icon = document.getElementById('saveDocIcon');
  const label = document.getElementById('saveDocLabel');
  const btn = document.getElementById('btnSaveDoc');

  if (!currentUser || !icon || !label || !btn) return;

  const isSaved = currentUser.savedDocIds && currentUser.savedDocIds.includes(docId);
  if (isSaved) {
    icon.textContent = 'bookmark';
    label.textContent = 'Đã lưu';
    btn.classList.add('text-primary', 'bg-primary-container/20');
  } else {
    icon.textContent = 'bookmark_border';
    label.textContent = 'Lưu tài liệu';
    btn.classList.remove('text-primary', 'bg-primary-container/20');
  }
}

// ==========================================
// 2.8. MẠNG LƯỚI BẠN BÈ (friends.html)
// ==========================================
function initFriendsPage() {
  renderPendingFriendRequests();
  renderFriendList();

  const filterInput = document.getElementById('friendFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderFriendList(e.target.value);
    });
  }
}

function renderPendingFriendRequests() {
  const container = document.getElementById('pendingRequestsContainer');
  const titleEl = document.getElementById('pendingRequestsTitle');

  const pendingRequests = Friends.getPendingRequests();

  if (titleEl) {
    titleEl.textContent = `Lời mời kết bạn đang chờ (${pendingRequests.length})`;
  }

  if (!container) return;

  if (pendingRequests.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 rounded-xl bg-surface-container-low text-center space-y-2 text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline">mark_email_read</span>
        <h4 class="font-title-md text-on-surface">Không có lời mời kết bạn nào đang chờ</h4>
        <p class="font-body-sm text-outline text-xs">Bạn đã phản hồi tất cả lời mời kết bạn.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingRequests.map(req => `
    <div class="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between space-y-3 shadow-sm" data-request-id="${req.id}">
      <div class="flex items-center gap-3">
        <img class="w-12 h-12 rounded-full object-cover shadow-sm bg-surface-container" alt="${Utils.escapeHTML(req.requester?.fullName || 'Thành viên')}" src="${Utils.escapeHTML(req.requester?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100')}"/>
        <div>
          <h3 class="font-title-md text-on-surface">${Utils.escapeHTML(req.requester?.fullName || 'Sinh viên EduHub')}</h3>
          <p class="font-body-sm text-outline text-xs">${Utils.escapeHTML(req.requester?.school || 'ĐH Bách Khoa')} • ${req.requester?.role === 'moderator' ? 'Moderator' : 'Sinh viên'}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="btn-accept-request py-1.5 rounded-lg bg-primary text-on-primary font-label-md hover:bg-primary-container shadow-sm transition-colors cursor-pointer" data-id="${req.id}">Chấp nhận</button>
        <button type="button" class="btn-reject-request py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md hover:bg-surface-container transition-colors cursor-pointer" data-id="${req.id}">Từ chối</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-accept-request').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Friends.acceptRequest(btn.dataset.id);
      renderPendingFriendRequests();
      renderFriendList();
    });
  });

  container.querySelectorAll('.btn-reject-request').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Friends.rejectRequest(btn.dataset.id);
      renderPendingFriendRequests();
    });
  });
}

function renderFriendList(filterKeyword = '') {
  const container = document.getElementById('friendsListContainer');
  const countTitle = document.getElementById('friendsCountTitle');
  
  let friends = Friends.getFriendList();

  if (filterKeyword) {
    const q = filterKeyword.toLowerCase();
    friends = friends.filter(f => f.fullName.toLowerCase().includes(q) || (f.school && f.school.toLowerCase().includes(q)));
  }

  if (countTitle) {
    countTitle.textContent = `Danh sách bạn bè (${friends.length})`;
  }

  if (!container) return;

  if (friends.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 rounded-xl bg-surface-container-low text-center space-y-2 text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl text-outline">group_off</span>
        <h4 class="font-title-md text-on-surface">Chưa có bạn bè nào</h4>
        <p class="font-body-sm text-outline text-xs">Hãy tìm kiếm sinh viên và gửi lời mời kết bạn!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = friends.map(friend => `
    <div class="p-4 rounded-xl bg-surface-container-low flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-center gap-3">
        <img class="w-10 h-10 rounded-full object-cover shadow-sm bg-surface-container" alt="${Utils.escapeHTML(friend.fullName)}" src="${Utils.escapeHTML(friend.avatar)}"/>
        <div>
          <h4 class="font-title-md text-body-md text-on-surface">${Utils.escapeHTML(friend.fullName)}</h4>
          <span class="font-body-sm text-outline text-xs">${Utils.escapeHTML(friend.school || 'ĐH Bách Khoa')}</span>
        </div>
      </div>
      <button type="button" class="btn-message-friend p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer" data-id="${friend.id}" title="Nhắn tin">
        <span class="material-symbols-outlined text-[18px]">chat</span>
      </button>
    </div>
  `).join('');
}

// ==========================================
// 3. NỘI DUNG ĐÃ LƯU (saved.html)
// ==========================================
function initSavedPage() {
  const currentUser = Auth.getCurrentUser();
  if (!currentUser) return;

  const savedPostIds = currentUser.savedPostIds || ['post_501'];
  const savedDocIds = currentUser.savedDocIds || ['doc_101'];

  const allPosts = StorageManager.get('posts', []);
  const allDocs = StorageManager.get('documents', []);

  const savedPosts = allPosts.filter(p => savedPostIds.includes(p.id));
  const savedDocs = allDocs.filter(d => savedDocIds.includes(d.id));

  const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
  if (!container) return;

  if (savedPosts.length === 0 && savedDocs.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-2xl space-y-2 shadow-sm">
        <span class="material-symbols-outlined text-5xl text-outline mb-2">bookmark_border</span>
        <h3 class="font-title-lg text-on-surface">Bạn chưa lưu nội dung nào</h3>
        <p class="font-body-sm text-outline">Thử duyệt Bảng tin Thảo luận hoặc Thư viện Tài liệu và bấm nút Lưu bài viết!</p>
      </div>
    `;
    return;
  }

  let html = '';

  savedPosts.forEach(post => {
    html += `
      <div class="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-3 relative flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm font-semibold">Bài thảo luận</span>
            <span class="font-label-sm text-xs text-outline">${Utils.escapeHTML(post.category || 'Học thuật')}</span>
          </div>
          <a href="post-detail.html?id=${post.id}">
            <h3 class="font-title-lg text-on-surface hover:text-primary transition-colors line-clamp-2">${Utils.escapeHTML(post.title)}</h3>
          </a>
          <p class="font-body-md text-on-surface-variant line-clamp-2">${Utils.escapeHTML(post.content)}</p>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-surface-container-low text-body-sm text-outline">
          <span>${Utils.timeAgo(post.createdAt)}</span>
          <button class="btn-remove-saved-post text-error hover:underline flex items-center gap-1 font-label-md cursor-pointer" data-id="${post.id}" type="button">
            <span class="material-symbols-outlined text-[16px]">bookmark_remove</span> Bỏ lưu
          </button>
        </div>
      </div>
    `;
  });

  savedDocs.forEach(doc => {
    html += `
      <div class="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-3 relative flex flex-col justify-between hover:shadow-md transition-shadow">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-semibold">Tài liệu học tập</span>
            <span class="font-label-sm text-xs text-outline">${Utils.escapeHTML(doc.subject || 'Tổng hợp')}</span>
          </div>
          <a href="document-detail.html?id=${doc.id}">
            <h3 class="font-title-lg text-on-surface hover:text-secondary transition-colors line-clamp-2">${Utils.escapeHTML(doc.title)}</h3>
          </a>
          <p class="font-body-md text-on-surface-variant line-clamp-2">${Utils.escapeHTML(doc.description)}</p>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-surface-container-low text-body-sm text-outline">
          <span>${Utils.escapeHTML(doc.fileSize || '10 MB')}</span>
          <button class="btn-remove-saved-doc text-error hover:underline flex items-center gap-1 font-label-md cursor-pointer" data-id="${doc.id}" type="button">
            <span class="material-symbols-outlined text-[16px]">bookmark_remove</span> Bỏ lưu
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.btn-remove-saved-post').forEach(btn => {
    btn.addEventListener('click', () => {
      Posts.toggleSavePost(btn.dataset.id);
      initSavedPage();
    });
  });

  container.querySelectorAll('.btn-remove-saved-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const user = Auth.getCurrentUser();
      if (user && user.savedDocIds) {
        user.savedDocIds = user.savedDocIds.filter(dId => dId !== id);
        Auth.setCurrentUser(user);
        Utils.showToast('Đã xóa tài liệu khỏi danh sách đã lưu', 'info');
        initSavedPage();
      }
    });
  });
}

// ==========================================
// 4. BÀI VIẾT CỦA TÔI (my-posts.html)
// ==========================================
function initMyPostsPage() {
  const currentUser = Auth.getCurrentUser();
  if (!currentUser) return;

  const myPosts = StorageManager.get('posts', []).filter(p => p.userId === currentUser.id);
  const container = document.querySelector('.space-y-4');
  const titleHeader = document.querySelector('h1.font-headline-lg');

  if (titleHeader) {
    titleHeader.textContent = `Bài Thảo Luận Của Tôi (${myPosts.length})`;
  }

  if (!container) return;

  if (myPosts.length === 0) {
    container.innerHTML = `
      <div class="p-12 bg-surface-container-lowest rounded-2xl text-center space-y-3 shadow-sm">
        <span class="material-symbols-outlined text-5xl text-outline mb-1">post_add</span>
        <h3 class="font-title-lg text-on-surface">Bạn chưa đăng bài thảo luận nào</h3>
        <p class="font-body-sm text-outline max-w-sm mx-auto">Hãy bắt đầu chia sẻ câu hỏi hoặc kiến thức học thuật với cộng đồng EduHub ngay hôm nay!</p>
        <a href="create-post.html" class="inline-block px-5 py-2.5 bg-primary-container text-on-primary rounded-lg font-label-lg shadow-sm mt-2">Tạo bài thảo luận mới</a>
      </div>
    `;
    return;
  }

  container.innerHTML = myPosts.map(post => `
    <div class="p-6 bg-surface-container-lowest rounded-2xl shadow-sm space-y-3 hover:shadow-md transition-shadow" data-post-id="${post.id}">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm font-semibold">🌐 ${Utils.escapeHTML(post.visibility)}</span>
          <span class="font-body-sm text-outline">${Utils.timeAgo(post.createdAt)}</span>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-change-vis px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-body-sm font-label-md cursor-pointer" data-id="${post.id}" type="button">Đổi phạm vi</button>
          <button class="btn-delete-mypost px-3 py-1 bg-error-container text-on-error-container hover:bg-error hover:text-on-error rounded-lg text-body-sm font-label-md cursor-pointer transition-colors" data-id="${post.id}" type="button">Xóa bài</button>
        </div>
      </div>
      <a href="post-detail.html?id=${post.id}">
        <h3 class="font-title-lg text-on-surface hover:text-primary transition-colors">${Utils.escapeHTML(post.title)}</h3>
      </a>
      <p class="font-body-md text-on-surface-variant line-clamp-2">${Utils.escapeHTML(post.content)}</p>
      <div class="flex items-center gap-6 pt-3 border-t border-surface-container-low font-body-sm text-outline">
        <span>👍 ${post.likes ? post.likes.length : 0} Upvotes</span>
        <span>💬 ${post.commentsCount || 0} Bình luận</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-change-vis').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.id;
      const currentPost = myPosts.find(p => p.id === postId);
      const newVis = currentPost?.visibility === 'Public' ? 'Friends' : (currentPost?.visibility === 'Friends' ? 'Only Me' : 'Public');
      Posts.updateVisibility(postId, newVis);
      initMyPostsPage();
    });
  });

  container.querySelectorAll('.btn-delete-mypost').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
        Posts.deletePost(btn.dataset.id);
        initMyPostsPage();
      }
    });
  });
}

// ==========================================
// 5. HỒ SƠ CÁ NHÂN (profile.html)
// ==========================================
function initProfilePage() {
  // Sync profile page UI
}

// ==========================================
// 6. KIỂM DUYỆT (moderation.html)
// ==========================================
function initModerationPage() {
  if (!Auth.isModerator()) {
    Utils.showToast('Truy cập bị từ chối! Trang Kiểm duyệt chỉ dành cho Admin / Moderator.', 'error');
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.innerHTML = `
        <div class="max-w-2xl mx-auto my-16 p-8 bg-surface-container-lowest rounded-3xl shadow-xl text-center space-y-6 border border-error/20">
          <div class="w-20 h-20 mx-auto rounded-full bg-error-container/40 flex items-center justify-center text-error">
            <span class="material-symbols-outlined text-5xl">gavel</span>
          </div>
          <div class="space-y-2">
            <span class="px-3 py-1 rounded-full bg-error/10 text-error font-label-sm uppercase font-bold tracking-wider">403 Access Denied</span>
            <h1 class="font-headline-md text-2xl text-on-surface font-bold">Khu Vực Hạn Chế Quyền Admin / Moderator</h1>
            <p class="font-body-md text-on-surface-variant max-w-lg mx-auto text-sm leading-relaxed">
              Trang Trung tâm Kiểm duyệt và Hàng chờ duyệt yêu cầu tài khoản người dùng có quyền <strong>Moderator / Admin</strong>.
              Tài khoản hiện tại của bạn là Sinh viên. Vui lòng đăng nhập bằng tài khoản Quản trị để tiếp tục.
            </p>
          </div>
          <div class="flex items-center justify-center gap-4 pt-4 border-t border-surface-container-low">
            <a href="login.html" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">key</span>
              <span>Đăng nhập tài khoản Moderator</span>
            </a>
            <a href="index.html" class="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-lg hover:bg-surface-container transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">home</span>
              <span>Về Trang chủ</span>
            </a>
          </div>
        </div>
      `;
    }
    return;
  }

  const rawPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase().replace('.html', '');

  if (rawPath === 'moderation-queue') {
    Moderation.renderQueuePage();
  } else {
    Moderation.renderDashboard();
  }
}

// ==========================================
// 7. GLOBAL EVENT DELEGATION
// ==========================================
function bindGlobalEvents() {
  document.addEventListener('click', async (e) => {
    // 0. Nút Đổi Theme Sáng / Tối
    const themeBtn = e.target.closest('#btnThemeToggle, .btn-theme-toggle');
    if (themeBtn) {
      e.preventDefault();
      toggleTheme();
      return;
    }

    // 1. Nút Thông báo (Bell Button)
    const btnNotification = e.target.closest('.btn-notifications');
    const buttonWithIcon = e.target.closest('button');
    const isBellButton = buttonWithIcon && buttonWithIcon.querySelector('.material-symbols-outlined')?.textContent.trim() === 'notifications';
    const linkWithIcon = e.target.closest('a');
    const isBellLink = linkWithIcon && linkWithIcon.querySelector('.material-symbols-outlined')?.textContent.trim() === 'notifications';

    const targetBell = btnNotification || (isBellButton ? buttonWithIcon : null) || (isBellLink ? linkWithIcon : null);
    
    if (targetBell) {
      e.preventDefault();
      e.stopPropagation();
      if (window.Notifications) {
        Notifications.togglePopover(targetBell);
      }
      return;
    }

    // 2. Thả tim Like button
    const likeBtn = e.target.closest('.btn-like');
    if (likeBtn) {
      const article = likeBtn.closest('article');
      if (article && article.dataset.postId) {
        const count = Posts.toggleLike(article.dataset.postId);
        const span = likeBtn.querySelector('span:last-child');
        const icon = likeBtn.querySelector('.material-symbols-outlined');

        if (span && count !== false) {
          span.textContent = `${count} Upvote`;
          const isLiked = likeBtn.classList.contains('text-primary');
          if (isLiked) {
            likeBtn.classList.remove('text-primary', 'font-bold');
            likeBtn.classList.add('text-on-surface-variant');
            if (icon) icon.textContent = 'thumb_up_off_alt';
          } else {
            likeBtn.classList.add('text-primary', 'font-bold');
            likeBtn.classList.remove('text-on-surface-variant');
            if (icon) icon.textContent = 'thumb_up';
          }
        }
      }
      return;
    }

    // 3. Nút Lưu bài viết (Bookmark)
    const bookmarkBtn = e.target.closest('.btn-bookmark-post');
    if (bookmarkBtn) {
      const article = bookmarkBtn.closest('article');
      if (article && article.dataset.postId) {
        const isSaved = Posts.toggleSavePost(article.dataset.postId);
        const icon = bookmarkBtn.querySelector('.material-symbols-outlined');
        if (isSaved) {
          bookmarkBtn.classList.add('text-primary');
          bookmarkBtn.classList.remove('text-on-surface-variant');
          if (icon) icon.textContent = 'bookmark';
        } else {
          bookmarkBtn.classList.remove('text-primary');
          bookmarkBtn.classList.add('text-on-surface-variant');
          if (icon) icon.textContent = 'bookmark_border';
        }
      }
      return;
    }

    // 4. Nút Chia sẻ bài viết (Share)
    const shareBtn = e.target.closest('.btn-share-post');
    if (shareBtn) {
      const article = shareBtn.closest('article');
      if (article && article.dataset.postId) {
        const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}post-detail.html?id=${article.dataset.postId}`;
        navigator.clipboard.writeText(url).then(() => {
          Utils.showToast('Đã sao chép liên kết bài viết!', 'success');
        }).catch(() => {
          Utils.showToast(`Liên kết: ${url}`, 'info');
        });
      }
      return;
    }

    // 5. Nút Tùy chọn bài viết (Post options more_horiz)
    const optionsBtn = e.target.closest('.btn-post-options');
    if (optionsBtn) {
      const article = optionsBtn.closest('article');
      if (article && article.dataset.postId) {
        const postId = article.dataset.postId;
        const currentUser = Auth.getCurrentUser();
        const post = StorageManager.get('posts', []).find(p => p.id === postId);
        
        const isOwnerOrAdmin = currentUser && post && (post.userId === currentUser.id || Auth.isModerator());
        
        let action = prompt(
          `Tùy chọn bài viết:\n1. Sao chép liên kết\n2. ${Posts.isPostSaved(postId) ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}` +
          (isOwnerOrAdmin ? '\n3. Xóa bài viết' : '')
        );

        if (action === '1') {
          const url = `${window.location.origin}${window.location.pathname.replace('index.html', '')}post-detail.html?id=${postId}`;
          navigator.clipboard.writeText(url);
          Utils.showToast('Đã sao chép liên kết!', 'success');
        } else if (action === '2') {
          Posts.toggleSavePost(postId);
          renderFeed(currentFeedTab, currentFeedSort);
        } else if (action === '3' && isOwnerOrAdmin) {
          if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            Posts.deletePost(postId);
            renderFeed(currentFeedTab, currentFeedSort);
          }
        }
      }
      return;
    }

    // 6. Báo cáo vi phạm (Mở Modal Báo Cáo Vi Phạm Chuẩn UI)
    const reportBtn = e.target.closest('.btn-report-post');
    if (reportBtn) {
      const article = reportBtn.closest('article');
      if (article && article.dataset.postId) {
        const post = StorageManager.get('posts', []).find(p => p.id === article.dataset.postId);
        const quoteContent = post ? (post.content || post.title) : article.textContent;
        Moderation.openReportModal('post', article.dataset.postId, quoteContent);
      }
      return;
    }

    // 7. Nút đăng xuất
    const logoutBtn = e.target.closest('a[href*="logout"], a[data-path="dang-xuat"]');
    if (logoutBtn) {
      e.preventDefault();
      Auth.logout();
      return;
    }

    // 8. Nút Gửi bình luận (Global Fail-safe)
    const submitCommentBtn = e.target.closest('#btnSubmitComment, .btn-submit-comment');
    if (submitCommentBtn) {
      e.preventDefault();
      const textarea = document.getElementById('postCommentContent') || submitCommentBtn.closest('div')?.querySelector('textarea');
      if (textarea) {
        const content = textarea.value.trim();
        if (!content) {
          Utils.showToast('Vui lòng nhập nội dung bình luận!', 'warning');
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id') || 'post_501';

        const newComment = await Posts.addComment(postId, content);
        if (newComment) {
          textarea.value = '';
          if (typeof renderPostComments === 'function') {
            renderPostComments(postId);
          }
          const updatedPosts = StorageManager.get('posts', []);
          const updatedPost = updatedPosts.find(p => p.id === postId);
          const commentsCountEl = document.getElementById('postDetailCommentsCount');
          if (commentsCountEl && updatedPost) {
            commentsCountEl.textContent = `💬 ${updatedPost.commentsCount || 0} Bình luận`;
          }
        }
      }
      return;
    }
    // 9. Nút Chấp nhận / Từ chối kết bạn (Global Delegation)
    const acceptBtn = e.target.closest('.btn-accept-request');
    if (acceptBtn) {
      e.preventDefault();
      const requestId = acceptBtn.dataset.id || 'fr_102';
      Friends.acceptRequest(requestId);
      const card = acceptBtn.closest('[data-request-id]');
      if (card) card.remove();
      if (typeof renderPendingFriendRequests === 'function') renderPendingFriendRequests();
      if (typeof renderFriendList === 'function') renderFriendList();
      return;
    }

    const rejectBtn = e.target.closest('.btn-reject-request');
    if (rejectBtn) {
      e.preventDefault();
      const requestId = rejectBtn.dataset.id || 'fr_102';
      Friends.rejectRequest(requestId);
      const card = rejectBtn.closest('[data-request-id]');
      if (card) card.remove();
      if (typeof renderPendingFriendRequests === 'function') renderPendingFriendRequests();
      return;
    }
  });

  // Lắng nghe sự kiện submit Form toàn ứng dụng phòng ngừa reload / 404
  document.addEventListener('submit', (e) => {
    const action = e.target.getAttribute('action');
    if (!action || action === '#' || action === '') {
      e.preventDefault();
    }
  });
}
