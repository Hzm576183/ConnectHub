// ConnectHub - 基础功能
class ConnectHub {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.comments = {};
        this.currentPostId = null;
        this.searchResults = [];
        this.currentSearchQuery = '';
        this.api = window.connectHubAPI;
        this.init();
    }

    async init() {
        await this.loadUserFromToken();
        this.bindEvents();
        await this.loadPosts();
        this.updateUI();
        console.log('ConnectHub 已初始化');
    }

    // 从token加载用户信息
    async loadUserFromToken() {
        const token = localStorage.getItem('connecthub_token');
        if (token) {
            try {
                const response = await this.api.getProfile();
                this.currentUser = response.data.user;
                console.log('用户自动登录成功:', this.currentUser.username);
            } catch (error) {
                console.log('Token已过期，需要重新登录');
                this.api.setToken(null); // 清除无效的token
            }
        }
    }

    // 绑定事件
    bindEvents() {
        // 登录/注册按钮
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showAuthModal('register'));
        
        // 测试登录按钮 - 开发测试用
        document.getElementById('testLoginBtn').addEventListener('click', () => this.handleTestLogin());
        
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
        
        // 搜索相关事件
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        document.getElementById('homeLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHomePage();
        });
        document.getElementById('backFromSearch').addEventListener('click', () => this.showHomePage());
        
        // 搜索过滤器事件
        document.getElementById('categoryFilter').addEventListener('change', () => this.applySearchFilters());
        document.getElementById('searchSortFilter').addEventListener('change', () => this.applySearchFilters());
        document.getElementById('authorFilter').addEventListener('input', () => this.applySearchFilters());
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
    async handleLogin(e) {
        try {
            const inputs = e.target.querySelectorAll('input');
            const username = inputs[0].value.trim();
            const password = inputs[1].value;
            
            if (!username || !password) {
                alert('请填写完整的登录信息');
                return;
            }

            const response = await this.api.login({ username, password });
            this.currentUser = response.data.user;
            this.updateUI();
            this.closeModals();
            
            // 清空表单
            e.target.reset();
            
            alert(`欢迎回来，${this.currentUser.username}！`);
            console.log('登录成功:', this.currentUser);
            
        } catch (error) {
            console.error('登录失败:', error);
            alert(error.message || '登录失败，请检查用户名和密码');
        }
    }

    // 测试登录方法 - 开发测试用
    async handleTestLogin() {
        try {
            // 使用预设的测试账号
            const testUser = {
                username: 'testuser',
                password: 'test123'
            };
            
            console.log('尝试测试登录...');
            const response = await this.api.login(testUser);
            this.currentUser = response.data.user;
            this.updateUI();
            
            alert(`测试登录成功！欢迎 ${this.currentUser.username}！`);
            console.log('测试登录成功:', this.currentUser);
            
        } catch (error) {
            console.error('测试登录失败:', error);
            // 如果测试账号不存在，尝试创建
            if (error.message.includes('用户不存在') || error.message.includes('用户名或密码错误')) {
                try {
                    console.log('测试账号不存在，尝试创建...');
                    const registerResponse = await this.api.register({
                        username: 'testuser',
                        email: 'test@example.com',
                        password: 'test123'
                    });
                    this.currentUser = registerResponse.data.user;
                    this.updateUI();
                    alert(`测试账号创建成功！欢迎 ${this.currentUser.username}！`);
                    console.log('测试账号创建成功:', this.currentUser);
                } catch (registerError) {
                    console.error('创建测试账号失败:', registerError);
                    alert('测试登录失败: ' + (registerError.message || '请检查服务器连接'));
                }
            } else {
                alert('测试登录失败: ' + (error.message || '请检查服务器连接'));
            }
        }
    }

    // 处理注册
    async handleRegister(e) {
        try {
            const inputs = e.target.querySelectorAll('input');
            const username = inputs[0].value.trim();
            const email = inputs[1].value.trim();
            const password = inputs[2].value;
            const confirmPassword = inputs[3].value;
            
            if (!username || !email || !password || !confirmPassword) {
                alert('请填写完整的注册信息');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('密码不匹配');
                return;
            }
            
            if (password.length < 6) {
                alert('密码至少需要6个字符');
                return;
            }
            
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)/;
            if (!passwordRegex.test(password)) {
                alert('密码必须同时包含字母和数字');
                return;
            }

            const response = await this.api.register({ username, email, password });
            this.currentUser = response.data.user;
            this.updateUI();
            this.closeModals();
            
            // 清空表单
            e.target.reset();
            
            alert(`注册成功，欢迎 ${this.currentUser.username}！`);
            console.log('注册成功:', this.currentUser);
            
        } catch (error) {
            console.error('注册失败:', error);
            alert(error.message || '注册失败，请稍后重试');
        }
    }

    // 处理新帖发布
    async handleNewPost(e) {
        try {
            const title = document.getElementById('postTitle').value.trim();
            const category = document.getElementById('postCategory').value;
            const content = document.getElementById('postContent').value.trim();
            
            if (!title || !category || !content) {
                alert('请填写所有字段');
                return;
            }

            if (title.length < 5 || title.length > 100) {
                alert('标题长度必须在5-100个字符之间');
                return;
            }

            if (content.length < 10 || content.length > 5000) {
                alert('内容长度必须在10-5000个字符之间');
                return;
            }

            const postData = { title, category, content };
            const response = await this.api.createPost(postData);
            
            // 重新加载帖子列表
            await this.loadPosts();
            this.closeModals();
            
            // 清空表单
            document.getElementById('newPostForm').reset();
            
            alert('发帖成功！');
            console.log('发帖成功:', response.data.post);
            
        } catch (error) {
            console.error('发帖失败:', error);
            alert(error.message || '发帖失败，请稍后重试');
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
                    <h3 style="margin: 0; color: #2563eb; cursor: pointer;" onclick="connectHub.showPostDetail('${post.id}')">${post.title}</h3>
                    <span style="background: #e5e5e5; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${post.category}</span>
                </div>
                <p style="color: #666; margin-bottom: 1rem; line-height: 1.4;">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #666;">
                    <span>by ${post.author}</span>
                    <div style="display: flex; gap: 1rem;">
                        <span><i class="fas fa-thumbs-up"></i> ${post.likes}</span>
                        <span><i class="fas fa-comment"></i> ${post.replies}</span>
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
        
        // 加载评论数据
        this.loadComments(postId);
        
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
                <button class="like-btn ${post.likedBy && post.likedBy.includes(this.currentUser?.username) ? 'liked' : ''}" onclick="connectHub.toggleLike('${post.id}')">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${post.likes}</span>
                </button>
                <button class="btn btn-outline" onclick="connectHub.showCommentForm()">
                    <i class="fas fa-comment"></i>
                    回复
                </button>
                ${this.currentUser && (this.currentUser._id === post.authorId || this.currentUser.username === post.author) ? `
                    <button class="btn btn-danger" onclick="connectHub.deletePost('${post.id}')" style="margin-left: auto;">
                        <i class="fas fa-trash"></i>
                        删除帖子
                    </button>
                ` : ''}
            </div>
        `;
    }

    // 显示首页
    showHomePage() {
        document.getElementById('postDetailPage').classList.add('hidden');
        document.getElementById('searchResultPage').classList.add('hidden');
        document.getElementById('homePage').classList.remove('hidden');
        this.currentPostId = null;
        
        // 清空搜索框
        document.getElementById('searchInput').value = '';
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

    // 删除帖子
    async deletePost(postId) {
        try {
            if (!this.currentUser) {
                alert('请先登录');
                this.showAuthModal('login');
                return;
            }
            
            const post = this.posts.find(p => p.id === postId);
            if (!post) {
                alert('帖子不存在');
                return;
            }
            
            // 调试信息
            console.log('当前用户ID:', this.currentUser._id);
            console.log('当前用户名:', this.currentUser.username);
            console.log('帖子作者ID:', post.authorId);
            console.log('帖子作者名:', post.author);
            console.log('ID权限检查:', post.authorId === this.currentUser._id);
            console.log('用户名权限检查:', post.author === this.currentUser.username);
            
            // 检查权限：只有作者可以删除（同时检查用户ID和用户名）
            const isAuthor = post.authorId === this.currentUser._id || post.author === this.currentUser.username;
            if (!isAuthor) {
                alert(`只有帖子作者可以删除帖子。当前用户: ${this.currentUser.username}, 帖子作者: ${post.author}`);
                return;
            }
            
            // 确认删除
            if (!confirm('确定要删除这个帖子吗？删除后无法恢复。')) {
                return;
            }
            
            // 先测试token是否有效
            console.log('测试API token有效性...');
            try {
                const profileResponse = await this.api.getProfile();
                console.log('Token有效，用户信息:', profileResponse.data.user);
            } catch (tokenError) {
                console.error('Token验证失败:', tokenError);
                alert('登录已过期，请重新登录');
                this.showAuthModal('login');
                return;
            }
            
            // 调用API删除帖子
            console.log('开始调用删除API...');
            await this.api.deletePost(postId);
            
            // 删除成功后返回首页并重新加载帖子列表
            this.showHomePage();
            await this.loadPosts();
            
            alert('帖子删除成功');
            console.log('帖子删除成功:', postId);
            
        } catch (error) {
            console.error('删除帖子失败:', error);
            alert(error.message || '删除帖子失败，请稍后重试');
        }
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
    async handleAddComment() {
        try {
            const commentText = document.getElementById('commentText').value.trim();
            if (!commentText) return;
            
            if (!this.currentUser) {
                alert('请先登录');
                this.showAuthModal('login');
                return;
            }
            
            // 调用API创建评论
            const response = await this.api.createComment(this.currentPostId, {
                content: commentText
            });
            
            // 重新加载评论列表
            await this.loadComments(this.currentPostId);
            this.hideCommentForm();
            
            console.log('评论创建成功:', response.data.comment);
            
        } catch (error) {
            console.error('创建评论失败:', error);
            alert(error.message || '创建评论失败，请稍后重试');
        }
    }

    // 从API加载评论
    async loadComments(postId) {
        try {
            const response = await this.api.getComments(postId);
            this.renderComments(response.data.comments);
            
            // 更新评论数量
            const commentsCount = document.getElementById('commentsCount');
            commentsCount.textContent = response.data.pagination.total;
            
        } catch (error) {
            console.error('加载评论失败:', error);
            this.renderComments([]);
        }
    }

    // 渲染评论
    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">暂无评论，快来发表第一个评论吧！</p>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author.username}</span>
                    <span class="comment-time">${this.formatTime(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
                <div class="comment-actions">
                    <button class="comment-like-btn ${comment.isLikedByUser ? 'liked' : ''}" 
                            onclick="connectHub.toggleCommentLike('${comment._id}')">
                        <i class="fas fa-heart"></i>
                        <span>${comment.likesCount}</span>
                    </button>
                    ${comment.level < 3 ? `<button class="comment-reply-btn" onclick="connectHub.showReplyForm('${comment._id}')">回复</button>` : ''}
                </div>
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="comment-replies">
                        ${comment.replies.map(reply => `
                            <div class="comment-item reply">
                                <div class="comment-header">
                                    <span class="comment-author">${reply.author.username}</span>
                                    <span class="comment-time">${this.formatTime(reply.createdAt)}</span>
                                </div>
                                <div class="comment-content">${reply.content.replace(/\n/g, '<br>')}</div>
                                <div class="comment-actions">
                                    <button class="comment-like-btn ${reply.isLikedByUser ? 'liked' : ''}" 
                                            onclick="connectHub.toggleCommentLike('${reply._id}')">
                                        <i class="fas fa-heart"></i>
                                        <span>${reply.likesCount}</span>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // 切换评论点赞
    async toggleCommentLike(commentId) {
        try {
            if (!this.currentUser) {
                alert('请先登录');
                this.showAuthModal('login');
                return;
            }
            
            const response = await this.api.toggleCommentLike(commentId);
            
            // 重新加载评论以更新点赞状态
            await this.loadComments(this.currentPostId);
            
            console.log('评论点赞状态已更新:', response.data);
            
        } catch (error) {
            console.error('切换评论点赞失败:', error);
            alert(error.message || '操作失败，请稍后重试');
        }
    }

    // 显示回复表单
    showReplyForm(parentCommentId) {
        if (!this.currentUser) {
            alert('请先登录');
            this.showAuthModal('login');
            return;
        }
        
        // 实现回复功能 - 可以在此添加回复表单显示逻辑
        const replyContent = prompt('请输入回复内容:');
        if (replyContent && replyContent.trim()) {
            this.handleReply(parentCommentId, replyContent.trim());
        }
    }

    // 处理回复
    async handleReply(parentCommentId, content) {
        try {
            const response = await this.api.createComment(this.currentPostId, {
                content: content,
                parentComment: parentCommentId
            });
            
            // 重新加载评论列表
            await this.loadComments(this.currentPostId);
            
            console.log('回复创建成功:', response.data.comment);
            
        } catch (error) {
            console.error('创建回复失败:', error);
            alert(error.message || '创建回复失败，请稍后重试');
        }
    }

    // 处理搜索
    async handleSearch() {
        try {
            const searchQuery = document.getElementById('searchInput').value.trim();
            if (!searchQuery) {
                alert('请输入搜索关键词');
                return;
            }
            
            this.currentSearchQuery = searchQuery;
            await this.performSearch(searchQuery);
            this.showSearchResults();
            
        } catch (error) {
            console.error('搜索失败:', error);
            alert('搜索失败，请稍后重试');
        }
    }

    // 执行搜索
    async performSearch(query, searchParams = null) {
        try {
            // 如果没有提供搜索参数，使用默认参数
            const params = searchParams || { q: query };
            
            console.log('实际API调用参数:', params);
            const response = await this.api.searchPosts(params);
            console.log('API返回的帖子数量:', response.data.posts.length);
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            
            this.searchResults = response.data.posts.map(post => ({
                id: post._id,
                title: post.title,
                category: post.category,
                content: post.content,
                author: post.author.username,
                authorId: post.author._id,
                time: post.createdAt,
                replies: post.commentsCount || 0,
                likes: post.likesCount || 0,
                likedBy: post.likes || [],
                relevanceScore: post.relevanceScore || 0,
                highlightedTitle: this.highlightText(post.title, searchTerms),
                highlightedContent: this.highlightText(post.content.substring(0, 200), searchTerms)
            }));
            
            // 如果没有指定排序或者是相关性排序，按相关性排序
            if (!searchParams || !searchParams.sortBy || searchParams.sortBy === 'relevance') {
                this.searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            }
            
        } catch (error) {
            console.error('搜索API调用失败:', error);
            this.searchResults = [];
            throw error;
        }
    }

    // 计算匹配次数
    countMatches(text, terms) {
        return terms.reduce((count, term) => {
            const matches = text.match(new RegExp(term, 'gi'));
            return count + (matches ? matches.length : 0);
        }, 0);
    }

    // 高亮文本
    highlightText(text, terms) {
        let highlightedText = text;
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="search-highlight">$1</span>');
        });
        return highlightedText;
    }

    // 显示搜索结果页面
    showSearchResults() {
        document.getElementById('homePage').classList.add('hidden');
        document.getElementById('postDetailPage').classList.add('hidden');
        document.getElementById('searchResultPage').classList.remove('hidden');
        
        // 更新搜索结果标题和数量
        document.getElementById('searchResultTitle').textContent = `"${this.currentSearchQuery}" 的搜索结果`;
        document.getElementById('searchResultCount').textContent = `找到 ${this.searchResults.length} 个结果`;
        
        // 渲染搜索结果
        this.renderSearchResults();
        
        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    // 渲染搜索结果
    renderSearchResults() {
        const searchResults = document.getElementById('searchResults');
        
        if (this.searchResults.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>未找到相关结果</h3>
                    <p>尝试使用不同的关键词或检查拼写</p>
                </div>
            `;
            return;
        }
        
        searchResults.innerHTML = this.searchResults.map(post => `
            <div class="search-result-item">
                <a href="#" class="search-result-title" onclick="connectHub.showPostDetail('${post.id}'); return false;">
                    ${post.highlightedTitle}
                </a>
                <div class="search-result-meta">
                    <span class="search-result-category">${post.category}</span>
                    <span>作者: ${post.author}</span>
                    <span>${this.formatTime(post.time)}</span>
                </div>
                <div class="search-result-content">
                    ${post.highlightedContent}${post.content.length > 200 ? '...' : ''}
                </div>
                <div class="search-result-stats">
                    <span><i class="fas fa-thumbs-up"></i> ${post.likes} 点赞</span>
                    <span><i class="fas fa-comment"></i> ${post.replies} 评论</span>
                    <span><i class="fas fa-eye"></i> 相关性: ${post.relevanceScore}</span>
                </div>
            </div>
        `).join('');
    }

    // 应用搜索过滤器
    async applySearchFilters() {
        if (!this.currentSearchQuery) return;
        
        try {
            const categoryFilter = document.getElementById('categoryFilter').value;
            const sortFilter = document.getElementById('searchSortFilter').value;
            const authorFilter = document.getElementById('authorFilter').value.trim();
            
            // 构建搜索参数
            const searchParams = { q: this.currentSearchQuery };
            
            if (categoryFilter) {
                searchParams.category = categoryFilter;
            }
            
            if (authorFilter) {
                searchParams.author = authorFilter;
            }
            
            // 设置排序参数
            switch (sortFilter) {
                case 'latest':
                    searchParams.sortBy = 'createdAt';
                    searchParams.sortOrder = 'desc';
                    break;
                case 'popular':
                    searchParams.sortBy = 'likesCount';
                    searchParams.sortOrder = 'desc';
                    break;
                case 'relevance':
                default:
                    searchParams.sortBy = 'createdAt';
                    searchParams.sortOrder = 'desc';
                    break;
            }
            
            // 调试信息
            console.log('搜索参数:', searchParams);
            console.log('当前搜索词:', this.currentSearchQuery);
            
            // 重新搜索
            await this.performSearch(this.currentSearchQuery, searchParams);
            this.renderSearchResults();
            
            // 更新结果计数
            document.getElementById('searchResultCount').textContent = `找到 ${this.searchResults.length} 个结果`;
            console.log('搜索结果数量:', this.searchResults.length);
            
        } catch (error) {
            console.error('应用搜索过滤器失败:', error);
            alert('筛选失败，请稍后重试');
        }
    }

    // 排序搜索结果
    sortSearchResults(sortType, results = null) {
        const resultsToSort = results || this.searchResults;
        
        switch (sortType) {
            case 'latest':
                resultsToSort.sort((a, b) => new Date(b.time) - new Date(a.time));
                break;
            case 'popular':
                resultsToSort.sort((a, b) => b.likes - a.likes);
                break;
            case 'relevance':
            default:
                resultsToSort.sort((a, b) => b.relevanceScore - a.relevanceScore);
                break;
        }
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
        const authContainer = document.querySelector('.nav-auth');

        // 清除旧的事件监听器
        const newAuthContainer = authContainer.cloneNode(true);
        authContainer.parentNode.replaceChild(newAuthContainer, authContainer);
        
        const newLoginBtn = document.getElementById('loginBtn');
        const newRegisterBtn = document.getElementById('registerBtn');
        const newTestLoginBtn = document.getElementById('testLoginBtn');

        if (this.currentUser) {
            newLoginBtn.textContent = this.currentUser.username;
            newRegisterBtn.style.display = 'none';
            // 隐藏测试登录按钮，因为已经登录了
            if (newTestLoginBtn) newTestLoginBtn.style.display = 'none';
            
            newLoginBtn.addEventListener('click', () => this.logout());
        } else {
            newLoginBtn.textContent = '登录';
            newRegisterBtn.textContent = '注册';
            newRegisterBtn.style.display = 'inline-block';
            // 显示测试登录按钮
            if (newTestLoginBtn) newTestLoginBtn.style.display = 'inline-block';
            
            newLoginBtn.addEventListener('click', () => this.showAuthModal('login'));
            newRegisterBtn.addEventListener('click', () => this.showAuthModal('register'));
            // 重新绑定测试登录按钮事件
            if (newTestLoginBtn) {
                newTestLoginBtn.addEventListener('click', () => this.handleTestLogin());
            }
        }
    }

    // 退出登录
    async logout() {
        if (confirm('确定要退出登录吗？')) {
            try {
                await this.api.logout();
                this.currentUser = null;
                this.api.setToken(null);
                this.updateUI();
                alert('已退出登录');
            } catch (error) {
                console.error('登出失败:', error);
                // 即使后端失败，也强制前端登出
                this.currentUser = null;
                this.api.setToken(null);
                this.updateUI();
                alert('登出时发生错误，已在本地强制登出');
            }
        }
    }

    // 从API加载帖子
    async loadPosts() {
        try {
            const response = await this.api.getPosts();
            this.posts = response.data.posts.map(post => ({
                id: post._id,
                title: post.title,
                category: post.category,
                content: post.content,
                author: post.author.username,
                authorId: post.author._id,
                time: post.createdAt,
                replies: post.commentsCount || 0,
                likes: post.likesCount || 0,
                likedBy: post.likes || []
            }));
            this.renderPosts();
        } catch (error) {
            console.error('加载帖子失败:', error);
            const postsList = document.getElementById('postsList');
            postsList.innerHTML = '<p style="color: red;">加载帖子失败，请刷新页面重试。</p>';
        }
    }
}

// 初始化应用
function initApp() {
    window.connectHub = new ConnectHub();
    console.log('ConnectHub应用已初始化');
}

// 确保在DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM已经加载完成
    initApp();
}