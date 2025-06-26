# ConnectHub 后端 API

ConnectHub 论坛的后端 API 服务，基于 Node.js + Express + MongoDB 构建。

## 功能特性

- 🔐 **用户认证**: JWT 身份验证，注册/登录/个人资料管理
- 📝 **帖子管理**: 创建、编辑、删除、点赞、搜索帖子
- 💬 **评论系统**: 多级嵌套评论，评论点赞
- 🔍 **全文搜索**: 基于 MongoDB 的全文搜索
- 👥 **用户系统**: 用户资料、统计信息
- 🛡️ **安全防护**: 速率限制、输入验证、XSS 防护
- 📊 **数据统计**: 帖子数、评论数、点赞数统计

## 技术栈

- **运行时**: Node.js 16+
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT (jsonwebtoken)
- **验证**: express-validator
- **安全**: helmet, cors, bcryptjs
- **日志**: morgan

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 环境配置

复制环境配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息。

### 3. 启动数据库

确保 MongoDB 服务正在运行：
```bash
# macOS (使用 Homebrew)
brew services start mongodb-community

# 或者直接启动
mongod
```

### 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 http://localhost:5000 启动。

## API 文档

### 认证相关

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 帖子相关

#### 获取帖子列表
```http
GET /api/posts?page=1&limit=10&category=技术&sortBy=createdAt&sortOrder=desc
```

#### 获取帖子详情
```http
GET /api/posts/:id
```

#### 创建帖子
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "帖子标题",
  "content": "帖子内容",
  "category": "技术",
  "tags": ["JavaScript", "Node.js"]
}
```

#### 搜索帖子
```http
GET /api/posts/search?q=关键词&category=技术&page=1&limit=10
```

#### 点赞帖子
```http
POST /api/posts/:id/like
Authorization: Bearer <token>
```

### 评论相关

#### 获取帖子评论
```http
GET /api/comments/post/:postId?page=1&limit=20
```

#### 创建评论
```http
POST /api/comments/post/:postId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "评论内容",
  "parentComment": "parent_comment_id"  // 可选，用于回复评论
}
```

#### 点赞评论
```http
POST /api/comments/:id/like
Authorization: Bearer <token>
```

### 用户相关

#### 获取用户列表
```http
GET /api/users?page=1&limit=20&sortBy=createdAt
```

#### 获取用户详情
```http
GET /api/users/:username
```

#### 获取用户帖子
```http
GET /api/users/:username/posts?page=1&limit=10
```

## 数据模型

### 用户 (User)
- username: 用户名
- email: 邮箱
- password: 密码（加密）
- avatar: 头像 URL
- bio: 个人简介
- role: 角色 (user/moderator/admin)
- postsCount: 帖子数量
- commentsCount: 评论数量
- likesReceived: 获得点赞数

### 帖子 (Post)
- title: 标题
- content: 内容
- category: 分类
- author: 作者 (关联 User)
- likes: 点赞列表
- likesCount: 点赞数量
- commentsCount: 评论数量
- viewsCount: 浏览次数
- tags: 标签数组
- isPinned: 是否置顶

### 评论 (Comment)
- content: 内容
- author: 作者 (关联 User)
- post: 关联帖子 (关联 Post)
- parentComment: 父评论 (关联 Comment)
- likes: 点赞列表
- likesCount: 点赞数量
- level: 嵌套层级

## 部署说明

### 环境变量

生产环境需要设置以下环境变量：

```bash
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/connecthub
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "connecthub-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs connecthub-api
```

### Docker 部署

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

## 开发说明

### 目录结构

```
backend/
├── config/           # 配置文件
├── controllers/      # 控制器
├── middleware/       # 中间件
├── models/          # 数据模型
├── routes/          # 路由
├── utils/           # 工具函数
├── server.js        # 主服务器文件
├── package.json     # 依赖配置
└── .env            # 环境变量
```

### 代码规范

- 使用 ES6+ 语法
- 异步操作使用 async/await
- 错误处理使用 try-catch
- 输入验证使用 express-validator
- 数据库操作使用 Mongoose

## 许可证

MIT License