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
                <button class="like-btn ${post.likedBy && post.likedBy.includes(this.currentUser?.username) ? 'liked' : ''}" onclick="connectHub.toggleLike('${post.id}')">
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

    // 处理搜索
    handleSearch() {
        const searchQuery = document.getElementById('searchInput').value.trim();
        if (!searchQuery) {
            alert('请输入搜索关键词');
            return;
        }
        
        this.currentSearchQuery = searchQuery;
        this.performSearch(searchQuery);
        this.showSearchResults();
    }

    // 执行搜索
    performSearch(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        this.searchResults = this.posts.filter(post => {
            const searchContent = `${post.title} ${post.content} ${post.author}`.toLowerCase();
            return searchTerms.some(term => searchContent.includes(term));
        }).map(post => {
            // 计算相关性分数
            const titleMatches = this.countMatches(post.title.toLowerCase(), searchTerms);
            const contentMatches = this.countMatches(post.content.toLowerCase(), searchTerms);
            const authorMatches = this.countMatches(post.author.toLowerCase(), searchTerms);
            
            const relevanceScore = titleMatches * 3 + contentMatches * 2 + authorMatches * 1;
            
            return {
                ...post,
                relevanceScore,
                highlightedTitle: this.highlightText(post.title, searchTerms),
                highlightedContent: this.highlightText(post.content.substring(0, 200), searchTerms)
            };
        });
        
        // 默认按相关性排序
        this.sortSearchResults('relevance');
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
                    <span><i class="fas fa-comment"></i> ${this.getCommentsCount(post.id)} 评论</span>
                    <span><i class="fas fa-eye"></i> 相关性: ${post.relevanceScore}</span>
                </div>
            </div>
        `).join('');
    }

    // 应用搜索过滤器
    applySearchFilters() {
        if (this.searchResults.length === 0) return;
        
        const categoryFilter = document.getElementById('categoryFilter').value;
        const sortFilter = document.getElementById('searchSortFilter').value;
        const authorFilter = document.getElementById('authorFilter').value.trim().toLowerCase();
        
        // 应用过滤器
        let filteredResults = [...this.searchResults];
        
        if (categoryFilter) {
            filteredResults = filteredResults.filter(post => post.category === categoryFilter);
        }
        
        if (authorFilter) {
            filteredResults = filteredResults.filter(post => 
                post.author.toLowerCase().includes(authorFilter)
            );
        }
        
        // 应用排序
        this.sortSearchResults(sortFilter, filteredResults);
        
        // 更新显示
        this.searchResults = filteredResults;
        this.renderSearchResults();
        document.getElementById('searchResultCount').textContent = `找到 ${filteredResults.length} 个结果`;
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

        if (this.currentUser) {
            newLoginBtn.textContent = this.currentUser.username;
            newRegisterBtn.style.display = 'none';
            
            newLoginBtn.addEventListener('click', () => this.logout());
        } else {
            newLoginBtn.textContent = '登录';
            newRegisterBtn.textContent = '注册';
            newRegisterBtn.style.display = 'inline-block';
            
            newLoginBtn.addEventListener('click', () => this.showAuthModal('login'));
            newRegisterBtn.addEventListener('click', () => this.showAuthModal('register'));
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
                time: post.createdAt,
                replies: post.comments.length,
                likes: post.likes.length,
                likedBy: post.likes
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