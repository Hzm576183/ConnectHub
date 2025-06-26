// ConnectHub - 基础功能
class ConnectHub {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.comments = {};
        this.currentPostId = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.renderPosts();
        console.log('ConnectHub 已初始化');
    }

    // 绑定事件
    bindEvents() {
        // 登录/注册按钮
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showAuthModal('register'));
        
        // 发帖按钮
        document.getElementById('startDiscussionBtn').addEventListener('click', () => this.showPostModal());
        
        // 模态框切换
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('register');
        });
        
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('login');
        });
        
        // 关闭模态框
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        
        // 点击外部关闭模态框
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
        
        // 表单提交
        document.getElementById('loginForm').querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });
        
        document.getElementById('registerForm').querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });
        
        document.getElementById('newPostForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewPost(e);
        });
        
        // 取消发帖
        document.getElementById('cancelPost').addEventListener('click', () => this.closeModals());
        
        // 排序按钮
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSort(e));
        });
        
        // 详情页面事件
        document.getElementById('backToHome').addEventListener('click', () => this.showHomePage());
        document.getElementById('addCommentBtn').addEventListener('click', () => this.showCommentForm());
        document.getElementById('cancelComment').addEventListener('click', () => this.hideCommentForm());
        document.getElementById('submitComment').addEventListener('click', () => this.handleAddComment());
    }

    // 显示认证模态框
    showAuthModal(type) {
        document.getElementById('authModal').style.display = 'block';
        this.switchAuthForm(type);
    }

    // 切换认证表单
    switchAuthForm(type) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (type === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }

    // 显示发帖模态框
    showPostModal() {
        if (!this.currentUser) {
            alert('请先登录');
            this.showAuthModal('login');
            return;
        }
        document.getElementById('postModal').style.display = 'block';
    }

    // 关闭所有模态框
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // 处理登录
    handleLogin(e) {
        const formData = new FormData(e.target);
        const username = formData.get('username') || e.target.querySelector('input[type="text"]').value;
        const password = formData.get('password') || e.target.querySelector('input[type="password"]').value;
        
        if (username && password) {
            this.currentUser = { username, loginTime: new Date() };
            this.saveToStorage();
            this.updateUI();
            this.closeModals();
            alert(`欢迎回来，${username}！`);
        }
    }

    // 处理注册
    handleRegister(e) {
        const inputs = e.target.querySelectorAll('input');
        const username = inputs[0].value;
        const email = inputs[1].value;
        const password = inputs[2].value;
        const confirmPassword = inputs[3].value;
        
        if (password !== confirmPassword) {
            alert('密码不匹配');
            return;
        }
        
        if (username && email && password) {
            this.currentUser = { username, email, registerTime: new Date() };
            this.saveToStorage();
            this.updateUI();
            this.closeModals();
            alert(`注册成功，欢迎 ${username}！`);
        }
    }

    // 处理新帖发布
    handleNewPost(e) {
        const title = document.getElementById('postTitle').value;
        const category = document.getElementById('postCategory').value;
        const content = document.getElementById('postContent').value;
        
        if (title && content) {
            const newPost = {
                id: Date.now(),
                title,
                category: category || '未分类',
                content,
                author: this.currentUser.username,
                time: new Date(),
                replies: 0,
                likes: 0
            };
            
            this.posts.unshift(newPost);
            this.saveToStorage();
            this.renderPosts();
            this.closeModals();
            
            // 清空表单
            document.getElementById('newPostForm').reset();
            
            alert('发帖成功！');
        }
    }

    // 处理排序
    handleSort(e) {
        document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const sortType = e.target.dataset.sort;
        if (sortType === 'latest') {
            this.posts.sort((a, b) => new Date(b.time) - new Date(a.time));
        } else if (sortType === 'popular') {
            this.posts.sort((a, b) => b.likes - a.likes);
        }
        
        this.renderPosts();
    }

    // 渲染帖子列表
    renderPosts() {
        const postsList = document.getElementById('postsList');
        
        if (this.posts.length === 0) {
            postsList.innerHTML = '<p>暂无帖子，快来发布第一个帖子吧！</p>';
            return;
        }
        
        postsList.innerHTML = this.posts.map(post => `
            <div class="post-item" style="border: 1px solid #e5e5e5; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; background: #fafafa;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; color: #2563eb; cursor: pointer;" onclick="connectHub.showPostDetail(${post.id})">${post.title}</h3>
                    <span style="background: #e5e5e5; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${post.category}</span>
                </div>
                <p style="color: #666; margin-bottom: 1rem; line-height: 1.4;">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #666;">
                    <span>by ${post.author}</span>
                    <div style="display: flex; gap: 1rem;">
                        <span><i class="fas fa-thumbs-up"></i> ${post.likes}</span>
                        <span><i class="fas fa-comment"></i> ${this.getCommentsCount(post.id)}</span>
                        <span>${this.formatTime(post.time)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 显示帖子详情
    showPostDetail(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        this.currentPostId = postId;
        
        // 隐藏首页，显示详情页
        document.getElementById('homePage').classList.add('hidden');
        document.getElementById('postDetailPage').classList.remove('hidden');
        
        // 渲染帖子详情
        this.renderPostDetail(post);
        this.renderComments(postId);
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    // 渲染帖子详情
    renderPostDetail(post) {
        const postDetail = document.getElementById('postDetail');
        
        postDetail.innerHTML = `
            <div class="post-detail-header">
                <h1 class="post-detail-title">${post.title}</h1>
                <div class="post-detail-meta">
                    <span class="post-detail-category">${post.category}</span>
                    <span>作者: ${post.author}</span>
                    <span>发布时间: ${this.formatTime(post.time)}</span>
                </div>
            </div>
            <div class="post-detail-content">
                ${post.content.replace(/\n/g, '<br>')}
            </div>
            <div class="post-actions">
                <button class="like-btn ${post.likedBy && post.likedBy.includes(this.currentUser?.username) ? 'liked' : ''}" onclick="connectHub.toggleLike(${post.id})">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${post.likes}</span>
                </button>
                <button class="btn btn-outline" onclick="connectHub.showCommentForm()">
                    <i class="fas fa-comment"></i>
                    回复
                </button>
            </div>
        `;
    }

    // 显示首页
    showHomePage() {
        document.getElementById('postDetailPage').classList.add('hidden');
        document.getElementById('homePage').classList.remove('hidden');
        this.currentPostId = null;
    }

    // 切换点赞
    toggleLike(postId) {
        if (!this.currentUser) {
            alert('请先登录');
            this.showAuthModal('login');
            return;
        }
        
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        if (!post.likedBy) post.likedBy = [];
        
        const userIndex = post.likedBy.indexOf(this.currentUser.username);
        if (userIndex > -1) {
            post.likedBy.splice(userIndex, 1);
            post.likes--;
        } else {
            post.likedBy.push(this.currentUser.username);
            post.likes++;
        }
        
        this.saveToStorage();
        this.renderPostDetail(post);
    }

    // 显示评论表单
    showCommentForm() {
        if (!this.currentUser) {
            alert('请先登录');
            this.showAuthModal('login');
            return;
        }
        
        document.getElementById('commentForm').classList.remove('hidden');
        document.getElementById('commentText').focus();
    }

    // 隐藏评论表单
    hideCommentForm() {
        document.getElementById('commentForm').classList.add('hidden');
        document.getElementById('commentText').value = '';
    }

    // 处理添加评论
    handleAddComment() {
        const commentText = document.getElementById('commentText').value.trim();
        if (!commentText) return;
        
        if (!this.comments[this.currentPostId]) {
            this.comments[this.currentPostId] = [];
        }
        
        const newComment = {
            id: Date.now(),
            postId: this.currentPostId,
            author: this.currentUser.username,
            content: commentText,
            time: new Date()
        };
        
        this.comments[this.currentPostId].push(newComment);
        this.saveToStorage();
        this.renderComments(this.currentPostId);
        this.hideCommentForm();
        
        // 更新帖子回复数
        const post = this.posts.find(p => p.id === this.currentPostId);
        if (post) {
            post.replies = this.getCommentsCount(this.currentPostId);
            this.saveToStorage();
        }
    }

    // 渲染评论
    renderComments(postId) {
        const commentsList = document.getElementById('commentsList');
        const commentsCount = document.getElementById('commentsCount');
        const comments = this.comments[postId] || [];
        
        commentsCount.textContent = comments.length;
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">暂无评论，快来发表第一个评论吧！</p>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${this.formatTime(comment.time)}</span>
                </div>
                <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
            </div>
        `).join('');
    }

    // 获取评论数量
    getCommentsCount(postId) {
        return this.comments[postId] ? this.comments[postId].length : 0;
    }

    // 格式化时间
    formatTime(time) {
        const now = new Date();
        const postTime = new Date(time);
        const diff = now - postTime;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        return `${Math.floor(diff / 86400000)}天前`;
    }

    // 更新UI状态
    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        if (this.currentUser) {
            loginBtn.textContent = this.currentUser.username;
            loginBtn.onclick = () => this.logout();
            registerBtn.style.display = 'none';
        } else {
            loginBtn.textContent = '登录';
            loginBtn.onclick = () => this.showAuthModal('login');
            registerBtn.style.display = 'inline-block';
        }
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            this.currentUser = null;
            this.saveToStorage();
            this.updateUI();
            alert('已退出登录');
        }
    }

    // 保存到本地存储
    saveToStorage() {
        localStorage.setItem('connecthub_user', JSON.stringify(this.currentUser));
        localStorage.setItem('connecthub_posts', JSON.stringify(this.posts));
        localStorage.setItem('connecthub_comments', JSON.stringify(this.comments));
    }

    // 从本地存储加载
    loadFromStorage() {
        const savedUser = localStorage.getItem('connecthub_user');
        const savedPosts = localStorage.getItem('connecthub_posts');
        const savedComments = localStorage.getItem('connecthub_comments');
        
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        
        if (savedComments) {
            this.comments = JSON.parse(savedComments);
        }
        
        if (savedPosts) {
            this.posts = JSON.parse(savedPosts);
        } else {
            // 添加一些示例帖子
            this.posts = [
                {
                    id: 1,
                    title: '欢迎来到 ConnectHub！',
                    category: '公告',
                    content: '这是我们论坛的第一个帖子。欢迎大家在这里分享想法、交流心得！',
                    author: 'Admin',
                    time: new Date(Date.now() - 86400000),
                    replies: 5,
                    likes: 12
                },
                {
                    id: 2,
                    title: '如何使用这个论坛？',
                    category: '问答',
                    content: '新手指南：点击右上角注册账号，然后就可以发帖和回复了。',
                    author: 'Helper',
                    time: new Date(Date.now() - 43200000),
                    replies: 3,
                    likes: 8
                }
            ];
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.connectHub = new ConnectHub();
});