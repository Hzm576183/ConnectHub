const express = require('express');
const router = express.Router();

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  searchPosts
} = require('../controllers/postsController');

const { authenticate, optionalAuth, checkOwnership } = require('../middleware/auth');
const { validateCreatePost, validateUpdatePost } = require('../middleware/validation');
const Post = require('../models/Post');

/**
 * @route   GET /api/posts
 * @desc    获取帖子列表
 * @access  Public
 */
router.get('/', optionalAuth, getPosts);

/**
 * @route   GET /api/posts/search
 * @desc    搜索帖子
 * @access  Public
 */
router.get('/search', optionalAuth, searchPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    获取单个帖子详情
 * @access  Public
 */
router.get('/:id', optionalAuth, getPost);

/**
 * @route   POST /api/posts
 * @desc    创建帖子
 * @access  Private
 */
router.post('/', authenticate, validateCreatePost, createPost);

/**
 * @route   PUT /api/posts/:id
 * @desc    更新帖子
 * @access  Private (作者或管理员)
 */
router.put('/:id', authenticate, validateUpdatePost, updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    删除帖子
 * @access  Private (作者或管理员)
 */
router.delete('/:id', authenticate, deletePost);

/**
 * @route   POST /api/posts/:id/like
 * @desc    切换帖子点赞状态
 * @access  Private
 */
router.post('/:id/like', authenticate, toggleLike);

module.exports = router;