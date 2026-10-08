/**
 * EduHub Platform - Utility Helpers (assets/js/utils.js)
 * Chứa các hàm tiện ích bảo mật, định dạng thời gian và thông báo Toast.
 */

window.Utils = {
  // Chống tấn công XSS bằng cách escape HTML entities
  escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Định dạng thời gian tương đối bằng Tiếng Việt
  timeAgo(dateString) {
    if (!dateString) return 'Vừa xong';
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    
    // Nếu quá 7 ngày, hiển thị ngày/tháng/năm
    return past.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  // Tạo ID duy nhất ngẫu nhiên
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  },

  // Hiển thị thông báo Toast mượt mà
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClasses = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-indigo-600 text-white'
    };

    toast.className = `px-4 py-3 rounded-xl shadow-lg font-label-md text-sm transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center gap-2 ${bgClasses[type] || bgClasses.info}`;
    
    const icon = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    }[type] || 'info';

    toast.innerHTML = `<span class="material-symbols-outlined text-[20px]">${icon}</span><span>${this.escapeHTML(message)}</span>`;
    container.appendChild(toast);

    // Fade in animation
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Kiểm tra URL hợp lệ
  isValidURL(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }
};
