/**
 * EduHub Platform - Discussion Posts Controller (assets/js/posts.js)
 * Quản lý Bài thảo luận, Phạm vi hiển thị (Public/Friends/Only Me), Thả tim, Bình luận đa cấp & Media link.
 */

window.Posts = {
  // Lấy tất cả bài thảo luận có bộ lọc quyền truy cập & sắp xếp
  getAll(filterTab = 'all', sortOption = 'newest') {
    const posts = StorageManager.get('posts', []);
    const currentUser = Auth.getCurrentUser();
    const friendships = StorageManager.get('friendships', []);

    // Danh sách ID bạn bè của user hiện tại
    const friendIds = friendships
      .filter(f => f.status === 'accepted' && (f.requesterId === currentUser?.id || f.receiverId === currentUser?.id))
      .map(f => f.requesterId === currentUser?.id ? f.receiverId : f.requesterId);

    // Lọc bài viết theo phạm vi hiển thị
    let visiblePosts = posts.filter(post => {
      // Moderator xem được tất cả bài
      if (Auth.isModerator()) return true;
      // Bài của chính tác giả
      if (currentUser && post.userId === currentUser.id) return true;
      // Bài Public
      if (post.visibility === 'Public') return true;
      // Bài Friends (chỉ khi là bạn bè)
      if (post.visibility === 'Friends' && friendIds.includes(post.userId)) return true;
      return false;
    });

    // Phân loại theo tab
    if (filterTab === 'friends') {
      visiblePosts = visiblePosts.filter(p => friendIds.includes(p.userId) || p.userId === currentUser?.id);
    } else if (filterTab === 'useful') {
      visiblePosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      return visiblePosts;
    } else if (filterTab === 'trending') {
      visiblePosts.sort((a, b) => ((b.likes?.length || 0) + (b.commentsCount || 0) * 2) - ((a.likes?.length || 0) + (a.commentsCount || 0) * 2));
      return visiblePosts;
    }

    // Sắp xếp bổ sung dựa theo sortOption
    if (sortOption === 'popular') {
      visiblePosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (sortOption === 'unanswered') {
      visiblePosts = visiblePosts.filter(p => !p.commentsCount || p.commentsCount === 0);
      visiblePosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      visiblePosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return visiblePosts;
  },

  // Tạo bài thảo luận mới
  async createPost(data) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để đăng bài thảo luận!', 'warning');
      return false;
    }

    const newPostData = {
      userId: currentUser.id,
      authorName: currentUser.fullName,
      authorUsername: currentUser.username,
      department: currentUser.department || 'CNTT',
      title: Utils.escapeHTML(data.title || data.content.substring(0, 60)),
      content: Utils.escapeHTML(data.content),
      tags: data.tags || ['#HocThuat'],
      codeSnippet: data.codeSnippet ? Utils.escapeHTML(data.codeSnippet) : null
    };

    // Gọi MySQL REST API nếu DB active
    if (window.APIClient && APIClient.isMySQLActive) {
      try {
        const res = await APIClient.createPost(newPostData);
        Utils.showToast('Đã đăng bài thảo luận thành công vào MySQL DB!', 'success');
        StorageManager.syncWithMySQL();
        return res;
      } catch (err) {
        console.warn('Lỗi gửi bài lên MySQL API:', err.message);
      }
    }

    // Local fallback
    const posts = StorageManager.get('posts', []);
    const newPost = {
      id: Utils.generateId('post'),
      ...newPostData,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role === 'moderator' ? 'Moderator' : 'Sinh viên',
      visibility: data.visibility || 'Public',
      status: 'approved',
      likes: [],
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };

    posts.unshift(newPost);
    StorageManager.set('posts', posts);
    Utils.showToast(`Đã đăng bài thảo luận (${newPost.visibility})!`, 'success');
    return newPost;
  },

  // Thả tim / Upvote
  async toggleLike(postId) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để tương tác bài viết!', 'warning');
      return false;
    }

    if (window.APIClient && APIClient.isMySQLActive) {
      try {
        const res = await APIClient.likePost(postId, currentUser.id);
        Utils.showToast(res.liked ? 'Đã thả tim bài viết (MySQL)!' : 'Đã bỏ thả tim bài viết', 'info');
        StorageManager.syncWithMySQL();
        return res.likesCount;
      } catch (err) {
        console.warn('Lỗi like post MySQL API:', err.message);
      }
    }

    const posts = StorageManager.get('posts', []);
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    if (!post.likes) post.likes = [];
    const index = post.likes.indexOf(currentUser.id);
    if (index === -1) {
      post.likes.push(currentUser.id);
      Utils.showToast('Đã thả tim bài viết!', 'success');
    } else {
      post.likes.splice(index, 1);
    }

    StorageManager.set('posts', posts);
    return post.likes.length;
  },

  // Thêm bình luận hoặc trả lời bình luận (Reply)
  async addComment(postId, content, parentId = null, mediaUrl = null) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để bình luận!', 'warning');
      return false;
    }

    if (!content.trim()) {
      Utils.showToast('Nội dung bình luận không được để trống!', 'warning');
      return false;
    }

    const commentData = {
      targetType: 'post',
      targetId: postId,
      userId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      content: Utils.escapeHTML(content)
    };

    if (window.APIClient && APIClient.isMySQLActive) {
      try {
        const res = await APIClient.createComment(commentData);
        Utils.showToast('Đã gửi bình luận thành công (MySQL Database)!', 'success');
        
        // Thêm ngay comment mới vào LocalStorage cache để UI render tức thì
        const comments = StorageManager.get('comments', []);
        comments.push({
          id: res.id || Utils.generateId('cmt'),
          postId: postId,
          userId: currentUser.id,
          authorName: currentUser.fullName,
          authorAvatar: currentUser.avatar,
          authorRole: currentUser.role === 'moderator' ? 'Moderator' : 'Sinh viên',
          parentId: parentId,
          content: Utils.escapeHTML(content),
          createdAt: new Date().toISOString()
        });
        StorageManager.set('comments', comments);

        // Cập nhật số bình luận của bài viết
        const posts = StorageManager.get('posts', []);
        const post = posts.find(p => p.id === postId);
        if (post) {
          post.commentsCount = (post.commentsCount || 0) + 1;
          StorageManager.set('posts', posts);
        }

        return res;
      } catch (err) {
        console.warn('Lỗi gửi comment MySQL API:', err.message);
      }
    }

    const comments = StorageManager.get('comments', []);
    const newComment = {
      id: Utils.generateId('cmt'),
      postId: postId,
      userId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role === 'moderator' ? 'Moderator' : 'Sinh viên',
      parentId: parentId,
      content: Utils.escapeHTML(content),
      mediaUrl: mediaUrl && Utils.isValidURL(mediaUrl) ? mediaUrl : null,
      createdAt: new Date().toISOString()
    };

    comments.push(newComment);
    StorageManager.set('comments', comments);

    const posts = StorageManager.get('posts', []);
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      StorageManager.set('posts', posts);
    }

    Utils.showToast('Đã gửi bình luận!', 'success');
    return newComment;
  },

  // Đổi phạm vi hiển thị bài viết
  updateVisibility(postId, newVisibility) {
    const posts = StorageManager.get('posts', []);
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.visibility = newVisibility;
      StorageManager.set('posts', posts);
      Utils.showToast(`Đã đổi phạm vi hiển thị sang: ${newVisibility}`, 'info');
    }
  },

  // Xóa bài viết
  deletePost(postId) {
    let posts = StorageManager.get('posts', []);
    posts = posts.filter(p => p.id !== postId);
    StorageManager.set('posts', posts);
    Utils.showToast('Đã xóa bài thảo luận!', 'info');
  },

  // Lưu hoặc Hủy lưu bài viết
  toggleSavePost(postId) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để lưu bài viết!', 'warning');
      return false;
    }

    if (!currentUser.savedPostIds) currentUser.savedPostIds = [];
    const index = currentUser.savedPostIds.indexOf(postId);
    let isSaved = false;

    if (index === -1) {
      currentUser.savedPostIds.push(postId);
      isSaved = true;
      Utils.showToast('Đã lưu bài viết vào mục "Đã lưu"!', 'success');
    } else {
      currentUser.savedPostIds.splice(index, 1);
      isSaved = false;
      Utils.showToast('Đã xóa bài viết khỏi mục "Đã lưu"', 'info');
    }

    Auth.setCurrentUser(currentUser);
    const users = StorageManager.get('users', []);
    const u = users.find(usr => usr.id === currentUser.id);
    if (u) {
      u.savedPostIds = currentUser.savedPostIds;
      StorageManager.set('users', users);
    }
    return isSaved;
  },

  // Kiểm tra bài viết đã được lưu chưa
  isPostSaved(postId) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || !currentUser.savedPostIds) return false;
    return currentUser.savedPostIds.includes(postId);
  }
};
