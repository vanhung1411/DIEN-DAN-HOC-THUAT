/**
 * EduHub Platform - Client API Service (assets/js/api.js)
 * Module giao tiếp HTTP Fetch API với Backend Express & MySQL Database Server.
 */

window.APIClient = {
  baseUrl: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? `${window.location.origin}/api`
    : '/api',

  isMySQLActive: false,

  // Kiểm tra kết nối đến MySQL Backend API
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { cache: 'no-store' });
      if (!res.ok) return false;
      const data = await res.json();
      this.isMySQLActive = Boolean(data.mysql);
      return this.isMySQLActive;
    } catch (e) {
      this.isMySQLActive = false;
      return false;
    }
  },

  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Lỗi kết nối MySQL Server');
      }

      return data;
    } catch (error) {
      console.warn(`[API Connection Warning] ${endpoint}:`, error.message);
      throw error;
    }
  },

  // 1. AUTH API
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
  },

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  // 2. POSTS API
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/posts${query ? '?' + query : ''}`);
  },

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: postData
    });
  },

  async likePost(postId, userId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
      body: { userId }
    });
  },

  // 3. DOCUMENTS API
  async getDocuments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/documents${query ? '?' + query : ''}`);
  },

  async createDocument(docData) {
    return this.request('/documents', {
      method: 'POST',
      body: docData
    });
  },

  // 4. COMMENTS API
  async getComments(targetType, targetId) {
    return this.request(`/comments?targetType=${targetType}&targetId=${targetId}`);
  },

  async createComment(commentData) {
    return this.request('/comments', {
      method: 'POST',
      body: commentData
    });
  },

  // 5. NOTIFICATIONS API
  async getNotifications(userId) {
    return this.request(`/notifications?userId=${userId}`);
  },

  async createNotification(notifData) {
    return this.request('/notifications', {
      method: 'POST',
      body: notifData
    });
  },

  async markNotificationRead(userId, notifId = null) {
    return this.request('/notifications/read', {
      method: 'PUT',
      body: { userId, notifId }
    });
  },

  // 6. REPORTS & MODERATION API
  async getReports() {
    return this.request('/reports');
  },

  async submitReport(reportData) {
    return this.request('/reports', {
      method: 'POST',
      body: reportData
    });
  },

  async disciplineItem(disciplineData) {
    return this.request('/moderation/discipline', {
      method: 'POST',
      body: disciplineData
    });
  }
};
