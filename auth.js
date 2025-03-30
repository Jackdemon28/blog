const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }
        
        // 创建新用户
        const user = new User({ username, password });
        await user.save();
        
        res.status(201).json({ message: '注册成功' });
    } catch (error) {
        res.status(500).json({ message: '注册失败', error: error.message });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        // 验证密码
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        
        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ message: '登录失败', error: error.message });
    }
});

module.exports = router;