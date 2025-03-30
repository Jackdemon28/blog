require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 连接MongoDB数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatoyant-blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('数据库连接成功');
}).catch(err => {
    console.error('数据库连接失败:', err);
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});