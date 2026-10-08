/**
 * EduHub Platform - Friends & Networking Controller (assets/js/friends.js)
 * Quản lý Lời mời kết bạn, Danh sách bạn bè & Kết nối sinh viên.
 */

window.Friends = {
  // Gửi lời mời kết bạn
  sendRequest(targetUserId) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      Utils.showToast('Vui lòng đăng nhập để gửi lời mời kết bạn!', 'warning');
      return false;
    }

    if (currentUser.id === targetUserId) {
      Utils.showToast('Bạn không thể tự kết bạn với chính mình!', 'warning');
      return false;
    }

    const friendships = StorageManager.get('friendships', []);
    const existing = friendships.find(f => 
      (f.requesterId === currentUser.id && f.receiverId === targetUserId) ||
      (f.requesterId === targetUserId && f.receiverId === currentUser.id)
    );

    if (existing) {
      if (existing.status === 'accepted') {
        Utils.showToast('Hai bạn đã là bạn bè!', 'info');
      } else {
        Utils.showToast('Lời mời kết bạn đã được gửi trước đó!', 'info');
      }
      return false;
    }

    const newFriendship = {
      id: Utils.generateId('fr'),
      requesterId: currentUser.id,
      receiverId: targetUserId,
      status: 'pending',
      updatedAt: new Date().toISOString()
    };

    friendships.push(newFriendship);
    StorageManager.set('friendships', friendships);
    Utils.showToast('Đã gửi lời mời kết bạn thành công!', 'success');
    return newFriendship;
  },

  // Chấp nhận lời mời kết bạn
  acceptRequest(friendshipId) {
    const friendships = StorageManager.get('friendships', []);
    const fr = friendships.find(f => f.id === friendshipId);
    if (fr) {
      fr.status = 'accepted';
      fr.updatedAt = new Date().toISOString();
      StorageManager.set('friendships', friendships);
      Utils.showToast('Đã chấp nhận lời mời kết bạn!', 'success');
    }
  },

  // Từ chối lời mời kết bạn
  rejectRequest(friendshipId) {
    let friendships = StorageManager.get('friendships', []);
    friendships = friendships.filter(f => f.id !== friendshipId);
    StorageManager.set('friendships', friendships);
    Utils.showToast('Đã từ chối lời mời kết bạn', 'info');
  },

  // Lấy danh sách lời mời chờ chấp nhận của user hiện tại
  getPendingRequests() {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return [];

    const friendships = StorageManager.get('friendships', []);
    const users = StorageManager.get('users', []);

    return friendships
      .filter(f => f.receiverId === currentUser.id && f.status === 'pending')
      .map(f => {
        const requester = users.find(u => u.id === f.requesterId);
        return { ...f, requester };
      });
  },

  // Lấy danh sách bạn bè đã kết nối
  getFriendList(userId = null) {
    const currentUser = Auth.getCurrentUser();
    const targetId = userId || currentUser?.id;
    if (!targetId) return [];

    const friendships = StorageManager.get('friendships', []);
    const users = StorageManager.get('users', []);

    const friendIds = friendships
      .filter(f => f.status === 'accepted' && (f.requesterId === targetId || f.receiverId === targetId))
      .map(f => f.requesterId === targetId ? f.receiverId : f.requesterId);

    return users.filter(u => friendIds.includes(u.id));
  }
};
