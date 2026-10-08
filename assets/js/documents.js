/**
 * EduHub Platform - Documents Controller (assets/js/documents.js)
 * Quản lý Kho tài liệu học tập, Tìm kiếm, Lọc môn học/định dạng, Sắp xếp và Lưu tài nguyên.
 */

window.Documents = {
  // Lấy danh sách tài liệu có lọc & sắp xếp
  getAll(filters = {}) {
    let docs = StorageManager.get('documents', []);
    const currentUser = Auth.getCurrentUser();

    // Lọc theo phạm vi hiển thị
    docs = docs.filter(doc => {
      if (Auth.isModerator()) return true;
      if (currentUser && doc.userId === currentUser.id) return true;
      if (doc.visibility === 'Public') return true;
      return false;
    });

    // Tìm kiếm từ khóa
    if (filters.search) {
      const q = filters.search.toLowerCase();
      docs = docs.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.description.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        d.subject.toLowerCase().includes(q)
      );
    }

    // Lọc theo định dạng (pdf, slide, code)
    if (filters.format && filters.format !== 'all') {
      docs = docs.filter(d => d.format === filters.format);
    }

    // Sắp xếp
    if (filters.sort === 'rating') {
      docs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sort === 'saves') {
      docs.sort((a, b) => (b.savesCount || 0) - (a.savesCount || 0));
    } else if (filters.sort === 'latest') {
      docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // Mặc định: Lượt tải nhiều nhất
      docs.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
    }

    return docs;
  },

  // Chia sẻ / Đăng tài liệu mới
  createDocument(data) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để đóng góp tài liệu!', 'warning');
      return false;
    }

    const docs = StorageManager.get('documents', []);
    const newDoc = {
      id: Utils.generateId('doc'),
      userId: currentUser.id,
      authorName: currentUser.fullName,
      title: Utils.escapeHTML(data.title),
      description: Utils.escapeHTML(data.description || 'Tài liệu học tập chia sẻ cộng đồng.'),
      subject: data.subject || 'Công nghệ thông tin',
      code: data.code || 'GEN101',
      fileUrl: data.fileUrl && Utils.isValidURL(data.fileUrl) ? data.fileUrl : 'https://example.com/file.pdf',
      fileSize: '12.5 MB',
      pageCount: 45,
      format: data.format || 'pdf',
      visibility: data.visibility || 'Public', // Public hoặc Friends
      downloadsCount: 0,
      savesCount: 0,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    docs.unshift(newDoc);
    StorageManager.set('documents', docs);
    Utils.showToast('Đã tải lên và đóng góp tài liệu thành công!', 'success');
    return newDoc;
  },

  // Lưu hoặc bỏ lưu tài liệu vào kho cá nhân
  toggleSave(docId) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để lưu tài liệu!', 'warning');
      return false;
    }

    const users = StorageManager.get('users', []);
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return false;

    if (!user.savedDocIds) user.savedDocIds = [];
    const index = user.savedDocIds.indexOf(docId);
    let isSaved = false;

    if (index === -1) {
      user.savedDocIds.push(docId);
      isSaved = true;
      Utils.showToast('Đã lưu tài liệu vào kho cá nhân!', 'success');
    } else {
      user.savedDocIds.splice(index, 1);
      Utils.showToast('Đã bỏ lưu tài liệu', 'info');
    }

    // Cập nhật lượt lưu trên doc
    const docs = StorageManager.get('documents', []);
    const doc = docs.find(d => d.id === docId);
    if (doc) {
      doc.savesCount = Math.max(0, (doc.savesCount || 0) + (isSaved ? 1 : -1));
      StorageManager.set('documents', docs);
    }

    StorageManager.set('users', users);
    Auth.setCurrentUser(user);
    return isSaved;
  },

  // Tăng lượt tải về
  incrementDownload(docId) {
    const docs = StorageManager.get('documents', []);
    const doc = docs.find(d => d.id === docId);
    if (doc) {
      doc.downloadsCount = (doc.downloadsCount || 0) + 1;
      StorageManager.set('documents', docs);
      Utils.showToast(`Đang tải về: ${doc.title}`, 'success');
    }
  }
};
