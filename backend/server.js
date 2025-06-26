const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// 安全中间件
app.use(helmet());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use(limiter);

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 日志中间件
app.use(morgan('combined'));

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 连接成功');
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败:', error);
  process.exit(1);
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/users', require('./routes/users'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'ConnectHub API 运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: '接口不存在'
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('❌ 服务器错误:', error);
  
  res.status(error.status || 500).json({
    status: 'error',
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📡 API地址: http://localhost:${PORT}/api`);
});