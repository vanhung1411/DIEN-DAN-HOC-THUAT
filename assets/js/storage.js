/**
 * EduHub Platform - Storage Manager / Data Access Layer (assets/js/storage.js)
 * Quản lý đọc/ghi localStorage và cấp Dữ liệu Mẫu Seed Data ban đầu.
 */

window.StorageManager = {
  PREFIX: 'studyhub_',

  get(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Lỗi đọc localStorage key: ${key}`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Lỗi ghi localStorage key: ${key}`, e);
    }
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  // Khởi tạo Dữ Dữ liệu Mẫu Seed Data khi ứng dụng chạy lần đầu
  initSeedData() {
    if (!localStorage.getItem(this.PREFIX + 'users')) {
      const seedUsers = [
        {
          id: 'usr_001',
          username: 'student_an',
          password: '123',
          fullName: 'Nguyễn Minh An',
          email: 'an.nguyen@student.edu.vn',
          role: 'student',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiZgW59iKVUVGv3CPk5My43-_Q6O2sQ7dal5C-pGq5cKMZSSSdp2d87NI-q6oq69z1XtJLaBK3gDKUKTtg2_FqFjq983x_MWxd3r0ajqW4L8ovDwh-V9sI-RLRHqhb3nlXCG0J6sb-C6NZNdRf57TgFdrGPtPRFZisSB4SfcNDUeT1k7ui-OIqNL3TKfkjOjNQADjm0bWeBPR5mVuNgpaaD0jKQt7jdt5suxCbpeYI1RP7fSSCCi9BEQ',
          department: 'Khoa Công nghệ Thông tin',
          school: 'Đại học Bách Khoa',
          savedDocIds: ['doc_101', 'doc_103'],
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
        },
        {
          id: 'usr_mod01',
          username: 'mod_teacher',
          password: '123',
          fullName: 'Lê Quốc An',
          email: 'quocan.le@hcmut.edu.vn',
          role: 'moderator',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIISU79_4QgFMPw-bEoBP-ZOf84BMt-KYiDARiwIjZpn965z6d0raciHcIoIiHVZnIFuAfJFssZom38U4AciBkr63jdy1RuBuWxyazH-3adlzdRSyBbIjPJ0EON47J5kFyOoxvDLtRiAUAXnFwzw52x8jQxEq4zzBmEchPKUyIMWpz0gH85QHNdikLIxxWEfRLqLs-citdoQRhUkz0BiOaMqwGznRXSZT--1UGA22keAtqO6VXP6XXA',
          department: 'Khoa Công nghệ Thông tin',
          school: 'Đại học Bách Khoa TP.HCM',
          savedDocIds: ['doc_102'],
          createdAt: new Date(Date.now() - 86400000 * 90).toISOString()
        },
        {
          id: 'usr_002',
          username: 'student_trang',
          password: '123',
          fullName: 'Lê Thu Trang',
          email: 'trang.le@math.edu.vn',
          role: 'student',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBKYQRkvMaYWRF8O4BKjDDOCzMCkafrGD0WkcYbkTX5sNdbk0Uh71PywSqxN5MFNy7IMKxoAYvoDv3ngANUlTu4xcOOIGDELJdRAtCkuXRK2L5bJFKwEOeDiuPPKg8Pa1zJnMiJbi4UUBrCIOT-aMhvUtRfCjMxKVaiILXL9DDcfZYUHrhmIcigvSCKKLAmZ-XOYC0P02_PUceGY_YkAmFecSXUOjPrzjB0W0tS89RU34CMtjSswXNpg',
          department: 'Viện Toán Ứng dụng & Tin học',
          school: 'Đại học Bách Khoa',
          savedDocIds: [],
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
        }
      ];
      this.set('users', seedUsers);
    }

    if (!localStorage.getItem(this.PREFIX + 'posts')) {
      const seedPosts = [
        {
          id: 'post_501',
          userId: 'usr_001',
          authorName: 'Nguyễn Minh An',
          authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiZgW59iKVUVGv3CPk5My43-_Q6O2sQ7dal5C-pGq5cKMZSSSdp2d87NI-q6oq69z1XtJLaBK3gDKUKTtg2_FqFjq983x_MWxd3r0ajqW4L8ovDwh-V9sI-RLRHqhb3nlXCG0J6sb-C6NZNdRf57TgFdrGPtPRFZisSB4SfcNDUeT1k7ui-OIqNL3TKfkjOjNQADjm0bWeBPR5mVuNgpaaD0jKQt7jdt5suxCbpeYI1RP7fSSCCi9BEQ',
          authorRole: 'Bạn bè',
          title: 'Lỗi Concurrent State Mutation trong React Redux Toolkit Query?',
          content: 'Mình đang thực hành project môn CS302 với luồng Optimistic Updates. Khi trigger đồng thời nhiều action update cache bằng `updateQueryData`, một số state phụ thuộc bị ghi đè không mong muốn. Có ai từng xử lý qua case này cho mình xin giải pháp với ạ!',
          codeSnippet: `async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
  const patchResult = dispatch(
    api.util.updateQueryData('getPost', id, (draft) => {
      Object.assign(draft, patch);
    })
  );
  try { await queryFulfilled; } catch { patchResult.undo(); }
}`,
          tags: ['#LapTrinhWeb', '#FrontendDev', '#CS302'],
          category: 'Công nghệ thông tin',
          visibility: 'Public',
          status: 'approved',
          likes: ['usr_002', 'usr_mod01'],
          commentsCount: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: 'post_502',
          userId: 'usr_002',
          authorName: 'Lê Thu Trang',
          authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBKYQRkvMaYWRF8O4BKjDDOCzMCkafrGD0WkcYbkTX5sNdbk0Uh71PywSqxN5MFNy7IMKxoAYvoDv3ngANUlTu4xcOOIGDELJdRAtCkuXRK2L5bJFKwEOeDiuPPKg8Pa1zJnMiJbi4UUBrCIOT-aMhvUtRfCjMxKVaiILXL9DDcfZYUHrhmIcigvSCKKLAmZ-XOYC0P02_PUceGY_YkAmFecSXUOjPrzjB0W0tS89RU34CMtjSswXNpg',
          authorRole: 'Công khai',
          title: 'Xin tip nhớ công thức chuỗi Fourier và Tích phân suy rộng loại 2?',
          content: 'Kỳ thi giữa kỳ Giải tích 2 sắp tới rồi mà mình vẫn hay nhầm lẫn điều kiện hội tụ Dirichlet và cách đổi cận khi hàm dưới dấu tích phân có điểm kỳ dị ở biên trái. Mình có tổng hợp nhanh sơ đồ tay ghi chép dưới đây, nhờ các cao nhân Toán rà soát giúp và chia sẻ thêm mẹo biến đổi nhanh với ạ!',
          mediaUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAle5qjbvnK52pCYw3muM2v8PlguYcHOmitE3VS0NQvD4PzdgTvVfddaLr7dtg0GYa541Az2d6bxjwXBOn2AO2NdZpXjvYv9GD1zfU6SqKJVG_tICIvs61zSdmyeW6GL93BXxJvhi3rMHo7US2b_XV4pObzoUH3Jv_Yg7bcdhYikkllxfvN5-5a68wLHsRJQOImrSOIfaUv0qFqW7lFw3UAyqmQ2GM6GhcZGr7YQpMAoWxgmrxW7xPuYw',
          tags: ['#GiaiTich2', '#ToanCaoCap'],
          category: 'Toán cao cấp',
          visibility: 'Public',
          status: 'approved',
          likes: ['usr_001'],
          commentsCount: 1,
          createdAt: new Date(Date.now() - 1000 * 3600 * 1).toISOString()
        }
      ];
      this.set('posts', seedPosts);
    }

    if (!localStorage.getItem(this.PREFIX + 'documents')) {
      const seedDocs = [
        {
          id: 'doc_101',
          userId: 'usr_001',
          authorName: 'Trần Minh Quân',
          title: 'Tuyển tập 50 Đề thi Cấu trúc Dữ liệu & Giải thuật 2024 có đáp án',
          description: 'Tài liệu bao gồm 10 bộ đề giữa kỳ, 15 bộ đề cuối kỳ kèm đáp án giải thích chi tiết mảng, danh sách liên kết, cây nhị tìm kiếm và đồ thị.',
          subject: 'Công nghệ thông tin',
          code: 'CS102',
          fileUrl: 'https://example.com/files/CTDL_GiaiThuat_2024.pdf',
          fileSize: '14.8 MB',
          pageCount: 128,
          format: 'pdf',
          visibility: 'Public',
          status: 'approved',
          downloadsCount: 1240,
          savesCount: 342,
          rating: 4.9,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 'doc_102',
          userId: 'usr_mod01',
          authorName: 'ThS. Hoàng Yến Chi',
          title: 'Bộ Slide Bài giảng Kinh Tế Lượng & Phân Tích Chuỗi Thời Gian',
          description: 'Bộ slide bài giảng chuẩn 64 trang kèm file dữ liệu thực hành Stata.',
          subject: 'Kinh tế & Tài chính',
          code: 'ECO301',
          fileUrl: 'https://example.com/files/KinhTeLuong_Slide.pptx',
          fileSize: '26.4 MB',
          pageCount: 64,
          format: 'slide',
          visibility: 'Friends',
          status: 'approved',
          downloadsCount: 680,
          savesCount: 124,
          rating: 4.8,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: 'doc_103',
          userId: 'usr_001',
          authorName: 'Lê Bá Khôi',
          title: 'Full Source Code & Báo cáo Dự án Web E-Commerce AI Recommender',
          description: 'Mã nguồn NodeJS + PyTorch thuật toán gợi ý sản phẩm cho Web bán hàng.',
          subject: 'Công nghệ thông tin',
          code: 'PROJ490',
          fileUrl: 'https://example.com/files/WebEcommerce_AI.zip',
          fileSize: '5.2 MB',
          pageCount: 1,
          format: 'code',
          visibility: 'Public',
          status: 'approved',
          downloadsCount: 2800,
          savesCount: 612,
          rating: 5.0,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ];
      this.set('documents', seedDocs);
    }

    if (!localStorage.getItem(this.PREFIX + 'comments')) {
      const seedComments = [
        {
          id: 'cmt_801',
          postId: 'post_501',
          userId: 'usr_mod01',
          authorName: 'Lê Quốc An',
          authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwIISU79_4QgFMPw-bEoBP-ZOf84BMt-KYiDARiwIjZpn965z6d0raciHcIoIiHVZnIFuAfJFssZom38U4AciBkr63jdy1RuBuWxyazH-3adlzdRSyBbIjPJ0EON47J5kFyOoxvDLtRiAUAXnFwzw52x8jQxEq4zzBmEchPKUyIMWpz0gH85QHNdikLIxxWEfRLqLs-citdoQRhUkz0BiOaMqwGznRXSZT--1UGA22keAtqO6VXP6XXA',
          authorRole: 'Moderator',
          parentId: null,
          content: 'Chào bạn An! Vấn đề của bạn chính xác nằm ở dòng `return draft;`. Trong Immer, bạn hoặc trực tiếp sửa đổi bản nháp mà không return gì cả, hoặc return một state hoàn toàn mới. Hãy xóa dòng `return draft;` đi nhé!',
          createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
        },
        {
          id: 'cmt_802',
          postId: 'post_501',
          userId: 'usr_001',
          authorName: 'Nguyễn Minh An',
          authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiZgW59iKVUVGv3CPk5My43-_Q6O2sQ7dal5C-pGq5cKMZSSSdp2d87NI-q6oq69z1XtJLaBK3gDKUKTtg2_FqFjq983x_MWxd3r0ajqW4L8ovDwh-V9sI-RLRHqhb3nlXCG0J6sb-C6NZNdRf57TgFdrGPtPRFZisSB4SfcNDUeT1k7ui-OIqNL3TKfkjOjNQADjm0bWeBPR5mVuNgpaaD0jKQt7jdt5suxCbpeYI1RP7fSSCCi9BEQ',
          authorRole: 'Tác giả',
          parentId: 'cmt_801',
          content: 'Dạ em cảm ơn anh An rất nhiều! Em vừa xóa `return draft;` và test lại thành công rồi ạ!',
          createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
        }
      ];
      this.set('comments', seedComments);
    }

    if (!localStorage.getItem(this.PREFIX + 'friendships')) {
      const seedFriends = [
        { id: 'fr_101', requesterId: 'usr_001', receiverId: 'usr_002', status: 'accepted' },
        { id: 'fr_102', requesterId: 'usr_002', receiverId: 'usr_mod01', status: 'pending' }
      ];
      this.set('friendships', seedFriends);
    }

    if (!localStorage.getItem(this.PREFIX + 'reports')) {
      const seedReports = [
        {
          id: 'rep_001',
          code: '#REP-2024-8841',
          reporterId: 'usr_001',
          reporterName: 'Nguyễn Minh An',
          targetType: 'post',
          targetId: 'post_501',
          reason: 'Spam quảng cáo / Khóa học / Link mã độc',
          details: 'Chèn link rút gọn nghi vấn chứa file thực thi .exe độc hại',
          status: 'pending',
          priority: 'high',
          createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
        }
      ];
      this.set('reports', seedReports);
    }

    this.ensurePendingItems();
  },

  ensurePendingItems() {
    const posts = this.get('posts', []);
    const docs = this.get('documents', []);

    let postChanged = false;
    let docChanged = false;

    if (!posts.some(p => p.status === 'pending')) {
      posts.push({
        id: 'post_pend_101',
        userId: 'usr_002',
        authorName: 'Lê Văn Nam (K21)',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        authorRole: 'Sinh viên',
        title: 'Chia sẻ bộ đề thi Giữa kỳ Mạng Máy Tính có đáp án chi tiết năm 2025',
        content: 'Mình vừa tổng hợp lại 10 đề thi môn Lập trình mạng các khóa trước kèm lời giải chi tiết Socket TCP/UDP. Mọi người xem qua và góp ý giúp mình với nhé!',
        tags: ['#MangMayTinh', '#DeThi2025'],
        category: 'Công nghệ thông tin',
        visibility: 'Public',
        status: 'pending',
        priority: 'high',
        likes: [],
        commentsCount: 0,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      });
      postChanged = true;
    }

    if (!docs.some(d => d.status === 'pending')) {
      docs.push({
        id: 'doc_pend_102',
        userId: 'usr_001',
        authorName: 'NguyenLoc_Dev',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiZgW59iKVUVGv3CPk5My43-_Q6O2sQ7dal5C-pGq5cKMZSSSdp2d87NI-q6oq69z1XtJLaBK3gDKUKTtg2_FqFjq983x_MWxd3r0ajqW4L8ovDwh-V9sI-RLRHqhb3nlXCG0J6sb-C6NZNdRf57TgFdrGPtPRFZisSB4SfcNDUeT1k7ui-OIqNL3TKfkjOjNQADjm0bWeBPR5mVuNgpaaD0jKQt7jdt5suxCbpeYI1RP7fSSCCi9BEQ',
        title: 'Slide Bài giảng môn Hệ Quản Trị CSDL SQL Server (Bài 1 - 8)',
        description: 'Tài liệu Slide PDF do giảng viên tổng hợp dùng cho thực hành Lab CSDL.',
        subject: 'Công nghệ thông tin',
        code: 'CS201',
        fileUrl: 'https://example.com/files/SQLServer_Lab.pdf',
        fileSize: '8.4 MB',
        pageCount: 64,
        format: 'pdf',
        visibility: 'Public',
        status: 'pending',
        priority: 'normal',
        downloadsCount: 0,
        savesCount: 0,
        rating: 5.0,
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
      });
      docChanged = true;
    }

    if (postChanged) this.set('posts', posts);
    if (docChanged) this.set('documents', docs);
  },

  // Đồng bộ MySQL REST API với Local Data Cache
  async syncWithMySQL() {
    if (!window.APIClient) return false;
    const isOnline = await APIClient.checkHealth();
    if (!isOnline) {
      console.log('ℹ️ [StorageManager] MySQL DB chưa bật hoặc ngắt kết nối. Đang dùng bộ nhớ LocalStorage.');
      return false;
    }

    try {
      console.log('⚡ [StorageManager] Kết nối MySQL thành công! Đang đồng bộ dữ liệu...');
      const [posts, docs] = await Promise.all([
        APIClient.getPosts({ status: 'all' }),
        APIClient.getDocuments({ status: 'all' })
      ]);

      if (Array.isArray(posts) && posts.length > 0) {
        this.set('posts', posts);
      }
      if (Array.isArray(docs) && docs.length > 0) {
        this.set('documents', docs);
      }

      this.showMySQLConnectedBadge();
      return true;
    } catch (err) {
      console.warn('⚠️ [StorageManager] Lỗi đồng bộ MySQL:', err.message);
      return false;
    }
  },

  showMySQLConnectedBadge() {
    if (document.getElementById('mysqlBadge')) return;
    const badge = document.createElement('div');
    badge.id = 'mysqlBadge';
    badge.className = 'fixed bottom-4 right-4 z-50 px-3.5 py-1.5 rounded-full bg-emerald-600/90 text-white font-mono text-[11px] font-bold shadow-lg flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-300';
    badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-white animate-pulse"></span><span>MySQL Database Connected</span>';
    document.body.appendChild(badge);
  }
};

// Khởi chạy seed data và đồng bộ MySQL DB
StorageManager.initSeedData();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => StorageManager.syncWithMySQL());
} else {
  StorageManager.syncWithMySQL();
}

