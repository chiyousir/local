# 云虚拟主机部署指南

## 📋 部署前准备

### 1. 检查虚拟主机环境
确保您的虚拟主机支持：
- ✅ Node.js 环境
- ✅ npm 包管理器
- ✅ SQLite 数据库
- ✅ 端口访问权限

### 2. 准备部署文件
需要上传的文件：
```
项目根目录/
├── server.js              # 服务器主文件
├── package.json           # 依赖配置
├── location_tracker.db    # 数据库文件（可选，会自动创建）
└── public/                # 静态文件目录
    ├── index.html
    ├── login.html
    ├── china-maps.js
    ├── coordinate-converter.js
    ├── map-test.html
    ├── coordinate-test.html
    ├── debug-location.html
    └── api-test.html
```

## 🚀 部署步骤

### 步骤1：上传文件
1. 使用FTP工具（如FileZilla）或虚拟主机控制面板
2. 将所有文件上传到虚拟主机的网站根目录
3. 确保文件权限正确（通常需要755权限）

### 步骤2：安装依赖
在虚拟主机终端中执行：
```bash
npm install
```

### 步骤3：配置环境变量
创建 `.env` 文件（可选）：
```env
PORT=3000
NODE_ENV=production
```

### 步骤4：启动服务
```bash
npm start
```

## 🔧 虚拟主机配置

### 1. 端口配置
大多数虚拟主机使用80端口（HTTP）或443端口（HTTPS）

修改 `server.js` 中的端口配置：
```javascript
const PORT = process.env.PORT || 80;  // 改为80端口
```

### 2. 域名绑定
在虚拟主机控制面板中：
1. 绑定您的域名
2. 设置域名解析到虚拟主机IP
3. 配置SSL证书（推荐）

### 3. 进程管理
使用PM2管理Node.js进程：
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "location-tracker"

# 设置开机自启
pm2 startup
pm2 save
```

## 📱 移动端优化

### 1. HTTPS配置
移动端定位需要HTTPS：
```javascript
// 在server.js中添加HTTPS支持
const https = require('https');
const fs = require('fs');

// 如果有SSL证书
const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

### 2. 跨域配置
确保CORS配置正确：
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

## 🛡️ 安全配置

### 1. 环境变量
敏感信息使用环境变量：
```javascript
const DB_PATH = process.env.DB_PATH || 'location_tracker.db';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

### 2. 访问限制
限制API访问：
```javascript
// 限制调试API只在开发环境使用
if (process.env.NODE_ENV === 'production') {
  app.use('/api/debug', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}
```

## 📊 监控和维护

### 1. 日志记录
添加日志功能：
```javascript
const fs = require('fs');

// 记录访问日志
app.use((req, res, next) => {
  const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
  fs.appendFileSync('access.log', log);
  next();
});
```

### 2. 数据库备份
定期备份数据库：
```bash
# 创建备份脚本
cp location_tracker.db backup_$(date +%Y%m%d).db
```

### 3. 性能监控
使用PM2监控：
```bash
pm2 monit
```

## 🔍 常见问题解决

### 问题1：端口被占用
```bash
# 查看端口占用
netstat -tulpn | grep :80
# 杀死占用进程
kill -9 PID
```

### 问题2：权限问题
```bash
# 修改文件权限
chmod 755 server.js
chmod 755 public/
chmod 666 location_tracker.db
```

### 问题3：依赖安装失败
```bash
# 清理缓存
npm cache clean --force
# 重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📞 技术支持

如果遇到问题，请检查：
1. 虚拟主机是否支持Node.js
2. 端口是否正确配置
3. 域名解析是否正确
4. SSL证书是否有效

## 🎯 部署检查清单

- [ ] 文件上传完成
- [ ] 依赖安装成功
- [ ] 端口配置正确
- [ ] 域名绑定成功
- [ ] SSL证书配置
- [ ] 进程管理设置
- [ ] 数据库权限正确
- [ ] 日志记录正常
- [ ] 备份策略制定
- [ ] 监控系统配置
