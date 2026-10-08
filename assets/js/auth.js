/**
 * EduHub Platform - Auth Service (assets/js/auth.js)
 * Quản lý Đăng ký, Đăng nhập, Đăng xuất, Session và Phân quyền người dùng.
 */

window.Auth = {
  SESSION_KEY: 'current_user',

  // Lấy thông tin người dùng đang đăng nhập
  getCurrentUser() {
    const user = StorageManager.get(this.SESSION_KEY, null);
    if (!user) {
      // Mặc định khởi tạo session cho student_an để trải nghiệm ứng dụng liền mạch
      const defaultUser = StorageManager.get('users', []).find(u => u.username === 'student_an');
      if (defaultUser) {
        this.setCurrentUser(defaultUser);
        return defaultUser;
      }
    }
    return user;
  },

  // Đặt thông tin session người dùng
  setCurrentUser(user) {
    StorageManager.set(this.SESSION_KEY, user);
  },

  // Đăng nhập (Async support for MySQL DB)
  async login(username, password) {
    if (window.APIClient && APIClient.isMySQLActive) {
      try {
        const res = await APIClient.login(username, password);
        if (res.success && res.user) {
          this.setCurrentUser(res.user);
          Utils.showToast(`Chào mừng ${res.user.fullName} đã quay trở lại! (MySQL Database)`, 'success');
          return { success: true, user: res.user };
        }
      } catch (err) {
        Utils.showToast(err.message || 'Lỗi đăng nhập MySQL DB', 'error');
        return { success: false, error: err.message };
      }
    }

    const users = StorageManager.get('users', []);
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
    
    if (user) {
      this.setCurrentUser(user);
      Utils.showToast(`Chào mừng ${user.fullName} đã quay trở lại!`, 'success');
      return { success: true, user };
    } else {
      Utils.showToast('Tên đăng nhập hoặc mật khẩu không chính xác!', 'error');
      return { success: false, error: 'Thông tin đăng nhập không hợp lệ' };
    }
  },

  // Đăng ký tài khoản sinh viên mới
  async register(data) {
    if (window.APIClient && APIClient.isMySQLActive) {
      try {
        const res = await APIClient.register(data);
        if (res.success && res.user) {
          this.setCurrentUser(res.user);
          Utils.showToast('Đăng ký tài khoản thành công vào MySQL Database!', 'success');
          return { success: true, user: res.user };
        }
      } catch (err) {
        Utils.showToast(err.message || 'Lỗi đăng ký MySQL DB', 'error');
        return { success: false, error: err.message };
      }
    }

    const users = StorageManager.get('users', []);
    
    if (users.some(u => u.username === data.username)) {
      Utils.showToast('Tên đăng nhập đã tồn tại!', 'error');
      return { success: false, error: 'Tên đăng nhập trùng lặp' };
    }

    const newUser = {
      id: Utils.generateId('usr'),
      username: data.username,
      password: data.password || '123',
      fullName: data.fullName,
      email: data.email || `${data.username}@student.edu.vn`,
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      department: data.department || 'Công nghệ Thông tin',
      school: data.school || 'Đại học Bách Khoa',
      savedDocIds: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    StorageManager.set('users', users);
    this.setCurrentUser(newUser);
    Utils.showToast('Đăng ký tài khoản sinh viên thành công!', 'success');
    return { success: true, user: newUser };
  },

  // Đăng xuất
  logout() {
    StorageManager.remove(this.SESSION_KEY);
    Utils.showToast('Đã đăng xuất khỏi hệ thống', 'info');
    setTimeout(() => {
      window.location.href = 'public.html';
    }, 500);
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  isModerator() {
    const user = this.getCurrentUser();
    return user && (user.role === 'moderator' || user.role === 'admin');
  },

  // Đồng bộ giao diện Header / Sidebar theo phiên đăng nhập thực tế
  syncUI() {
    const user = this.getCurrentUser();
    if (!user) return;

    // Cập nhật tên và avatar ở Header
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.fullName);
    document.querySelectorAll('.user-role-display').forEach(el => el.textContent = (user.role === 'moderator' || user.role === 'admin') ? 'Moderator' : 'Sinh viên');
    document.querySelectorAll('.user-avatar-display').forEach(el => {
      if (el.tagName === 'IMG') el.src = user.avatar;
    });

    // An/hiện Moderator Zone dựa vào role
    const isMod = this.isModerator();
    document.querySelectorAll('.moderator-only-zone').forEach(zone => {
      if (isMod) {
        zone.classList.remove('hidden');
      } else {
        zone.classList.add('hidden');
      }
    });

    if (window.Moderation && isMod) {
      const queue = Moderation.getPendingQueue();
      document.querySelectorAll('.moderator-only-zone .bg-error').forEach(badge => {
        badge.textContent = queue.length;
      });
    }
  }
};
