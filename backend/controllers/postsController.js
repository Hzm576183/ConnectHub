const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

// 获取帖子列表
const getPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // 构建查询条件
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (author) {
      const user = await User.findOne({ username: author });
      if (user) {
        query.author = user._id;
      } else {
        return res.json({
          status: 'success',
          data: {
            posts: [],
            pagination: {
              current: pageNum,
              pages: 0,
              total: 0
            }
          }
        });
      }
    }
    
    // 全文搜索
    if (search) {
      query.$text = { $search: search };
    }
    
    // 排序
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // 置顶帖子优先
    if (sortBy !== 'isPinned') {
      sort.isPinned = -1;
    }
    
    // 查询帖子
    const posts = await Post.find(query)
      .populate('comments')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // 获取总数
    const total = await Post.countDocuments(query);
    const pages = Math.ceil(total / limitNum);
    
    // 如果有当前用户，添加点赞状态
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
    console.error('获取帖子列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取帖子列表失败'
    });
  }
};

// 获取单个帖子详情
const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id)
      .populate('comments')
      .lean();
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '帖子不存在'
      });
    }
    
    // 增加浏览量
    await Post.findByIdAndUpdate(id, {
      $inc: { viewsCount: 1 }
    });
    
    // 添加当前用户的点赞状态
    if (req.user) {
      post.isLikedByUser = post.likes.some(like => 
        like.user.toString() === req.user._id.toString()
      );
    }
    
    res.json({
      status: 'success',
      data: { post }
    });
    
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取帖子详情失败'
    });
  }
};

// 创建帖子
const createPost = async (req, res) => {
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
    
    const { title, content, category, tags = [] } = req.body;
    
    // 创建帖子
    const post = new Post({
      title,
      content,
      category,
      tags,
      author: req.user._id
    });
    
    await post.save();
    
    // 更新用户帖子数量
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postsCount: 1 }
    });
    
    // 填充作者信息
    await post.populate('author', 'username avatar role');
    
    res.status(201).json({
      status: 'success',
      message: '帖子创建成功',
      data: { post }
    });
    
    console.log(`✅ 新帖子创建: ${title} by ${req.user.username}`);
    
  } catch (error) {
    console.error('创建帖子失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建帖子失败'
    });
  }
};

// 更新帖子
const updatePost = async (req, res) => {
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
    
    const { id } = req.params;
    const updateData = req.body;
    
    const post = await Post.findById(id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '帖子不存在'
      });
    }
    
    // 检查权限（只有作者和管理员可以编辑）
    if (post.author.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: '无权编辑此帖子'
      });
    }
    
    // 更新帖子
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      message: '帖子更新成功',
      data: { post: updatedPost }
    });
    
    console.log(`✅ 帖子更新: ${updatedPost.title} by ${req.user.username}`);
    
  } catch (error) {
    console.error('更新帖子失败:', error);
    res.status(500).json({
      status: 'error',
      message: '更新帖子失败'
    });
  }
};

// 删除帖子（软删除）
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '帖子不存在'
      });
    }
    
    // 调试信息
    console.log('后端删除权限检查:');
    console.log('帖子作者:', post.author);
    console.log('帖子作者ID:', post.author._id ? post.author._id.toString() : post.author.toString());
    console.log('当前用户ID:', req.user._id.toString());
    console.log('用户角色:', req.user.role);
    
    // 检查权限 - 处理populate的author对象
    const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
    const isAuthor = authorId === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    console.log('权限检查结果:', isAuthor);
    console.log('最终权限判断:', { isAuthor, isAdmin });
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: '无权删除此帖子'
      });
    }
    
    // 软删除
    await Post.findByIdAndUpdate(id, { isActive: false });
    
    // 更新用户帖子数量
    await User.findByIdAndUpdate(post.author, {
      $inc: { postsCount: -1 }
    });
    
    res.json({
      status: 'success',
      message: '帖子删除成功'
    });
    
    console.log(`✅ 帖子删除: ${post.title} by ${req.user.username}`);
    
  } catch (error) {
    console.error('删除帖子失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除帖子失败'
    });
  }
};

// 切换帖子点赞状态
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await Post.findById(id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: '帖子不存在'
      });
    }
    
    // 切换点赞状态
    const isLiked = post.toggleLike(req.user._id);
    await post.save();
    
    // 更新作者的获赞数
    const likesReceived = await Post.aggregate([
      { $match: { author: post.author, isActive: true } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);
    
    const totalLikes = likesReceived[0]?.total || 0;
    await User.findByIdAndUpdate(post.author, {
      likesReceived: totalLikes
    });
    
    res.json({
      status: 'success',
      message: isLiked ? '点赞成功' : '取消点赞',
      data: {
        isLiked,
        likesCount: post.likesCount
      }
    });
    
  } catch (error) {
    console.error('切换点赞失败:', error);
    res.status(500).json({
      status: 'error',
      message: '操作失败'
    });
  }
};

// 搜索帖子
const searchPosts = async (req, res) => {
  try {
    const {
      q: query,
      category,
      author,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    if (!query && !category && !author) {
      return res.status(400).json({
        status: 'error',
        message: '请提供搜索条件'
      });
    }
    
    const options = {
      category,
      author,
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const posts = await Post.searchPosts(query, options);
    
    // 构建与搜索相同的查询条件来计算总数
    const countQuery = { isActive: true };
    
    if (query) {
      const searchTerms = query.trim().split(/\s+/);
      const regexQueries = searchTerms.map(term => ({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { content: { $regex: term, $options: 'i' } }
        ]
      }));
      
      if (regexQueries.length > 1) {
        countQuery.$and = regexQueries;
      } else {
        countQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } }
        ];
      }
    }
    
    if (category) {
      countQuery.category = category;
    }
    
    if (author) {
      if (mongoose.Types.ObjectId.isValid(author)) {
        countQuery.author = author;
      } else {
        const User = require('../models/User');
        const users = await User.find({ 
          username: { $regex: author, $options: 'i' } 
        }).select('_id');
        
        if (users.length > 0) {
          countQuery.author = { $in: users.map(user => user._id) };
        } else {
          countQuery.author = new mongoose.Types.ObjectId();
        }
      }
    }
    
    const total = await Post.countDocuments(countQuery);
    
    const pages = Math.ceil(total / options.limit);
    
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
          current: options.page,
          pages,
          total,
          hasNext: options.page < pages,
          hasPrev: options.page > 1
        },
        searchQuery: query
      }
    });
    
  } catch (error) {
    console.error('搜索帖子失败:', error);
    res.status(500).json({
      status: 'error',
      message: '搜索失败'
    });
  }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  searchPosts
};