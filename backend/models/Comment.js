const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true,
    minlength: [1, '评论至少1个字符'],
    maxlength: [1000, '评论最多1000个字符']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, '评论作者不能为空']
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: [true, '关联帖子不能为空']
  },
  parentComment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment',
    default: null // null表示顶级评论
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
  repliesCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    default: 0, // 0为顶级评论，1为一级回复，2为二级回复等
    max: 3 // 最多支持3级嵌套
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ createdAt: -1 });

// 虚拟字段：子评论
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  options: { sort: { createdAt: 1 } }
});

// 中间件：填充作者信息
commentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'username avatar role'
  });
  next();
});

// 保存后更新帖子的评论数和最后活动时间
commentSchema.post('save', async function() {
  try {
    const Post = mongoose.model('Post');
    const User = mongoose.model('User');
    
    // 更新帖子评论数
    const commentsCount = await mongoose.model('Comment').countDocuments({
      post: this.post,
      isActive: true
    });
    
    await Post.findByIdAndUpdate(this.post, {
      commentsCount,
      lastActivity: new Date()
    });
    
    // 更新用户评论数
    const userCommentsCount = await mongoose.model('Comment').countDocuments({
      author: this.author,
      isActive: true
    });
    
    await User.findByIdAndUpdate(this.author, {
      commentsCount: userCommentsCount
    });
    
    // 如果是回复评论，更新父评论的回复数
    if (this.parentComment) {
      const repliesCount = await mongoose.model('Comment').countDocuments({
        parentComment: this.parentComment,
        isActive: true
      });
      
      await mongoose.model('Comment').findByIdAndUpdate(this.parentComment, {
        repliesCount
      });
    }
  } catch (error) {
    console.error('更新评论统计失败:', error);
  }
});

// 删除后更新统计
commentSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.isActive === false) {
    try {
      const Post = mongoose.model('Post');
      const User = mongoose.model('User');
      
      // 更新帖子评论数
      const commentsCount = await mongoose.model('Comment').countDocuments({
        post: doc.post,
        isActive: true
      });
      
      await Post.findByIdAndUpdate(doc.post, { commentsCount });
      
      // 更新用户评论数
      const userCommentsCount = await mongoose.model('Comment').countDocuments({
        author: doc.author,
        isActive: true
      });
      
      await User.findByIdAndUpdate(doc.author, {
        commentsCount: userCommentsCount
      });
      
      // 更新父评论回复数
      if (doc.parentComment) {
        const repliesCount = await mongoose.model('Comment').countDocuments({
          parentComment: doc.parentComment,
          isActive: true
        });
        
        await mongoose.model('Comment').findByIdAndUpdate(doc.parentComment, {
          repliesCount
        });
      }
    } catch (error) {
      console.error('更新评论统计失败:', error);
    }
  }
});

// 实例方法：切换点赞状态
commentSchema.methods.toggleLike = function(userId) {
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
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => 
    like.user.toString() === userId.toString()
  );
};

// 静态方法：获取帖子的评论树
commentSchema.statics.getCommentTree = async function(postId) {
  const comments = await this.find({
    post: postId,
    isActive: true
  }).sort({ createdAt: 1 });
  
  // 构建评论树
  const commentMap = new Map();
  const rootComments = [];
  
  comments.forEach(comment => {
    commentMap.set(comment._id.toString(), {
      ...comment.toObject(),
      replies: []
    });
  });
  
  comments.forEach(comment => {
    const commentObj = commentMap.get(comment._id.toString());
    
    if (comment.parentComment) {
      const parent = commentMap.get(comment.parentComment.toString());
      if (parent) {
        parent.replies.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });
  
  return rootComments;
};

module.exports = mongoose.model('Comment', commentSchema);