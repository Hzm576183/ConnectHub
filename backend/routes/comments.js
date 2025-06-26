const express = require('express');
const router = express.Router();

const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike
} = require('../controllers/commentsController');

const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateCreateComment } = require('../middleware/validation');

/**
 * @route   GET /api/comments/post/:postId
 * @desc    获取帖子的评论列表
 * @access  Public
 */
router.get('/post/:postId', optionalAuth, getComments);

/**
 * @route   POST /api/comments/post/:postId
 * @desc    创建评论
 * @access  Private
 */
router.post('/post/:postId', authenticate, validateCreateComment, createComment);

/**
 * @route   PUT /api/comments/:id
 * @desc    更新评论
 * @access  Private (作者或管理员)
 */
router.put('/:id', authenticate, updateComment);

/**
 * @route   DELETE /api/comments/:id
 * @desc    删除评论
 * @access  Private (作者或管理员)
 */
router.delete('/:id', authenticate, deleteComment);

/**
 * @route   POST /api/comments/:id/like
 * @desc    切换评论点赞状态
 * @access  Private
 */
router.post('/:id/like', authenticate, toggleLike);

module.exports = router;