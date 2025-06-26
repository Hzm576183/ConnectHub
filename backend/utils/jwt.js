const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const generateTokenResponse = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  
  const token = generateToken(payload);
  
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      postsCount: user.postsCount,
      commentsCount: user.commentsCount,
      likesReceived: user.likesReceived,
      createdAt: user.createdAt
    }
  };
};

module.exports = {
  generateToken,
  verifyToken,
  generateTokenResponse
};