const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '标题不能为空'],
    trim: true,
    minlength: [5, '标题至少5个字符'],
    maxlength: [100, '标题最多100个字符']
  },
  content: {
    type: String,
    required: [true, '内容不能为空'],
    minlength: [10, '内容至少10个字符'],
    maxlength: [5000, '内容最多5000个字符']
  },
  category: {
    type: String,
    required: [true, '分类不能为空'],
    enum: {
      values: ['技术', '生活', '问答', '闲聊', '公告'],
      message: '分类必须是: 技术, 生活, 问答, 闲聊, 公告 中的一个'
    }
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, '作者不能为空']
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签最多20个字符']
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
postSchema.index({ title: 'text', content: 'text' }); // 全文搜索
postSchema.index({ author: 1 });
postSchema.index({ category: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ lastActivity: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });

// 虚拟字段
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  options: { sort: { createdAt: -1 } }
});

// 虚拟字段：是否被当前用户点赞
postSchema.virtual('isLikedByUser');

// 中间件：填充作者信息
postSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'username avatar role'
  });
  next();
});

// 实例方法：切换点赞状态
postSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => 
    like.user.toString() === userId.toString()
  );
  
  if (likeIndex > -1) {
    // 取消点赞
    this.likes.splice(likeIndex, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
    return false;
  } else {
    // 添加点赞
    this.likes.push({ user: userId });
    this.likesCount += 1;
    return true;
  }
};

// 实例方法：检查是否被用户点赞
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// 静态方法：搜索帖子
postSchema.statics.searchPosts = async function(query, options = {}) {
  const {
    category,
    author,
    sortBy = 'createdAt',
    sortOrder = -1,
    page = 1,
    limit = 10
  } = options;
  
  const searchQuery = { isActive: true };
  
  // 改进的搜索逻辑 - 支持标题和内容的模糊匹配
  if (query) {
    const searchTerms = query.trim().split(/\s+/); // 按空格分割搜索词
    const regexQueries = searchTerms.map(term => ({
      $or: [
        { title: { $regex: term, $options: 'i' } },
        { content: { $regex: term, $options: 'i' } }
      ]
    }));
    
    // 所有搜索词都要匹配（AND逻辑）
    if (regexQueries.length > 1) {
      searchQuery.$and = regexQueries;
    } else {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ];
    }
  }
  
  // 分类筛选
  if (category) {
    searchQuery.category = category;
  }
  
  // 作者筛选 - 支持用户名和用户ID
  if (author) {
    if (mongoose.Types.ObjectId.isValid(author)) {
      // 按ID搜索
      searchQuery.author = author;
    } else {
      // 按用户名搜索，先查找用户
      const User = mongoose.model('User');
      const users = await User.find({ 
        username: { $regex: author, $options: 'i' } 
      }).select('_id');
      
      if (users.length > 0) {
        searchQuery.author = { $in: users.map(user => user._id) };
      } else {
        // 如果没找到用户，返回空结果
        searchQuery.author = new mongoose.Types.ObjectId();
      }
    }
  }
  
  const sort = {};
  sort[sortBy] = sortOrder;
  
  // 置顶帖子优先
  if (sortBy !== 'isPinned') {
    sort.isPinned = -1;
  }
  
  return this.find(searchQuery)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// 更新最后活动时间
postSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

module.exports = mongoose.model('Post', postSchema);