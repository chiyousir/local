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

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 数据库初始化
const db = new sqlite3.Database('location_tracker.db');

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

  // 验证手机号码格式
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

// 检查用户是否存在
app.post('/api/check-user', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: '请输入手机号码' });
  }

  // 验证手机号码格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '请输入有效的手机号码' });
  }

  db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        created_at: user.created_at
      }
    });
  });
});

// 查询用户位置
app.post('/api/location', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: '请输入手机号码' });
  }

  // 验证手机号码格式
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

// 查看所有位置记录（调试用）
app.get('/api/debug/locations', (req, res) => {
  db.all(`
    SELECT l.*, u.phone as user_phone 
    FROM locations l 
    LEFT JOIN users u ON l.user_id = u.id 
    ORDER BY l.timestamp DESC 
    LIMIT 50
  `, (err, locations) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({
      success: true,
      count: locations.length,
      locations: locations
    });
  });
});

// 查看所有用户（调试用）
app.get('/api/debug/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({
      success: true,
      count: users.length,
      users: users
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
    // 广播位置更新给所有连接的客户端
    socket.broadcast.emit('location-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 提供静态文件
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
