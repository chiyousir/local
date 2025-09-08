const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);

// Socket.IO配置 - 修复404错误
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

// Vercel环境配置
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const MONGODB_URI = process.env.MONGODB_URI;

// 中间件
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB连接
let db;
let usersCollection;
let locationsCollection;

async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.log('⚠️  未配置MONGODB_URI，使用内存存储');
    return;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    usersCollection = db.collection('users');
    locationsCollection = db.collection('locations');
    
    // 创建索引
    await usersCollection.createIndex({ phone: 1 }, { unique: true });
    await locationsCollection.createIndex({ phone: 1 });
    await locationsCollection.createIndex({ timestamp: -1 });
    
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    console.log('🔄 使用内存存储作为备用方案');
  }
}

// 内存存储（备用方案）
let memoryUsers = new Map();
let memoryLocations = [];

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
    
    if (usersCollection) {
      // 使用MongoDB
      try {
        const result = await usersCollection.insertOne({
          phone,
          password: hashedPassword,
          created_at: new Date()
        });
        
        res.json({ 
          success: true, 
          message: '注册成功',
          userId: result.insertedId.toString()
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({ error: '该手机号码已注册' });
        }
        throw error;
      }
    } else {
      // 使用内存存储
      if (memoryUsers.has(phone)) {
        return res.status(400).json({ error: '该手机号码已注册' });
      }
      
      const userId = Date.now().toString();
      memoryUsers.set(phone, {
        id: userId,
        phone,
        password: hashedPassword,
        created_at: new Date()
      });
      
      res.json({ 
        success: true, 
        message: '注册成功',
        userId: userId
      });
    }
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号码和密码不能为空' });
  }

  try {
    let user;
    
    if (usersCollection) {
      // 使用MongoDB
      user = await usersCollection.findOne({ phone });
    } else {
      // 使用内存存储
      const userData = memoryUsers.get(phone);
      user = userData ? { _id: userData.id, phone: userData.phone, password: userData.password } : null;
    }
    
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '密码错误' });
    }
    
    res.json({ 
      success: true, 
      message: '登录成功',
      userId: user._id.toString(),
      phone: user.phone
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 查询用户位置 - 修复API路由
app.post('/api/location', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: '请输入手机号码' });
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: '请输入有效的手机号码' });
  }

  try {
    let location;
    
    if (locationsCollection) {
      // 使用MongoDB
      location = await locationsCollection.findOne(
        { phone },
        { sort: { timestamp: -1 } }
      );
    } else {
      // 使用内存存储
      const userLocations = memoryLocations.filter(loc => loc.phone === phone);
      location = userLocations.length > 0 ? userLocations[0] : null;
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
  } catch (error) {
    console.error('查询位置失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 保存位置信息
app.post('/api/save-location', async (req, res) => {
  const { userId, phone, latitude, longitude, accuracy } = req.body;
  
  if (!userId || !phone || !latitude || !longitude) {
    return res.status(400).json({ error: '位置信息不完整' });
  }

  try {
    const locationData = {
      user_id: userId,
      phone,
      latitude,
      longitude,
      accuracy: accuracy || 0,
      timestamp: new Date()
    };
    
    if (locationsCollection) {
      // 使用MongoDB
      const result = await locationsCollection.insertOne(locationData);
      res.json({ 
        success: true, 
        message: '位置保存成功',
        locationId: result.insertedId.toString()
      });
    } else {
      // 使用内存存储
      memoryLocations.unshift(locationData);
      // 只保留最近1000条记录
      if (memoryLocations.length > 1000) {
        memoryLocations = memoryLocations.slice(0, 1000);
      }
      
      res.json({ 
        success: true, 
        message: '位置保存成功',
        locationId: Date.now().toString()
      });
    }
  } catch (error) {
    console.error('保存位置失败:', error);
    res.status(500).json({ error: '保存位置失败' });
  }
});

// Socket.IO 连接处理 - 修复连接问题
io.on('connection', (socket) => {
  console.log('✅ 用户连接:', socket.id);
  
  socket.on('location-update', (data) => {
    console.log('📍 位置更新:', data);
    socket.broadcast.emit('location-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ 用户断开连接:', socket.id);
  });
});

// 提供静态文件
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 处理index.html路由
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    platform: 'vercel',
    database: usersCollection ? 'mongodb' : 'memory',
    socketio: 'enabled'
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
  connectToDatabase().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`🌐 环境: ${NODE_ENV}`);
      console.log(`📁 数据库: ${usersCollection ? 'MongoDB' : '内存存储'}`);
      console.log(`🔌 Socket.IO: 已启用`);
      console.log(`📱 访问地址: http://localhost:${PORT}`);
    });
  });
}
