const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokenResponse } = require('../utils/jwt');

// 用户注册
const register = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入验证失败',
        errors: errors.array()
      });
    }
    
    const { username, email, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: existingUser.email === email ? '邮箱已被注册' : '用户名已被占用'
      });
    }
    
    // 创建用户
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // 生成token并返回
    const tokenResponse = generateTokenResponse(user);
    
    res.status(201).json({
      status: 'success',
      message: '注册成功',
      data: tokenResponse
    });
    
    console.log(`✅ 新用户注册: ${username} (${email})`);
    
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      status: 'error',
      message: '注册失败，服务器内部错误'
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入验证失败',
        errors: errors.array()
      });
    }
    
    const { username, password } = req.body;
    
    // 查找用户并验证密码
    const user = await User.findByCredentials(username, password);
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    // 生成token并返回
    const tokenResponse = generateTokenResponse(user);
    
    res.json({
      status: 'success',
      message: '登录成功',
      data: tokenResponse
    });
    
    console.log(`✅ 用户登录: ${user.username}`);
    
  } catch (error) {
    console.error('登录失败:', error);
    res.status(401).json({
      status: 'error',
      message: error.message || '登录失败'
    });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('posts', 'title createdAt likesCount commentsCount')
      .populate('comments', 'content createdAt post');
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入验证失败',
        errors: errors.array()
      });
    }
    
    const { username, email, bio, avatar } = req.body;
    const userId = req.user._id;
    
    // 检查用户名和邮箱是否被其他用户占用
    if (username || email) {
      const query = { _id: { $ne: userId } };
      if (username) query.username = username;
      if (email) query.email = email;
      
      const existingUser = await User.findOne(query);
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: existingUser.username === username ? '用户名已被占用' : '邮箱已被注册'
        });
      }
    }
    
    // 更新用户信息
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      message: '用户信息更新成功',
      data: { user }
    });
    
    console.log(`✅ 用户信息更新: ${user.username}`);
    
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新用户信息失败'
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: '输入验证失败',
        errors: errors.array()
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({
      status: 'success',
      message: '密码修改成功'
    });
    
    console.log(`✅ 密码修改: ${user.username}`);
    
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      status: 'error',
      message: '修改密码失败'
    });
  }
};

// 注销（客户端处理）
const logout = (req, res) => {
  res.json({
    status: 'success',
    message: '注销成功'
  });
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};