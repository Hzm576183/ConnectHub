const { body } = require('express-validator');

// 用户注册验证
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度必须在2-20个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  
  body('email')
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字')
];

// 用户登录验证
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名或邮箱不能为空'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 更新用户信息验证
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('用户名长度必须在2-20个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('个人简介最多200个字符'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像必须是有效的URL')
];

// 修改密码验证
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少6个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含字母和数字')
];

// 创建帖子验证
const validateCreatePost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('标题长度必须在5-100个字符之间'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('内容长度必须在10-5000个字符之间'),
  
  body('category')
    .isIn(['技术', '生活', '问答', '闲聊', '公告'])
    .withMessage('分类必须是: 技术, 生活, 问答, 闲聊, 公告 中的一个'),
  
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('标签最多5个'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('每个标签长度必须在1-20个字符之间')
];

// 更新帖子验证
const validateUpdatePost = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('标题长度必须在5-100个字符之间'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('内容长度必须在10-5000个字符之间'),
  
  body('category')
    .optional()
    .isIn(['技术', '生活', '问答', '闲聊', '公告'])
    .withMessage('分类必须是: 技术, 生活, 问答, 闲聊, 公告 中的一个'),
  
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('标签最多5个'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('每个标签长度必须在1-20个字符之间')
];

// 创建评论验证
const validateCreateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('评论内容长度必须在1-1000个字符之间'),
  
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('父评论ID格式不正确')
];

// 搜索验证
const validateSearch = [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('搜索关键词长度必须在1-100个字符之间'),
  
  body('category')
    .optional()
    .isIn(['技术', '生活', '问答', '闲聊', '公告'])
    .withMessage('分类筛选值无效'),
  
  body('sortBy')
    .optional()
    .isIn(['createdAt', 'likesCount', 'commentsCount', 'viewsCount'])
    .withMessage('排序字段无效'),
  
  body('sortOrder')
    .optional()
    .isIn(['asc', 'desc', '1', '-1'])
    .withMessage('排序方向无效'),
  
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('每页数量必须在1-50之间')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateCreatePost,
  validateUpdatePost,
  validateCreateComment,
  validateSearch
};