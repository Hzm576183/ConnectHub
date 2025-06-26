// ConnectHub API 客户端
class ConnectHubAPI {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('connecthub_token');
    }

    // 设置认证头
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 设置token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('connecthub_token', token);
        } else {
            localStorage.removeItem('connecthub_token');
        }
    }

    // ===================
    // 认证相关 API
    // ===================

    // 用户注册
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            auth: false
        });
        
        if (response.data?.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    // 用户登录
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            auth: false
        });
        
        if (response.data?.token) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    // 获取用户信息
    async getProfile() {
        return await this.request('/auth/profile');
    }

    // 更新用户信息
    async updateProfile(userData) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // 修改密码
    async changePassword(passwordData) {
        return await this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    // 注销
    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST'
        });
        this.setToken(null);
        return response;
    }

    // ===================
    // 帖子相关 API
    // ===================

    // 获取帖子列表
    async getPosts(params = {}) {
        const searchParams = new URLSearchParams(params);
        return await this.request(`/posts?${searchParams}`, { auth: false });
    }

    // 获取帖子详情
    async getPost(id) {
        return await this.request(`/posts/${id}`, { auth: false });
    }

    // 创建帖子
    async createPost(postData) {
        return await this.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    // 更新帖子
    async updatePost(id, postData) {
        return await this.request(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    // 删除帖子
    async deletePost(id) {
        return await this.request(`/posts/${id}`, {
            method: 'DELETE'
        });
    }

    // 切换点赞
    async togglePostLike(id) {
        return await this.request(`/posts/${id}/like`, {
            method: 'POST'
        });
    }

    // 搜索帖子
    async searchPosts(params = {}) {
        const searchParams = new URLSearchParams(params);
        return await this.request(`/posts/search?${searchParams}`, { auth: false });
    }

    // ===================
    // 评论相关 API
    // ===================

    // 获取帖子的评论
    async getComments(postId, params = {}) {
        const searchParams = new URLSearchParams(params);
        return await this.request(`/comments/post/${postId}?${searchParams}`, { auth: false });
    }

    // 创建评论
    async createComment(postId, commentData) {
        return await this.request(`/comments/post/${postId}`, {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }

    // 更新评论
    async updateComment(id, commentData) {
        return await this.request(`/comments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(commentData)
        });
    }

    // 删除评论
    async deleteComment(id) {
        return await this.request(`/comments/${id}`, {
            method: 'DELETE'
        });
    }

    // 切换评论点赞
    async toggleCommentLike(id) {
        return await this.request(`/comments/${id}/like`, {
            method: 'POST'
        });
    }

    // ===================
    // 用户相关 API
    // ===================

    // 获取用户列表
    async getUsers(params = {}) {
        const searchParams = new URLSearchParams(params);
        return await this.request(`/users?${searchParams}`, { auth: false });
    }

    // 获取用户详情
    async getUser(username) {
        return await this.request(`/users/${username}`, { auth: false });
    }

    // 获取用户的帖子
    async getUserPosts(username, params = {}) {
        const searchParams = new URLSearchParams(params);
        return await this.request(`/users/${username}/posts?${searchParams}`, { auth: false });
    }

    // 获取用户的评论
    async getUserComments(username, params = {}) {
        const searchParams = new URLSearchParams(params);
        return await this.request(`/users/${username}/comments?${searchParams}`, { auth: false });
    }

    // ===================
    // 健康检查
    // ===================

    // 检查API状态
    async healthCheck() {
        return await this.request('/health', { auth: false });
    }
}

// 导出单例实例
window.connectHubAPI = new ConnectHubAPI();