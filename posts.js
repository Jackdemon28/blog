const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Post = require('../models/post');
const User = require('../models/user');

// JWT身份验证中间件
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: '无效的认证令牌' });
    }
};

// 获取所有博客文章
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username')
            .populate('comments.author', 'username')
            .sort({ createdAt: -1 });

        const formattedPosts = posts.map(post => ({
            id: post._id,
            title: post.title,
            content: post.content,
            author: post.author.username,
            date: post.createdAt.toLocaleDateString(),
            comments: post.comments.map(comment => ({
                content: comment.content,
                author: comment.author.username,
                date: comment.createdAt.toLocaleDateString()
            }))
        }));

        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ message: '获取文章列表失败', error: error.message });
    }
});

// 创建新博客文章
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = new Post({
            title,
            content,
            author: req.userId
        });

        await post.save();
        res.status(201).json({ message: '文章发布成功', postId: post._id });
    } catch (error) {
        res.status(500).json({ message: '发布文章失败', error: error.message });
    }
});

// 添加评论
router.post('/:postId/comments', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: '文章不存在' });
        }

        post.comments.push({
            content,
            author: req.userId
        });

        await post.save();
        res.status(201).json({ message: '评论发布成功' });
    } catch (error) {
        res.status(500).json({ message: '发布评论失败', error: error.message });
    }
});

module.exports = router;