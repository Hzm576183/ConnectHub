# ConnectHub

一个现代化的社区论坛平台，提供完整的用户讨论和内容分享体验。

## ✨ 功能特色

### 🔐 用户系统
- 用户注册与登录
- JWT身份验证
- 个人信息管理
- 权限控制

### 📝 帖子管理
- 分类发帖（技术、生活、问答、闲聊）
- 帖子详情页面
- 帖子删除（仅作者可删除）
- 点赞功能
- 按时间/热度排序

### 💬 评论系统
- 多级回复（最多3级）
- 评论点赞
- 实时评论加载
- 嵌套回复显示

### 🔍 高级搜索
- 全文搜索（标题和内容）
- 按分类筛选
- 按作者搜索
- 多种排序方式（相关性、最新、热门）
- 关键词高亮显示

### 📱 用户体验
- 响应式设计，适配各种设备
- 现代化UI界面
- 实时数据更新
- 友好的错误提示

## 🛠️ 技术栈

### 前端
- **HTML5** + **CSS3** + **JavaScript (ES6+)**
- 响应式设计
- Font Awesome图标库

### 后端
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** 身份验证
- RESTful API设计

### 开发工具
- Git版本控制
- Nodemon热重载

## 🚀 快速开始

### 环境要求
- Node.js (v14+ 推荐)
- MongoDB (本地安装或云数据库)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/Hzm576183/ConnectHub.git
cd ConnectHub
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **环境配置**
```bash
# 在backend目录下创建.env文件
cp .env.example .env
```

编辑 `.env` 文件：
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/connecthub
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. **启动服务**
```bash
# 启动后端服务
cd backend
npm run dev

# 前端直接用浏览器打开 index.html
# 或使用Live Server等工具
```

5. **访问应用**
- 前端: 打开 `index.html` 文件
- 后端API: http://localhost:3001/api

## 📱 功能演示

### 🔐 用户功能
- 用户注册与登录
- JWT身份验证
- 自动登录（Token记忆）
- 安全退出

### 📝 帖子功能
- 发布新帖子（支持4种分类）
- 查看帖子详情
- 删除自己的帖子
- 帖子点赞功能
- 多种排序方式

### 💬 评论互动
- 发表评论
- 多级回复（最多3层）
- 评论点赞
- 实时评论更新

### 🔍 搜索功能
- 关键词搜索
- 分类筛选
- 作者筛选
- 排序选择
- 结果高亮

## 📁 项目结构

```
ConnectHub/
├── index.html              # 前端主页面
├── test.html              # 测试页面
├── assets/
│   ├── css/
│   │   └── style.css      # 前端样式
│   └── js/
│       ├── app.js         # 主要业务逻辑
│       └── api.js         # API客户端
├── backend/
│   ├── server.js          # 服务器入口
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   │   ├── authController.js
│   │   ├── postsController.js
│   │   └── commentsController.js
│   ├── models/            # 数据模型
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/            # 路由定义
│   ├── middleware/        # 中间件
│   └── utils/             # 工具函数
└── README.md              # 项目说明
```

## 🔧 API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `POST /api/auth/logout` - 用户登出

### 帖子接口
- `GET /api/posts` - 获取帖子列表
- `GET /api/posts/:id` - 获取帖子详情
- `POST /api/posts` - 创建帖子
- `DELETE /api/posts/:id` - 删除帖子
- `POST /api/posts/:id/like` - 切换点赞
- `GET /api/posts/search` - 搜索帖子

### 评论接口
- `GET /api/comments/post/:postId` - 获取评论列表
- `POST /api/comments/post/:postId` - 创建评论
- `PUT /api/comments/:id` - 更新评论
- `DELETE /api/comments/:id` - 删除评论
- `POST /api/comments/:id/like` - 切换评论点赞

## 🔧 未来计划

- [ ] 用户头像上传功能
- [ ] 私信系统
- [ ] 帖子收藏功能
- [ ] 用户关注系统
- [ ] 消息通知功能
- [ ] 管理员后台
- [ ] 数据统计面板
- [ ] 移动端App开发

## 📄 开源协议

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！