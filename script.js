// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// 存储登录token
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let isLoggedIn = !!authToken;

// 获取博客列表
async function fetchBlogPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('获取博客列表失败:', error);
        return [];
    }
}

// 处理登录表单提交
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('登录失败');
        }
        
        const data = await response.json();
        authToken = data.token;
        currentUser = username;
        isLoggedIn = true;
        
        // 保存token到本地存储
        localStorage.setItem('authToken', authToken);
        
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        updateNavbar();
        await renderBlogPosts();
    } catch (error) {
        alert('登录失败: ' + error.message);
    }
});

// 处理博客发布表单提交
document.getElementById('blogForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!isLoggedIn) {
        alert('请先登录！');
        return;
    }
    
    const title = document.getElementById('blogTitle').value;
    const content = document.getElementById('blogContent').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                title,
                content
            })
        });
        
        if (!response.ok) {
            throw new Error('发布失败');
        }
        
        const postModal = bootstrap.Modal.getInstance(document.getElementById('postModal'));
        postModal.hide();
        await renderBlogPosts();
    } catch (error) {
        alert('发布失败: ' + error.message);
    }
});

// 更新导航栏显示
function updateNavbar() {
    const navItems = document.querySelector('.navbar-nav');
    if (isLoggedIn) {
        navItems.innerHTML = `
            <li class="nav-item">
                <span class="nav-link">欢迎, ${currentUser}</span>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#postModal">发布博客</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="logout()">退出</a>
            </li>
        `;
    } else {
        navItems.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">登录</a>
            </li>
        `;
    }
}

// 退出登录
function logout() {
    authToken = null;
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('authToken');
    updateNavbar();
    renderBlogPosts();
}

// 渲染博客文章列表
async function renderBlogPosts() {
    const blogPostsContainer = document.getElementById('blogPosts');
    blogPostsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const posts = await fetchBlogPosts();
        blogPostsContainer.innerHTML = '';
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'col-md-8 mx-auto';
            postElement.innerHTML = `
                <div class="blog-card">
                    <div class="card-body">
                        <h2 class="blog-title">${post.title}</h2>
                        <div class="blog-meta">
                            <span>作者: ${post.author}</span> | 
                            <span>发布于: ${post.date}</span>
                        </div>
                        <div class="blog-content">
                            ${post.content}
                        </div>
                        <div class="comments-section">
                            <h4>评论 (${post.comments.length})</h4>
                            ${renderComments(post.comments)}
                            ${isLoggedIn ? renderCommentForm(post.id) : ''}
                        </div>
                    </div>
                </div>
            `;
            blogPostsContainer.appendChild(postElement);
        });
        
        // 添加评论表单事件监听
        document.querySelectorAll('.comment-form').forEach(form => {
            form.addEventListener('submit', handleCommentSubmit);
        });
    } catch (error) {
        blogPostsContainer.innerHTML = '<div class="alert alert-danger">加载博客列表失败</div>';
    }
}

// 渲染评论列表
function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p>暂无评论</p>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-meta">
                <span>${comment.author}</span> | 
                <span>${comment.date}</span>
            </div>
            <div class="comment-content">
                ${comment.content}
            </div>
        </div>
    `).join('');
}

// 渲染评论表单
function renderCommentForm(postId) {
    return `
        <form class="comment-form mt-3" data-post-id="${postId}">
            <div class="mb-3">
                <textarea class="form-control" placeholder="写下你的评论..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">发表评论</button>
        </form>
    `;
}

// 处理评论提交
async function handleCommentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const postId = parseInt(form.dataset.postId);
    const content = form.querySelector('textarea').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            throw new Error('评论失败');
        }
        
        await renderBlogPosts();
        form.reset();
    } catch (error) {
        alert('评论失败: ' + error.message);
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    renderBlogPosts();
});