const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// 获取帖子的评论列表
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '帖子不存在'
      });
    }
    
    // 获取评论树结构
    const comments = await Comment.getCommentTree(postId);
    
    // 添加当前用户的点赞状态
    if (req.user) {
      const addLikeStatus = (commentList) => {
        commentList.forEach(comment => {
          comment.isLikedByUser = comment.likes.some(like => 
            like.user.toString() === req.user._id.toString()
          );
          if (comment.replies && comment.replies.length > 0) {
            addLikeStatus(comment.replies);
          }
        });
      };
      addLikeStatus(comments);
    }
    
    // 分页处理（仅对顶级评论分页）
    const total = comments.length;
    const paginatedComments = comments.slice(skip, skip + limitNum);
    const pages = Math.ceil(total / limitNum);
    
    res.json({
      status: 'success',
      data: {
        comments: paginatedComments,
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
    console.error('获取评论列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取评论列表失败'
    });
  }
};

// 创建评论
const createComment = async (req, res) => {
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
    
    const { postId } = req.params;
    const { content, parentComment } = req.body;
    
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '帖子不存在'
      });
    }
    
    // 检查父评论是否存在（如果有）
    let level = 0;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || !parent.isActive) {
        return res.status(404).json({
          status: 'error',
          message: '父评论不存在'
        });
      }
      
      if (parent.post.toString() !== postId) {
        return res.status(400).json({
          status: 'error',
          message: '父评论不属于当前帖子'
        });
      }
      
      level = parent.level + 1;
      if (level > 3) {
        return res.status(400).json({
          status: 'error',
          message: '评论嵌套层级不能超过3级'
        });
      }
    }
    
    // 创建评论
    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentComment || null,
      level
    });
    
    await comment.save();
    
    // 填充作者信息
    await comment.populate('author', 'username avatar role');
    
    res.status(201).json({
      status: 'success',
      message: '评论创建成功',
      data: { comment }
    });
    
    console.log(`✅ 新评论创建: ${content.substring(0, 50)}... by ${req.user.username}`);
    
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建评论失败'
    });
  }
};

// 更新评论
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '评论内容不能为空'
      });
    }
    
    const comment = await Comment.findById(id);
    
    if (!comment || !comment.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '评论不存在'
      });
    }
    
    // 检查权限
    if (comment.author.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: '无权编辑此评论'
      });
    }
    
    // 更新评论
    comment.content = content.trim();
    await comment.save();
    
    res.json({
      status: 'success',
      message: '评论更新成功',
      data: { comment }
    });
    
    console.log(`✅ 评论更新: ${comment.content.substring(0, 50)}... by ${req.user.username}`);
    
  } catch (error) {
    console.error('更新评论失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新评论失败'
    });
  }
};

// 删除评论（软删除）
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id);
    
    if (!comment || !comment.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '评论不存在'
      });
    }
    
    // 检查权限
    if (comment.author.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: '无权删除此评论'
      });
    }
    
    // 软删除
    await Comment.findByIdAndUpdate(id, { isActive: false });
    
    res.json({
      status: 'success',
      message: '评论删除成功'
    });
    
    console.log(`✅ 评论删除: ${comment.content.substring(0, 50)}... by ${req.user.username}`);
    
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除评论失败'
    });
  }
};

// 切换评论点赞状态
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findById(id);
    
    if (!comment || !comment.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '评论不存在'
      });
    }
    
    // 切换点赞状态
    const isLiked = comment.toggleLike(req.user._id);
    await comment.save();
    
    res.json({
      status: 'success',
      message: isLiked ? '点赞成功' : '取消点赞',
      data: {
        isLiked,
        likesCount: comment.likesCount
      }
    });
    
  } catch (error) {
    console.error('切换评论点赞失败:', error);
    res.status(500).json({
      status: 'error',
      message: '操作失败'
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike
};