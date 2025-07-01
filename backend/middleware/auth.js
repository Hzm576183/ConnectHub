const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '访问被拒绝，需要提供认证令牌'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '令牌无效，用户不存在'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: '账户已被禁用'
      });
    }
    
    req.user = user;
    console.log('认证成功 - 用户:', user.username, 'ID:', user._id.toString());
    next();
  } catch (error) {
    console.error('认证失败:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: '令牌格式错误'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: '令牌已过期'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
};

// 可选认证（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时继续执行，不返回错误
    next();
  }
};

// 授权检查
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: '请先登录'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: '权限不足'
      });
    }
    
    next();
  };
};

// 检查资源所有权
const checkOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: '资源不存在'
        });
      }
      
      // 管理员和资源所有者可以访问
      if (req.user.role === 'admin' || 
          resource.author.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }
      
      res.status(403).json({
        status: 'error',
        message: '无权访问此资源'
      });
    } catch (error) {
      console.error('权限检查失败:', error);
      res.status(500).json({
        status: 'error',
        message: '服务器内部错误'
      });
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership
};