const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { optionalAuth, authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    获取用户列表
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const users = await User.find({ isActive: true })
      .select('username avatar bio role postsCount commentsCount likesReceived createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    const total = await User.countDocuments({ isActive: true });
    const pages = Math.ceil(total / limitNum);
    
    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          current: pageNum,
          pages,
          total,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1
        }
      }
    });
    
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户列表失败'
    });
  }
});

/**
 * @route   GET /api/users/:username
 * @desc    获取用户详情
 * @access  Public
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username, isActive: true })
      .select('username avatar bio role postsCount commentsCount likesReceived createdAt lastLogin');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: { user }
    });
    
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户详情失败'
    });
  }
});

/**
 * @route   GET /api/users/:username/posts
 * @desc    获取用户的帖子列表
 * @access  Public
 */
router.get('/:username/posts', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const posts = await Post.find({ author: user._id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await Post.countDocuments({ author: user._id, isActive: true });
    const pages = Math.ceil(total / limitNum);
    
    // 添加当前用户的点赞状态
    if (req.user) {
      posts.forEach(post => {
        post.isLikedByUser = post.likes.some(like => 
          like.user.toString() === req.user._id.toString()
        );
      });
    }
    
    res.json({
      status: 'success',
      data: {
        posts,
        pagination: {
          current: pageNum,
          pages,
          total,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1
        }
      }
    });
    
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户帖子失败'
    });
  }
});

/**
 * @route   GET /api/users/:username/comments
 * @desc    获取用户的评论列表
 * @access  Public
 */
router.get('/:username/comments', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const comments = await Comment.find({ author: user._id, isActive: true })
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Comment.countDocuments({ author: user._id, isActive: true });
    const pages = Math.ceil(total / limitNum);
    
    res.json({
      status: 'success',
      data: {
        comments,
        pagination: {
          current: pageNum,
          pages,
          total,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1
        }
      }
    });
    
  } catch (error) {
    console.error('获取用户评论失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户评论失败'
    });
  }
});

module.exports = router;