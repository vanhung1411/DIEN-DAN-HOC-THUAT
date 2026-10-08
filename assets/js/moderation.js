/**
 * EduHub Platform - Moderation Controller (assets/js/moderation.js)
 * Dashboard Kiểm duyệt dành cho Moderator, Xử lý Hàng chờ, Báo cáo vi phạm & Thống kê hệ thống.
 */

window.Moderation = {
  // Gửi báo cáo nội dung vi phạm từ sinh viên
  reportContent(targetType, targetId, reason, details = '') {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để gửi báo cáo vi phạm!', 'warning');
      return false;
    }

    const reports = StorageManager.get('reports', []);
    const reportCode = `#REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReport = {
      id: Utils.generateId('rep'),
      code: reportCode,
      reporterId: currentUser.id,
      reporterName: currentUser.fullName,
      targetType: targetType, // 'post' hoặc 'document'
      targetId: targetId,
      reason: Utils.escapeHTML(reason || 'Spam quảng cáo / Khóa học / Link mã độc'),
      details: Utils.escapeHTML(details),
      status: 'pending',
      priority: 'high',
      createdAt: new Date().toISOString()
    };

    reports.unshift(newReport);
    StorageManager.set('reports', reports);
    return newReport;
  },

  // Hiển thị Modal Báo cáo Vi phạm chuẩn thiết kế EduHub UI trong hình thiết kế
  openReportModal(targetType, targetId, rawQuote = '') {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để gửi báo cáo vi phạm!', 'warning');
      return;
    }

    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('reportModal');
    if (existingModal) existingModal.remove();

    const snippet = rawQuote ? Utils.escapeHTML(rawQuote.substring(0, 160)) : '...Trích dẫn nội dung bài thảo luận hoặc tài liệu được chọn báo cáo...';

    const modal = document.createElement('div');
    modal.id = 'reportModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-4 animate-in fade-in duration-200';

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-surface-container-high/60 relative overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-surface-container-low pb-3">
          <div class="flex items-center gap-2 text-on-surface">
            <span class="material-symbols-outlined text-primary text-[22px]">flag</span>
            <h3 class="font-title-lg text-title-lg font-bold">Báo cáo vi phạm</h3>
          </div>
          <button id="btnCloseReportModal" class="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors" type="button">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Trích dẫn Snippet -->
        <div class="p-3 rounded-xl bg-surface-container-low/70 border-l-4 border-primary text-xs text-on-surface-variant font-body-sm leading-relaxed space-y-1">
          <span class="font-semibold text-primary block font-label-sm">Trích dẫn:</span>
          <p class="italic text-on-surface line-clamp-2">"${snippet}"</p>
        </div>

        <!-- Tiêu đề bộ chọn lý do -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="font-title-md text-sm text-on-surface font-bold">
              Lý do báo cáo vi phạm <span class="text-error">*</span>
            </label>
            <span class="font-label-sm text-[11px] text-outline">Chọn 1 danh mục chính</span>
          </div>

          <!-- Danh sách lý do (Radio Cards) -->
          <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1" id="reportReasonContainer">
            <!-- Option 1: Copyright -->
            <label class="report-option-card flex items-start gap-3 p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container border border-transparent hover:border-primary/20 cursor-pointer transition-all">
              <input type="radio" name="reportReason" value="Nội dung đạo văn / Vi phạm bản quyền" class="mt-1 accent-primary w-4 h-4"/>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-title-md text-xs font-bold text-on-surface">Nội dung đạo văn / Vi phạm bản quyền</span>
                  <span class="material-symbols-outlined text-outline text-[18px]">copyright</span>
                </div>
                <p class="font-body-sm text-[11px] text-outline leading-snug pt-0.5">Trích dẫn đề thi, tài liệu có bản quyền thương mại hoặc sao chép bài người khác mà không trích dẫn nguồn học thuật.</p>
              </div>
            </label>

            <!-- Option 2: Misinformation -->
            <label class="report-option-card flex items-start gap-3 p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container border border-transparent hover:border-primary/20 cursor-pointer transition-all">
              <input type="radio" name="reportReason" value="Thông tin sai lệch / Kiến thức học thuật sai" class="mt-1 accent-primary w-4 h-4"/>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-title-md text-xs font-bold text-on-surface">Thông tin sai lệch / Kiến thức học thuật sai</span>
                  <span class="material-symbols-outlined text-outline text-[18px]">error_outline</span>
                </div>
                <p class="font-body-sm text-[11px] text-outline leading-snug pt-0.5">Hướng dẫn phương pháp giải sai lệch nghiêm trọng hoặc tài liệu giả mạo học thuyết khoa học chuẩn tắc.</p>
              </div>
            </label>

            <!-- Option 3: Spam -->
            <label class="report-option-card flex items-start gap-3 p-3 rounded-xl bg-surface-container border border-primary/40 cursor-pointer transition-all">
              <input type="radio" name="reportReason" value="Spam quảng cáo / Khóa học / Link mã độc" checked class="mt-1 accent-primary w-4 h-4"/>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-title-md text-xs font-bold text-on-surface">Spam quảng cáo / Khóa học / Link mã độc</span>
                  <span class="material-symbols-outlined text-primary text-[18px]">bug_report</span>
                </div>
                <p class="font-body-sm text-[11px] text-outline leading-snug pt-0.5">Chèn link rút gọn chứa tệp .exe/.bat độc hại, chào mời dịch vụ làm bài tập thuê hoặc bán khóa học ngoài luồng.</p>
              </div>
            </label>

            <!-- Option 4: Abuse -->
            <label class="report-option-card flex items-start gap-3 p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container border border-transparent hover:border-primary/20 cursor-pointer transition-all">
              <input type="radio" name="reportReason" value="Ngôn từ xúc phạm / Công kích cá nhân" class="mt-1 accent-primary w-4 h-4"/>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-title-md text-xs font-bold text-on-surface">Ngôn từ xúc phạm / Công kích cá nhân</span>
                  <span class="material-symbols-outlined text-outline text-[18px]">forum</span>
                </div>
                <p class="font-body-sm text-[11px] text-outline leading-snug pt-0.5">Phá vỡ văn hóa phản biện văn minh, dùng từ ngữ miệt thị, thóa mạ bạn bè hoặc giảng viên.</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Ô nhập chi tiết -->
        <div class="pt-1">
          <textarea id="reportDetailsInput" class="w-full p-3 rounded-xl bg-surface-container-low text-xs text-on-surface placeholder:text-outline border border-transparent focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition-all resize-none" rows="2" placeholder="Chi tiết bổ sung khác (không bắt buộc)..."></textarea>
        </div>

        <!-- Footer Buttons -->
        <div class="flex items-center justify-end gap-3 pt-2 border-t border-surface-container-low">
          <button id="btnCancelReportModal" class="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high font-label-md text-xs font-semibold transition-colors" type="button">
            Hủy bỏ
          </button>
          <button id="btnSubmitReportModal" class="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-xs font-semibold shadow-md transition-all flex items-center gap-1.5" type="button">
            <span class="material-symbols-outlined text-[18px]">send</span>
            <span>Gửi báo cáo</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Xử lý radio card highlights
    const radioInputs = modal.querySelectorAll('input[name="reportReason"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', () => {
        modal.querySelectorAll('.report-option-card').forEach(card => {
          card.classList.remove('border-primary/40', 'bg-surface-container');
          card.classList.add('border-transparent', 'bg-surface-container-low/60');
        });
        const activeCard = radio.closest('.report-option-card');
        if (activeCard) {
          activeCard.classList.add('border-primary/40', 'bg-surface-container');
          activeCard.classList.remove('border-transparent', 'bg-surface-container-low/60');
        }
      });
    });

    // Đóng Modal
    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseReportModal')?.addEventListener('click', closeModal);
    modal.querySelector('#btnCancelReportModal')?.addEventListener('click', closeModal);

    // Gửi báo cáo
    modal.querySelector('#btnSubmitReportModal')?.addEventListener('click', () => {
      const selectedRadio = modal.querySelector('input[name="reportReason"]:checked');
      const reason = selectedRadio ? selectedRadio.value : 'Spam quảng cáo / Khóa học / Link mã độc';
      const details = modal.querySelector('#reportDetailsInput')?.value.trim() || '';

      const report = this.reportContent(targetType, targetId, reason, details);
      closeModal();

      if (report) {
        this.showSystemReceivedToast(report.code);
      }
    });
  },

  // Hiển thị Toast Thẻ Thông Báo "Hệ thống đã tiếp nhận" chuẩn UI trong hình
  showSystemReceivedToast(reportCode = '#REP-2024-8841') {
    const existingToast = document.getElementById('systemReportToast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'systemReportToast';
    toast.className = 'fixed top-20 right-6 z-50 max-w-sm w-full bg-surface-container-lowest/95 backdrop-blur-xl border border-secondary/30 shadow-2xl rounded-2xl p-4 transition-all duration-300 transform translate-y-2 opacity-0 flex items-start gap-3';

    toast.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-secondary-container/80 text-on-secondary-container flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <span class="material-symbols-outlined text-[22px] text-secondary">check_circle</span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-1 mb-1">
          <h4 class="font-title-md text-xs text-on-surface font-bold">Hệ thống đã tiếp nhận</h4>
          <span class="font-label-sm text-[10px] text-outline">Vừa xong</span>
        </div>
        <p class="font-body-sm text-[11px] text-on-surface-variant leading-snug">
          Báo cáo <strong class="text-primary font-mono">${reportCode}</strong> đã được chuyển đến <strong>Đội ngũ Kiểm duyệt Khoa CNTT</strong>. Cảm ơn đóng góp của bạn!
        </p>
      </div>
      <button id="btnCloseSystemToast" class="text-outline hover:text-on-surface p-0.5 rounded-lg hover:bg-surface-container transition-colors" type="button">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    toast.querySelector('#btnCloseSystemToast')?.addEventListener('click', () => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }
    }, 6000);
  },

  // Lấy danh sách hàng chờ kiểm duyệt bài viết/tài liệu
  getPendingQueue() {
    const posts = StorageManager.get('posts', []);
    const docs = StorageManager.get('documents', []);

    const pendingPosts = posts.filter(p => p.status === 'pending').map(p => ({ ...p, type: 'post' }));
    const pendingDocs = docs.filter(d => d.status === 'pending').map(d => ({ ...d, type: 'document' }));

    return [...pendingPosts, ...pendingDocs];
  },

  // Duyệt chấp nhận nội dung
  approveItem(itemId, itemType = 'post') {
    if (!Auth.isModerator()) {
      Utils.showToast('Chỉ Moderator mới có quyền thực hiện thao tác này!', 'error');
      return false;
    }

    const key = itemType === 'post' ? 'posts' : 'documents';
    const items = StorageManager.get(key, []);
    const item = items.find(i => i.id === itemId);
    if (item) {
      item.status = 'approved';
      StorageManager.set(key, items);
      Utils.showToast('Đã duyệt và cho phép xuất hiện công khai!', 'success');
    }
  },

  // Từ chối / Loại bỏ nội dung
  rejectItem(itemId, itemType = 'post', reason = 'Vi phạm tiêu chuẩn cộng đồng') {
    if (!Auth.isModerator()) {
      Utils.showToast('Chỉ Moderator mới có quyền từ chối bài!', 'error');
      return false;
    }

    const key = itemType === 'post' ? 'posts' : 'documents';
    let items = StorageManager.get(key, []);
    items = items.filter(i => i.id !== itemId);
    StorageManager.set(key, items);
    Utils.showToast(`Đã gỡ bỏ nội dung. Lý do: ${reason}`, 'info');
  },

  // Phê duyệt tất cả mục trong hàng chờ
  approveAllQueue() {
    if (!Auth.isModerator()) {
      Utils.showToast('Chỉ Moderator mới có quyền phê duyệt!', 'error');
      return false;
    }

    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      Utils.showToast('Hàng chờ kiểm duyệt đang trống!', 'info');
      return false;
    }

    const posts = StorageManager.get('posts', []);
    const docs = StorageManager.get('documents', []);

    posts.forEach(p => { if (p.status === 'pending') p.status = 'approved'; });
    docs.forEach(d => { if (d.status === 'pending') d.status = 'approved'; });

    StorageManager.set('posts', posts);
    StorageManager.set('documents', docs);

    Utils.showToast(`Đã duyệt tất cả ${queue.length} nội dung trong hàng chờ thành công!`, 'success');
    return true;
  },

  // Render Dashboard Kiểm duyệt (moderation.html)
  renderDashboard() {
    const stats = this.getStats();
    
    // Hydrate KPI numbers
    const pendingEl = document.getElementById('modStatPending');
    if (pendingEl) pendingEl.textContent = stats.pendingCount;

    const reportsEl = document.getElementById('modStatReports');
    if (reportsEl) reportsEl.textContent = stats.reportsCount;

    const resolvedEl = document.getElementById('modStatResolved');
    if (resolvedEl) resolvedEl.textContent = stats.resolvedToday;

    const usersEl = document.getElementById('modStatUsers');
    if (usersEl) usersEl.textContent = stats.totalUsers.toLocaleString();

    // Hydrate Table
    const tbody = document.getElementById('modTableBody');
    if (!tbody) return;

    const queue = this.getPendingQueue();
    const reports = StorageManager.get('reports', []);

    if (queue.length === 0 && reports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="py-12 text-center text-on-surface-variant space-y-2">
            <span class="material-symbols-outlined text-4xl text-outline mb-1">verified</span>
            <h4 class="font-title-md text-on-surface">Không có nội dung nào chờ xử lý</h4>
            <p class="font-body-sm text-outline text-xs">Hệ thống đang ở trạng thái an toàn 100%.</p>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';

    // Render pending queue items
    queue.forEach(item => {
      const isPost = item.type === 'post';
      html += `
        <tr data-item-id="${item.id}" data-item-type="${item.type}">
          <td class="py-4 px-space-md">
            <div class="font-title-md font-bold text-on-surface">${Utils.escapeHTML(item.title)}</div>
            <div class="font-body-sm text-on-surface-variant line-clamp-1">${Utils.escapeHTML(item.content || item.description || '')}</div>
          </td>
          <td class="py-4 px-space-md">
            <div class="font-title-md text-body-md font-semibold">${Utils.escapeHTML(item.authorName || 'Sinh viên')}</div>
            <div class="font-body-sm text-outline text-xs">${isPost ? 'Bài thảo luận' : 'Tài liệu học tập'}</div>
          </td>
          <td class="py-4 px-space-md">
            <span class="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold font-label-sm text-xs">⏳ Hàng chờ duyệt</span>
          </td>
          <td class="py-4 px-space-md text-right space-x-1.5">
            <button type="button" class="btn-mod-reject px-3 py-1.5 rounded-lg bg-error-container text-on-error-container font-label-md hover:bg-error hover:text-on-error transition-colors cursor-pointer" data-id="${item.id}" data-type="${item.type}">Xóa &amp; Cảnh cáo</button>
            <button type="button" class="btn-mod-approve px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors cursor-pointer shadow-sm" data-id="${item.id}" data-type="${item.type}">Duyệt</button>
          </td>
        </tr>
      `;
    });

    // Render reported items
    reports.filter(r => r.status === 'pending').forEach(rep => {
      html += `
        <tr data-report-id="${rep.id}">
          <td class="py-4 px-space-md">
            <div class="font-title-md font-bold text-on-surface">Báo cáo: ${Utils.escapeHTML(rep.code)}</div>
            <div class="font-body-sm text-error font-medium">${Utils.escapeHTML(rep.reason)}</div>
          </td>
          <td class="py-4 px-space-md">
            <div class="font-title-md text-body-md font-semibold">${Utils.escapeHTML(rep.reporterName || 'Sinh viên')}</div>
            <div class="font-body-sm text-outline text-xs">Người gửi báo cáo</div>
          </td>
          <td class="py-4 px-space-md">
            <span class="px-2.5 py-1 rounded-full bg-error text-on-error font-bold font-label-sm text-xs">🚨 Cần xem xét</span>
          </td>
          <td class="py-4 px-space-md text-right space-x-1.5">
            <button type="button" class="btn-mod-reject-report px-3 py-1.5 rounded-lg bg-error text-on-error font-label-md cursor-pointer" data-id="${rep.id}">Xóa bài bị tố cáo</button>
            <button type="button" class="btn-mod-dismiss-report px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md cursor-pointer" data-id="${rep.id}">Bỏ qua báo cáo</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Bind event listeners for table buttons
    tbody.querySelectorAll('.btn-mod-approve').forEach(btn => {
      btn.addEventListener('click', () => {
        this.approveItem(btn.dataset.id, btn.dataset.type);
        this.renderDashboard();
        Auth.syncUI();
      });
    });

    tbody.querySelectorAll('.btn-mod-reject').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDisciplineModal(btn.dataset.id, btn.dataset.type);
      });
    });

    tbody.querySelectorAll('.btn-mod-reject-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const repId = btn.dataset.id;
        const reports = StorageManager.get('reports', []);
        const rep = reports.find(r => r.id === repId);
        if (rep) {
          this.openDisciplineModal(rep.targetId, rep.targetType);
          rep.status = 'resolved';
          StorageManager.set('reports', reports);
        }
      });
    });

    tbody.querySelectorAll('.btn-mod-dismiss-report').forEach(btn => {
      btn.addEventListener('click', () => {
        const repId = btn.dataset.id;
        const reports = StorageManager.get('reports', []);
        const rep = reports.find(r => r.id === repId);
        if (rep) {
          rep.status = 'dismissed';
          StorageManager.set('reports', reports);
          Utils.showToast('Đã bỏ qua báo cáo vi phạm!', 'info');
          this.renderDashboard();
        }
      });
    });
  },

  // Render Hàng chờ kiểm duyệt (moderation-queue.html)
  renderQueuePage() {
    const container = document.getElementById('moderationQueueContainer');
    if (!container) return;

    const queue = this.getPendingQueue();

    if (queue.length === 0) {
      container.innerHTML = `
        <div class="p-12 bg-surface-container-lowest rounded-2xl text-center space-y-3 shadow-sm border border-surface-container">
          <span class="material-symbols-outlined text-5xl text-primary mb-1">task_alt</span>
          <h3 class="font-title-lg text-on-surface font-bold">Hàng chờ kiểm duyệt đang trống!</h3>
          <p class="font-body-sm text-outline max-w-md mx-auto text-sm">Tất cả các bài thảo luận và tài liệu gửi lên đã được phê duyệt hoặc xử lý sạch sẽ.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = queue.map(item => {
      const isPost = item.type === 'post';
      const isHighPriority = item.priority === 'high';
      return `
        <div class="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border-l-4 ${isHighPriority ? 'border-error' : 'border-primary'} space-y-3" data-id="${item.id}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full ${isHighPriority ? 'bg-error-container text-on-error-container font-bold' : 'bg-primary-fixed text-on-primary-fixed font-bold'} font-label-sm text-xs">
                Mức ưu tiên: ${isHighPriority ? 'Cao' : 'Bình thường'}
              </span>
              <span class="font-body-sm text-outline text-xs">${isPost ? 'Bài thảo luận' : 'Tài liệu học tập'} • ${Utils.timeAgo(item.createdAt)}</span>
            </div>
            <span class="font-label-sm bg-surface-container px-3 py-1 rounded-full text-xs">Phạm vi: ${Utils.escapeHTML(item.visibility || 'Public')}</span>
          </div>

          <h3 class="font-title-lg text-on-surface font-bold">${Utils.escapeHTML(item.title)}</h3>
          <p class="font-body-md text-on-surface-variant text-sm leading-relaxed">${Utils.escapeHTML(item.content || item.description || '')}</p>

          <div class="flex items-center justify-between pt-3 border-t border-surface-container-low">
            <div class="flex items-center gap-2">
              <span class="font-body-sm text-outline text-xs">Tác giả: <strong class="text-on-surface">${Utils.escapeHTML(item.authorName || 'Sinh viên')}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="btn-queue-edit px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface font-label-md text-xs cursor-pointer" data-id="${item.id}">Yêu cầu sửa</button>
              <button type="button" class="btn-queue-reject px-4 py-2 bg-error text-on-error rounded-lg font-label-md text-xs cursor-pointer shadow-sm hover:opacity-90" data-id="${item.id}" data-type="${item.type}">Từ chối &amp; Kỷ luật</button>
              <button type="button" class="btn-queue-approve px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-xs cursor-pointer shadow-md hover:bg-primary-container transition-all" data-id="${item.id}" data-type="${item.type}">Phê duyệt (Approve)</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind event handlers for queue items
    container.querySelectorAll('.btn-queue-approve').forEach(btn => {
      btn.addEventListener('click', () => {
        this.approveItem(btn.dataset.id, btn.dataset.type);
        this.renderQueuePage();
        Auth.syncUI();
      });
    });

    container.querySelectorAll('.btn-queue-reject').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDisciplineModal(btn.dataset.id, btn.dataset.type);
      });
    });

    container.querySelectorAll('.btn-queue-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const note = prompt('Nhập hướng dẫn yêu cầu sinh viên chỉnh sửa:', 'Vui lòng bổ sung trích dẫn tài liệu tham khảo.');
        if (note) {
          Utils.showToast(`Đã gửi thông báo yêu cầu chỉnh sửa cho tác giả! (${note})`, 'info');
        }
      });
    });

    // Bind Approve All Queue button
    const btnApproveAll = document.getElementById('btnApproveAllQueue');
    if (btnApproveAll) {
      btnApproveAll.onclick = () => {
        if (confirm('Bạn có chắc chắn muốn phê duyệt toàn bộ danh sách trong hàng chờ?')) {
          this.approveAllQueue();
          this.renderQueuePage();
          Auth.syncUI();
        }
      };
    }
  },

  // Mở Modal Xử lý Kỷ luật & Gỡ bỏ Bài viết chuẩn UI thiết kế
  openDisciplineModal(itemId, itemType = 'post') {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || !Auth.isModerator()) {
      Utils.showToast('Vui lòng đăng nhập với tài khoản Moderator!', 'warning');
      return;
    }

    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('disciplineModal');
    if (existingModal) existingModal.remove();

    // Lấy thông tin bài viết / tài liệu từ storage
    const key = itemType === 'post' ? 'posts' : 'documents';
    const items = StorageManager.get(key, []);
    let item = items.find(i => i.id === itemId);

    if (!item) {
      // Dữ liệu mẫu fallback nếu bấm từ giao diện tĩnh
      item = {
        id: itemId || 'post_501',
        title: 'Lỗi Concurrent State Mutation trong React Redux Toolkit Query?',
        authorName: 'Nguyễn Minh An',
        userId: 'usr_001',
        authorUsername: 'minhan.nguyen',
        department: 'K21 CNTT',
        likes: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42],
        commentsCount: 14,
        reportCount: 3,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      };
    }

    const codeBadge = `#POST-${(item.id || '99214').toString().replace('post_', '').toUpperCase()}`;
    const authorInitials = item.authorName ? item.authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NA';

    const modal = document.createElement('div');
    modal.id = 'disciplineModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-on-background/50 backdrop-blur-sm p-4 animate-in fade-in duration-200';

    modal.innerHTML = `
      <div class="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-surface-container-high/60 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-error-container/60 text-error flex items-center justify-center flex-shrink-0 shadow-sm">
              <span class="material-symbols-outlined text-[26px]">gavel</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-headline-sm text-lg font-bold text-on-surface">Xử lý Kỷ luật &amp; Gỡ bỏ Bài viết</h2>
                <span class="px-2.5 py-0.5 rounded-full bg-error text-on-error font-mono text-[11px] font-bold">${codeBadge}</span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant">Quyết định kiểm duyệt học thuật có hiệu lực thi hành ngay lập tức trên hệ thống</p>
            </div>
          </div>
          <button id="btnCloseDisciplineModal" class="p-1 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors" type="button">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Target Snippet Card -->
        <div class="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              ${authorInitials}
            </div>
            <div class="min-w-0">
              <h4 class="font-title-md text-sm font-bold text-on-surface truncate">${Utils.escapeHTML(item.title)}</h4>
              <p class="font-body-sm text-[11px] text-outline truncate">
                <strong class="text-on-surface-variant">${Utils.escapeHTML(item.authorName || 'Sinh viên')}</strong> • @${item.authorUsername || 'minhan.nguyen'} (${item.department || 'CNTT'}) • ${Utils.timeAgo(item.createdAt)}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs flex-shrink-0">
            <span class="px-2 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm font-medium flex items-center gap-1">👍 ${item.likes ? item.likes.length : 42}</span>
            <span class="px-2 py-1 rounded-lg bg-surface-container text-on-surface-variant font-label-sm font-medium flex items-center gap-1">💬 ${item.commentsCount || 14}</span>
            <span class="px-2 py-1 rounded-lg bg-error-container/50 text-error font-label-sm font-bold flex items-center gap-1">🚩 ${item.reportCount || 3} flags</span>
          </div>
        </div>

        <!-- Step 1: Select Action -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-xs font-bold text-on-surface">
              <span class="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px]">1</span>
              <span>Chọn Hình thức Xử lý Bài viết</span>
            </span>
            <span class="text-[11px] text-error font-semibold">* Bất buộc</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Option 1: Delete -->
            <label class="discipline-card relative flex flex-col justify-between p-3.5 rounded-2xl bg-error-container/20 border-2 border-error cursor-pointer transition-all">
              <input type="radio" name="disciplineAction" value="delete" checked class="hidden"/>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-8 h-8 rounded-xl bg-error/15 text-error flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                  </div>
                  <span class="w-4 h-4 rounded-full border-2 border-error flex items-center justify-center">
                    <span class="w-2 h-2 rounded-full bg-error"></span>
                  </span>
                </div>
                <div>
                  <h4 class="font-title-md text-xs font-bold text-error">Gỡ bỏ &amp; Xóa vĩnh viễn</h4>
                  <p class="font-body-sm text-[11px] text-on-surface-variant leading-snug mt-1">Xóa hoàn toàn khỏi bản tin, lập biên bản vi phạm vào hồ sơ sinh viên.</p>
                </div>
              </div>
              <div class="mt-3">
                <span class="px-2 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">Nghiêm trọng</span>
              </div>
            </label>

            <!-- Option 2: Hide 48h -->
            <label class="discipline-card relative flex flex-col justify-between p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/70 cursor-pointer transition-all hover:border-amber-500/40">
              <input type="radio" name="disciplineAction" value="hide" class="hidden"/>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">visibility_off</span>
                  </div>
                  <span class="w-4 h-4 rounded-full border border-outline flex items-center justify-center"></span>
                </div>
                <div>
                  <h4 class="font-title-md text-xs font-bold text-on-surface">Tạm ẩn &amp; Sửa lỗi</h4>
                  <p class="font-body-sm text-[11px] text-outline leading-snug mt-1">Chỉ tác giả được thấy bài. Có 48 giờ sửa đổi và gửi đề nghị kiểm duyệt lại.</p>
                </div>
              </div>
              <div class="mt-3">
                <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-bold">Khắc phục 48h</span>
              </div>
            </label>

            <!-- Option 3: Warn -->
            <label class="discipline-card relative flex flex-col justify-between p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/70 cursor-pointer transition-all hover:border-primary/40">
              <input type="radio" name="disciplineAction" value="warn" class="hidden"/>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  <span class="w-4 h-4 rounded-full border border-outline flex items-center justify-center"></span>
                </div>
                <div>
                  <h4 class="font-title-md text-xs font-bold text-on-surface">Gắn Cảnh báo chính thức</h4>
                  <p class="font-body-sm text-[11px] text-outline leading-snug mt-1">Giữ lại bài học thuật nhưng gắn nhãn vi phạm và khấu trừ điểm học tập.</p>
                </div>
              </div>
              <div class="mt-3">
                <span class="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">Cảnh cáo</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 2: Reason & Note -->
        <div class="space-y-2">
          <span class="flex items-center gap-2 text-xs font-bold text-on-surface">
            <span class="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px]">2</span>
            <span>Lý do Vi phạm &amp; Ghi chú Kỷ luật</span>
          </span>

          <div class="space-y-2">
            <select id="disciplineReasonSelect" class="w-full h-10 px-3 bg-surface-container-low rounded-xl text-xs text-on-surface font-title-md font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              <option value="Spam quảng cáo / Link tệp tin độc hại">🚨 Spam quảng cáo / Link tệp tin độc hại</option>
              <option value="Nội dung đạo văn / Vi phạm bản quyền học thuật">©️ Nội dung đạo văn / Vi phạm bản quyền học thuật</option>
              <option value="Thông tin sai lệch / Giả mạo nguồn tài liệu">⚠️ Thông tin sai lệch / Giả mạo nguồn tài liệu</option>
              <option value="Ngôn từ xúc phạm / Công kích cá nhân">🤬 Ngôn từ xúc phạm / Công kích cá nhân</option>
            </select>
            <textarea id="disciplineNoteInput" rows="2" class="w-full p-3 bg-surface-container-low rounded-xl text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" placeholder="Nhập ghi chú hoặc yêu cầu xử lý dành cho tác giả sinh viên..."></textarea>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-low">
          <button id="btnCancelDisciplineModal" type="button" class="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer">
            Hủy bỏ
          </button>
          <button id="btnSubmitDisciplineModal" type="button" class="px-5 py-2.5 rounded-xl bg-error text-on-error font-label-md text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">send</span>
            <span>Xác nhận Xử lý &amp; Gửi Thông báo Kỷ luật</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Dynamic Card selection visual toggle
    const cards = modal.querySelectorAll('.discipline-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => {
          c.classList.remove('bg-error-container/20', 'border-2', 'border-error');
          c.classList.add('bg-surface-container-low', 'border', 'border-surface-container-high/70');
          c.querySelector('input').checked = false;
          c.querySelector('.w-4').innerHTML = '';
          c.querySelector('.w-4').classList.add('border-outline');
          c.querySelector('.w-4').classList.remove('border-error');
        });

        card.classList.add('bg-error-container/20', 'border-2', 'border-error');
        card.classList.remove('bg-surface-container-low', 'border-surface-container-high/70');
        const radio = card.querySelector('input');
        radio.checked = true;
        const circle = card.querySelector('.w-4');
        circle.classList.remove('border-outline');
        circle.classList.add('border-error');
        circle.innerHTML = '<span class="w-2 h-2 rounded-full bg-error"></span>';
      });
    });

    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseDisciplineModal')?.addEventListener('click', closeModal);
    modal.querySelector('#btnCancelDisciplineModal')?.addEventListener('click', closeModal);

    // Submit Discipline Form
    modal.querySelector('#btnSubmitDisciplineModal')?.addEventListener('click', async () => {
      const selectedRadio = modal.querySelector('input[name="disciplineAction"]:checked');
      const action = selectedRadio ? selectedRadio.value : 'delete';
      const reason = modal.querySelector('#disciplineReasonSelect')?.value || 'Spam quảng cáo / Link tệp tin độc hại';
      const note = modal.querySelector('#disciplineNoteInput')?.value.trim() || '';

      const actionText = action === 'delete' ? 'Gỡ bỏ & Xóa vĩnh viễn' : (action === 'hide' ? 'Tạm ẩn để khắc phục' : 'Gắn Cảnh báo chính thức');

      // Gửi yêu cầu MySQL API nếu DB active
      if (window.APIClient && APIClient.isMySQLActive) {
        try {
          await APIClient.disciplineItem({
            itemId: item.id,
            itemType,
            action,
            reason,
            note,
            moderatorName: currentUser.fullName
          });
          closeModal();
          Utils.showToast(`Đã xử lý kỷ luật bài viết trên MySQL DB và gửi thông báo tới ${item.authorName}!`, 'success');
          await StorageManager.syncWithMySQL();
          this.renderDashboard();
          this.renderQueuePage();
          Auth.syncUI();
          return;
        } catch (err) {
          console.warn('Lỗi xử lý kỷ luật MySQL API:', err.message);
        }
      }

      // Update local storage fallback
      if (action === 'delete') {
        this.rejectItem(item.id, itemType, reason);
      } else {
        const key = itemType === 'post' ? 'posts' : 'documents';
        const allItems = StorageManager.get(key, []);
        const target = allItems.find(i => i.id === item.id);
        if (target) {
          target.status = action === 'hide' ? 'hidden' : 'warning';
          StorageManager.set(key, allItems);
        }
      }

      // TỰ ĐỘNG GỬI THÔNG BÁO VỀ TÀI KHOẢN TÁC GIẢ BỊ XỬ LÝ (AUTOSEND NOTIFICATION TO TARGET USER)
      const targetUserId = item.userId || 'usr_001';
      Notifications.addNotification(targetUserId, {
        type: 'moderation',
        title: `⚠️ Thông báo Kỷ luật Kiểm duyệt [${codeBadge}]`,
        message: `Bài viết "${item.title}" của bạn đã bị [${actionText}] bởi Kiểm duyệt viên ${currentUser.fullName}. Lý do: ${reason}.${note ? ' Ghi chú: ' + note : ''}`,
        link: action === 'delete' ? 'index.html' : `post-detail.html?id=${item.id}`,
        icon: 'gavel',
        iconBg: 'bg-error text-on-error'
      });

      closeModal();
      Utils.showToast(`Đã xử lý kỷ luật và tự động gửi thông báo kỷ luật tới ${item.authorName}!`, 'success');

      // Refresh Dashboard or Queue page
      this.renderDashboard();
      this.renderQueuePage();
      Auth.syncUI();
    });
  },

  // Lấy thống kê số liệu hệ thống
  getStats() {
    const users = StorageManager.get('users', []);
    const posts = StorageManager.get('posts', []);
    const docs = StorageManager.get('documents', []);
    const reports = StorageManager.get('reports', []);
    const queue = this.getPendingQueue();

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalDocs: docs.length,
      pendingCount: queue.length,
      reportsCount: reports.filter(r => r.status === 'pending').length,
      resolvedToday: 142,
      accuracyRate: '99.4%'
    };
  }
};
