/**
 * EduHub Platform - Notifications Controller (assets/js/notifications.js)
 * Quản lý UI Popover Thông báo, đếm số thông báo chưa đọc & đánh dấu đã đọc.
 */

window.Notifications = {
  KEY: 'notifications',

  // Khởi tạo Dữ liệu Thông báo Mẫu nếu chưa có
  initNotificationsSeed() {
    if (!localStorage.getItem(StorageManager.PREFIX + this.KEY)) {
      const currentUser = Auth.getCurrentUser();
      const seedNotifications = [
        {
          id: 'notif_001',
          userId: currentUser ? currentUser.id : 'usr_001',
          type: 'comment',
          title: 'Bình luận mới trong bài viết',
          message: 'Lê Quốc An (Moderator) đã trả lời bình luận của bạn trong bài "Lỗi Concurrent State Mutation..."',
          link: 'post-detail.html?id=post_001',
          isRead: false,
          icon: 'chat_bubble',
          iconBg: 'bg-primary-container text-on-primary',
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: 'notif_002',
          userId: currentUser ? currentUser.id : 'usr_001',
          type: 'like',
          title: 'Lượt Upvote bài viết',
          message: 'Lê Thu Trang và 12 người khác đã thả tim bài viết của bạn.',
          link: 'index.html',
          isRead: false,
          icon: 'thumb_up',
          iconBg: 'bg-secondary-container text-on-secondary-container',
          createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
        },
        {
          id: 'notif_003',
          userId: currentUser ? currentUser.id : 'usr_001',
          type: 'document',
          title: 'Tài liệu cập nhật mới',
          message: 'Tài liệu "Tuyển tập 50 Đề thi CTDL" bạn đang lưu vừa có bản cập nhật mới.',
          link: 'document-detail.html',
          isRead: false,
          icon: 'auto_stories',
          iconBg: 'bg-tertiary-container text-on-tertiary',
          createdAt: new Date(Date.now() - 1000 * 3600 * 1).toISOString()
        },
        {
          id: 'notif_004',
          userId: currentUser ? currentUser.id : 'usr_001',
          type: 'moderation',
          title: 'Bài viết đã được phê duyệt',
          message: 'Bài thảo luận của bạn đã được Ban Kiểm duyệt phê duyệt hiển thị công khai.',
          link: 'index.html',
          isRead: true,
          icon: 'verified_user',
          iconBg: 'bg-emerald-500 text-white',
          createdAt: new Date(Date.now() - 1000 * 3600 * 3).toISOString()
        },
        {
          id: 'notif_005',
          userId: currentUser ? currentUser.id : 'usr_001',
          type: 'friend',
          title: 'Lời mời kết bạn',
          message: 'Hoàng Đức Nam đã gửi cho bạn một lời mời kết bạn.',
          link: 'friends.html',
          isRead: true,
          icon: 'person_add',
          iconBg: 'bg-indigo-500 text-white',
          createdAt: new Date(Date.now() - 1000 * 3600 * 5).toISOString()
        }
      ];
      StorageManager.set(this.KEY, seedNotifications);
    }
  },

  // Thêm thông báo mới cho người dùng
  addNotification(userId, data) {
    this.initNotificationsSeed();
    const allNotifs = StorageManager.get(this.KEY, []);
    const newNotif = {
      id: Utils.generateId('notif'),
      userId: userId || 'usr_001',
      type: data.type || 'moderation',
      title: Utils.escapeHTML(data.title || 'Thông báo từ Ban Kiểm duyệt'),
      message: Utils.escapeHTML(data.message || ''),
      link: data.link || 'index.html',
      isRead: false,
      icon: data.icon || 'gavel',
      iconBg: data.iconBg || 'bg-error text-on-error',
      createdAt: new Date().toISOString()
    };
    allNotifs.unshift(newNotif);
    StorageManager.set(this.KEY, allNotifs);
    this.updateBadgeUI();
    return newNotif;
  },

  // Lấy danh sách thông báo của người dùng hiện tại
  getNotifications() {
    this.initNotificationsSeed();
    const currentUser = Auth.getCurrentUser();
    let allNotifs = StorageManager.get(this.KEY, []);

    // Tự động sửa các link cũ nếu có trong LocalStorage
    let updated = false;
    allNotifs = allNotifs.map(n => {
      if (n.link === 'post-detail.html') {
        n.link = 'post-detail.html?id=post_001';
        updated = true;
      }
      return n;
    });
    if (updated) {
      StorageManager.set(this.KEY, allNotifs);
    }

    if (!currentUser) return allNotifs;
    return allNotifs.filter(n => n.userId === currentUser.id || !n.userId);
  },

  // Đếm số thông báo chưa đọc
  getUnreadCount() {
    const notifs = this.getNotifications();
    return notifs.filter(n => !n.isRead).length;
  },

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead(notifId) {
    const allNotifs = StorageManager.get(this.KEY, []);
    const notif = allNotifs.find(n => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      StorageManager.set(this.KEY, allNotifs);
      this.updateBadgeUI();
    }
  },

  // Đánh dấu tất cả là đã đọc
  markAllAsRead() {
    const allNotifs = StorageManager.get(this.KEY, []);
    const currentUser = Auth.getCurrentUser();
    allNotifs.forEach(n => {
      if (!currentUser || n.userId === currentUser.id) {
        n.isRead = true;
      }
    });
    StorageManager.set(this.KEY, allNotifs);
    this.updateBadgeUI();
    Utils.showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'info');
  },

  // Cập nhật chấm đỏ Badge hiển thị số lượng chưa đọc trên Bell button
  updateBadgeUI() {
    const count = this.getUnreadCount();
    document.querySelectorAll('.notification-badge').forEach(badge => {
      if (count > 0) {
        badge.classList.remove('hidden');
        badge.textContent = count > 9 ? '9+' : count;
      } else {
        badge.classList.add('hidden');
      }
    });
  },

  // Tạo và hiển thị UI Dropdown Popover khi nhấp vào nút Chuông
  togglePopover(bellButton) {
    let popover = document.getElementById('notification-popover');
    
    if (popover && !popover.classList.contains('hidden')) {
      popover.classList.add('hidden');
      return;
    }

    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'notification-popover';
      popover.className = 'fixed top-16 right-4 sm:right-8 z-50 w-80 sm:w-96 bg-surface-container-lowest/95 backdrop-blur-xl border border-surface-container-high/60 shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2';
      document.body.appendChild(popover);
    }

    // Render nội dung Popover
    this.renderPopoverContent(popover);
    popover.classList.remove('hidden');

    // Lắng nghe nhấp ra ngoài để tự đóng Popover
    const closeHandler = (e) => {
      if (!popover.contains(e.target) && !bellButton.contains(e.target)) {
        popover.classList.add('hidden');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  },

  // Vẽ giao diện Popover Thông báo
  renderPopoverContent(popover) {
    const notifs = this.getNotifications();
    const unreadCount = this.getUnreadCount();

    let itemsHTML = '';
    if (notifs.length === 0) {
      itemsHTML = `
        <div class="p-8 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">notifications_off</span>
          <p class="font-body-sm">Bạn chưa có thông báo nào.</p>
        </div>
      `;
    } else {
      itemsHTML = notifs.map(n => `
        <div class="notif-item p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer border-b border-surface-container-low/60 flex items-start gap-3 relative ${n.isRead ? 'opacity-75' : 'bg-primary/5 font-medium'}" data-id="${n.id}" data-link="${n.link}">
          <div class="w-9 h-9 rounded-xl ${n.iconBg || 'bg-primary-container text-on-primary'} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <span class="material-symbols-outlined text-[18px]">${n.icon || 'notifications'}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="font-title-md text-xs text-on-surface font-semibold truncate">${Utils.escapeHTML(n.title)}</span>
              <span class="font-label-sm text-[10px] text-outline flex-shrink-0">${Utils.timeAgo(n.createdAt)}</span>
            </div>
            <p class="font-body-sm text-xs text-on-surface-variant line-clamp-2 leading-snug">${Utils.escapeHTML(n.message)}</p>
          </div>
          ${!n.isRead ? '<span class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></span>' : ''}
        </div>
      `).join('');
    }

    popover.innerHTML = `
      <div class="p-4 bg-surface-container-low/80 flex items-center justify-between border-b border-surface-container-high">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
          <h3 class="font-title-lg text-body-md font-bold text-on-surface">Thông báo mới</h3>
          ${unreadCount > 0 ? `<span class="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">${unreadCount}</span>` : ''}
        </div>
        ${unreadCount > 0 ? `
          <button id="btn-mark-all-read" class="text-primary hover:underline font-label-sm text-xs font-semibold">
            Đánh dấu đã đọc
          </button>
        ` : ''}
      </div>

      <div class="max-h-[360px] overflow-y-auto divide-y-0">
        ${itemsHTML}
      </div>

      <div class="p-2.5 bg-surface-container-low/50 text-center border-t border-surface-container-high">
        <a href="index.html" class="font-label-sm text-xs text-primary hover:underline font-semibold flex items-center justify-center gap-1">
          <span>Xem tất cả bài thảo luận</span>
          <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
        </a>
      </div>
    `;

    // Gán sự kiện cho nút "Đánh dấu tất cả đã đọc"
    const markAllBtn = popover.querySelector('#btn-mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.markAllAsRead();
        this.renderPopoverContent(popover);
      });
    }

    // Gán sự kiện nhấp vào từng item thông báo
    popover.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const link = item.dataset.link;
        this.markAsRead(id);
        popover.classList.add('hidden');
        if (link) window.location.href = link;
      });
    });
  }
};
