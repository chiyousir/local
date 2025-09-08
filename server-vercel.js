const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Vercel环境配置
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const DB_PATH = process.env.DB_PATH || '/tmp/location_tracker.db';

// 中间件
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 数据库初始化
const db = new sqlite3.Database(DB_PATH);

// 创建用户表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    phone TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// 用户注册
app.post('/api/register', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号码和密码不能为空' });
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '请输入有效的手机号码' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (phone, password) VALUES (?, ?)', [phone, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: '该手机号码已注册' });
        }
        return res.status(500).json({ error: '注册失败' });
      }
      
      res.json({ 
        success: true, 
        message: '注册成功',
        userId: this.lastID 
      });
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号码和密码不能为空' });
  }

  db.get('SELECT * FROM users WHERE phone = ?', [phone], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '登录失败' });
    }
    
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }
    
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: '密码错误' });
      }
      
      res.json({ 
        success: true, 
        message: '登录成功',
        userId: user.id,
        phone: user.phone
      });
    } catch (error) {
      res.status(500).json({ error: '登录失败' });
    }
  });
});

// 查询用户位置
app.post('/api/location', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: '请输入手机号码' });
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '请输入有效的手机号码' });
  }

  db.get(`
    SELECT l.*, u.phone 
    FROM locations l 
    JOIN users u ON l.user_id = u.id 
    WHERE u.phone = ? 
    ORDER BY l.timestamp DESC 
    LIMIT 1
  `, [phone], (err, location) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    if (!location) {
      return res.status(404).json({ error: '未找到该用户的位置信息' });
    }
    
    res.json({
      success: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      }
    });
  });
});

// 保存位置信息
app.post('/api/save-location', (req, res) => {
  const { userId, phone, latitude, longitude, accuracy } = req.body;
  
  if (!userId || !phone || !latitude || !longitude) {
    return res.status(400).json({ error: '位置信息不完整' });
  }

  db.run(
    'INSERT INTO locations (user_id, phone, latitude, longitude, accuracy) VALUES (?, ?, ?, ?, ?)',
    [userId, phone, latitude, longitude, accuracy || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '保存位置失败' });
      }
      
      res.json({ 
        success: true, 
        message: '位置保存成功',
        locationId: this.lastID 
      });
    }
  );
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  socket.on('location-update', (data) => {
    socket.broadcast.emit('location-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 提供静态文件 - 主页面，负责路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// 处理index.html路由
 app.get('/index.html', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index-fixed.html'));
 });

// 处理login.html路由
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: NODE_ENV,
    platform: 'vercel'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '页面不存在' });
});

// Vercel需要导出app
module.exports = app;

// 本地开发时启动服务器
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`🌐 环境: ${NODE_ENV}`);
    console.log(`📁 数据库: ${DB_PATH}`);
    console.log(`📱 访问地址: http://localhost:${PORT}`);
  });
}
