# 🚀 快速部署指南

## 📋 部署前检查

### 1. 虚拟主机要求
- ✅ 支持Node.js环境
- ✅ 支持npm包管理器
- ✅ 支持SQLite数据库
- ✅ 开放80端口（或指定端口）

### 2. 准备文件
确保以下文件已准备好：
```
├── server-production.js    # 生产环境服务器
├── package.json            # 依赖配置
├── ecosystem.config.js     # PM2配置
├── deploy.sh              # 部署脚本
├── check-deployment.js    # 部署检查
└── public/                # 静态文件目录
```

## 🚀 一键部署

### 方法1：使用部署脚本（推荐）
```bash
# 1. 上传所有文件到虚拟主机
# 2. 在虚拟主机终端执行：
chmod +x deploy.sh
./deploy.sh
```

### 方法2：手动部署
```bash
# 1. 安装依赖
npm install

# 2. 安装PM2
npm install -g pm2

# 3. 启动应用
npm run pm2:start

# 4. 检查状态
npm run check
```

## 🔧 配置说明

### 1. 端口配置
如果虚拟主机使用其他端口，修改 `ecosystem.config.js`：
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 8080  // 改为您的端口
}
```

### 2. 域名配置
在虚拟主机控制面板中：
1. 绑定您的域名
2. 设置域名解析
3. 配置SSL证书（推荐）

### 3. 环境变量
创建 `.env` 文件：
```env
NODE_ENV=production
PORT=80
DB_PATH=./location_tracker.db
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📊 部署后检查

### 1. 检查服务状态
```bash
pm2 status
```

### 2. 查看日志
```bash
pm2 logs location-tracker
```

### 3. 运行测试
```bash
npm run check
```

### 4. 访问网站
打开浏览器访问：`http://your-domain.com`

## 🛠️ 常用命令

```bash
# 启动服务
npm run pm2:start

# 停止服务
npm run pm2:stop

# 重启服务
npm run pm2:restart

# 查看日志
npm run pm2:logs

# 检查部署
npm run check

# 查看状态
pm2 status
```

## 🔍 故障排除

### 问题1：端口被占用
```bash
# 查看端口占用
netstat -tulpn | grep :80
# 杀死进程
kill -9 PID
```

### 问题2：权限问题
```bash
# 设置文件权限
chmod 755 server-production.js
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

### 问题4：PM2启动失败
```bash
# 重新安装PM2
npm uninstall -g pm2
npm install -g pm2
# 重新启动
pm2 start ecosystem.config.js --env production
```

## 📱 移动端配置

### 1. HTTPS配置
移动端定位需要HTTPS，确保：
- SSL证书有效
- 域名支持HTTPS
- 端口443开放

### 2. 跨域配置
在 `server-production.js` 中配置：
```javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

## 🎯 部署成功标志

- ✅ 服务器正常启动
- ✅ 端口监听正常
- ✅ 数据库连接成功
- ✅ API接口响应正常
- ✅ 静态文件访问正常
- ✅ 移动端定位功能正常

## 📞 技术支持

如果遇到问题：
1. 检查虚拟主机是否支持Node.js
2. 确认端口配置正确
3. 验证域名解析
4. 查看错误日志
5. 运行部署检查脚本

## 🎉 部署完成

恭喜！您的网站已成功部署到云虚拟主机！

访问地址：`http://your-domain.com`
